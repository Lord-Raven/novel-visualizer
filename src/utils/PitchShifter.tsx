// Granular pitch-shifter implemented as an AudioWorkletProcessor.
//
// Unlike changing an <audio> element's playbackRate, this resamples small
// overlapping "grains" of audio independently of the real-time sample clock,
// so pitch can be shifted up or down without altering the total duration of
// the signal passing through the node. It is intentionally paired with the
// time-stretch node (see TimeStretch.tsx): the time-stretch stage changes
// duration (and, as a side effect, pitch), and this stage is used to correct
// pitch back to the desired value independently of that rate change.
//
// The processor source is registered from a Blob URL so this stays a single
// bundled module with no extra static assets to ship alongside the library.

const PITCH_SHIFTER_PROCESSOR_NAME = 'novel-visualizer-pitch-shifter';

const PITCH_SHIFTER_PROCESSOR_SOURCE = `
class PitchShifterProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{ name: 'pitchRatio', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' }];
    }

    constructor() {
        super();
        this.grainSize = 4096;
        this.hop = Math.floor(this.grainSize / 4);
        // Grains start reading this far behind the write head so that, even at
        // the maximum supported pitch ratio, they never read past unwritten data.
        this.delay = this.grainSize * 3;
        this.bufferSize = this.grainSize * 6;
        this.channelStates = [];
        this.window = new Float32Array(this.grainSize);
        for (let i = 0; i < this.grainSize; i++) {
            this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (this.grainSize - 1));
        }
    }

    getChannelState(channelIndex) {
        let state = this.channelStates[channelIndex];
        if (!state) {
            state = {
                ringBuffer: new Float32Array(this.bufferSize),
                writeIndex: 0,
                samplesUntilNextGrain: 0,
                grains: []
            };
            this.channelStates[channelIndex] = state;
        }
        return state;
    }

    readRing(ringBuffer, position) {
        const size = this.bufferSize;
        let idx = position % size;
        if (idx < 0) idx += size;
        const i0 = Math.floor(idx);
        const i1 = (i0 + 1) % size;
        const frac = idx - i0;
        return ringBuffer[i0] * (1 - frac) + ringBuffer[i1] * frac;
    }

    processChannel(inputChannel, outputChannel, pitchRatio, state) {
        const ringBuffer = state.ringBuffer;
        const grains = state.grains;

        for (let i = 0; i < outputChannel.length; i++) {
            ringBuffer[state.writeIndex] = inputChannel ? (inputChannel[i] || 0) : 0;

            if (state.samplesUntilNextGrain <= 0) {
                state.samplesUntilNextGrain = this.hop;
                grains.push({ readPos: state.writeIndex - this.delay, age: 0 });
                if (grains.length > 6) {
                    grains.shift();
                }
            }
            state.samplesUntilNextGrain--;

            let sample = 0;
            for (let g = grains.length - 1; g >= 0; g--) {
                const grain = grains[g];
                if (grain.age >= this.grainSize) {
                    grains.splice(g, 1);
                    continue;
                }
                sample += this.readRing(ringBuffer, grain.readPos + grain.age * pitchRatio) * this.window[grain.age];
                grain.age++;
            }

            outputChannel[i] = sample * 0.5;
            state.writeIndex = (state.writeIndex + 1) % this.bufferSize;
        }
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const pitchRatio = parameters.pitchRatio[0];

        for (let ch = 0; ch < output.length; ch++) {
            const inputChannel = input && input[ch] ? input[ch] : null;
            const state = this.getChannelState(ch);
            this.processChannel(inputChannel, output[ch], pitchRatio, state);
        }

        return true;
    }
}

registerProcessor('${PITCH_SHIFTER_PROCESSOR_NAME}', PitchShifterProcessor);
`;

const registeredContexts = new WeakSet<AudioContext>();

/**
 * Registers the pitch-shifter AudioWorkletProcessor on the given context, if it
 * hasn't been registered already. Safe to call repeatedly for the same context.
 */
export const ensurePitchShifterWorklet = async (audioContext: AudioContext): Promise<void> => {
    if (registeredContexts.has(audioContext)) {
        return;
    }

    const blob = new Blob([PITCH_SHIFTER_PROCESSOR_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
        await audioContext.audioWorklet.addModule(url);
        registeredContexts.add(audioContext);
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * Creates a pitch-shifter node. `ensurePitchShifterWorklet` must be awaited on
 * this context first. `pitchRatio` is a frequency multiplier (2 = up an octave).
 */
export const createPitchShifterNode = (
    audioContext: AudioContext,
    pitchRatio: number,
    channelCount: number
): AudioWorkletNode => {
    return new AudioWorkletNode(audioContext, PITCH_SHIFTER_PROCESSOR_NAME, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount,
        channelCountMode: 'explicit',
        outputChannelCount: [channelCount],
        parameterData: { pitchRatio }
    });
};
