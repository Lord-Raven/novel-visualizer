// Buffer-driven playback node implemented as an AudioWorkletProcessor.
//
// This replaces feeding a live <audio> element into the Web Audio graph.
// Instead, the full decoded PCM data for a line of dialogue is handed to this
// worklet up front, and it advances through that buffer at an independently
// controllable `rate`. Because the node fully owns pacing through the source
// samples, `rate` changes the duration of the resulting audio without going
// through HTMLMediaElement.playbackRate.
//
// Changing `rate` inevitably also shifts pitch by the same ratio (it's just
// resampling), so this node is meant to be followed by the pitch-shifter node
// (see PitchShifter.tsx) configured with a compensating ratio to land on
// whatever final pitch is desired, independent of rate.

const BUFFER_SOURCE_PROCESSOR_NAME = 'novel-visualizer-buffer-source';

const BUFFER_SOURCE_PROCESSOR_SOURCE = `
class BufferSourceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{ name: 'rate', defaultValue: 1, minValue: 0.1, maxValue: 4, automationRate: 'k-rate' }];
    }

    constructor() {
        super();
        this.channels = null;
        this.length = 0;
        this.readPosition = 0;
        this.ended = false;
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data && data.type === 'load') {
                this.channels = data.channels.map((buffer) => new Float32Array(buffer));
                this.length = this.channels[0] ? this.channels[0].length : 0;
                this.readPosition = 0;
                this.ended = false;
            } else if (data && data.type === 'stop') {
                this.ended = true;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const rate = parameters.rate[0];

        if (!this.channels || this.ended) {
            return !this.ended;
        }

        for (let i = 0; i < output[0].length; i++) {
            if (this.readPosition >= this.length - 1) {
                if (!this.ended) {
                    this.ended = true;
                    this.port.postMessage({ type: 'ended' });
                }
                for (let ch = 0; ch < output.length; ch++) {
                    output[ch][i] = 0;
                }
                continue;
            }

            const idx = Math.floor(this.readPosition);
            const frac = this.readPosition - idx;

            for (let ch = 0; ch < output.length; ch++) {
                const channelData = this.channels[Math.min(ch, this.channels.length - 1)];
                const s0 = channelData[idx] || 0;
                const s1 = channelData[idx + 1] || 0;
                output[ch][i] = s0 + (s1 - s0) * frac;
            }

            this.readPosition += rate;
        }

        return true;
    }
}

registerProcessor('${BUFFER_SOURCE_PROCESSOR_NAME}', BufferSourceProcessor);
`;

const registeredContexts = new WeakSet<AudioContext>();

/**
 * Registers the buffer-source AudioWorkletProcessor on the given context, if it
 * hasn't been registered already. Safe to call repeatedly for the same context.
 */
export const ensureBufferSourceWorklet = async (audioContext: AudioContext): Promise<void> => {
    if (registeredContexts.has(audioContext)) {
        return;
    }

    const blob = new Blob([BUFFER_SOURCE_PROCESSOR_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
        await audioContext.audioWorklet.addModule(url);
        registeredContexts.add(audioContext);
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * Creates a buffer-source node. `ensureBufferSourceWorklet` must be awaited on
 * this context first. Call `loadBufferSourceAudio` to give it PCM data to play.
 */
export const createBufferSourceNode = (audioContext: AudioContext, rate: number, channelCount: number): AudioWorkletNode => {
    return new AudioWorkletNode(audioContext, BUFFER_SOURCE_PROCESSOR_NAME, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        channelCount,
        channelCountMode: 'explicit',
        outputChannelCount: [channelCount],
        parameterData: { rate }
    });
};

/** Sends decoded PCM data to a buffer-source node so it can begin generating audio. */
export const loadBufferSourceAudio = (node: AudioWorkletNode, audioBuffer: AudioBuffer): void => {
    const channels: ArrayBuffer[] = [];
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        channels.push(audioBuffer.getChannelData(ch).slice().buffer);
    }
    node.port.postMessage({ type: 'load', channels }, channels);
};

/** Signals a buffer-source node to stop generating audio and become idle. */
export const stopBufferSourceNode = (node: AudioWorkletNode): void => {
    node.port.postMessage({ type: 'stop' });
};
