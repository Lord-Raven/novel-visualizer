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
// Catmull-Rom cubic interpolation; linear interpolation of grain reads is a
// major source of the buzzy/aliased sound of naive granular pitch shifting.
function cubicInterpolate(y0, y1, y2, y3, t) {
    const a0 = y3 - y2 - y0 + y1;
    const a1 = y0 - y1 - a0;
    const a2 = y2 - y0;
    const a3 = y1;
    return ((a0 * t + a1) * t + a2) * t + a3;
}

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
        // Periodic (not symmetric) Hann window: with hop = grainSize / 4 this sums
        // to a flat constant (COLA), avoiding the amplitude ripple/warble a
        // symmetric window produces under overlap-add.
        for (let i = 0; i < this.grainSize; i++) {
            this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.grainSize);
        }
        // Compensates for the constant gain introduced by summing 4 overlapping
        // Hann-windowed grains (COLA sum = 1.5 at 75% overlap).
        this.olaGain = 1 / 1.5;
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
        const i1 = Math.floor(idx);
        const frac = idx - i1;
        const i0 = (i1 - 1 + size) % size;
        const i2 = (i1 + 1) % size;
        const i3 = (i1 + 2) % size;
        return cubicInterpolate(ringBuffer[i0], ringBuffer[i1], ringBuffer[i2], ringBuffer[i3], frac);
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

            outputChannel[i] = sample * this.olaGain;
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
