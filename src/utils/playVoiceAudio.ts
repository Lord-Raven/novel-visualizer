import type { NovelVoiceModulation } from '../types';
import { ensureBufferSourceWorklet, createBufferSourceNode, loadBufferSourceAudio, stopBufferSourceNode } from './TimeStretch';
import { ensurePitchShifterWorklet, createPitchShifterNode } from './PitchShifter';

const WARMTH_FREQUENCY = 300;
const BRIGHTNESS_FREQUENCY = 3000;
const NASALITY_FREQUENCY = 1500;
const NASALITY_Q = 1.2;

export interface VoiceAudioPlayback {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    ended: Promise<void>;
    stop: () => void;
}

interface NormalizedVoiceModulation {
    pitch: number;
    rate: number;
    volume: number;
    warmth: number;
    brightness: number;
    nasality: number;
}

const normalizeFiniteNumber = (value: number | undefined, fallback: number): number => {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const normalizeVoiceModulation = (voiceModulation: NovelVoiceModulation): NormalizedVoiceModulation => {
    const rate = normalizeFiniteNumber(voiceModulation.rate, 1);
    const volume = normalizeFiniteNumber(voiceModulation.volume, 1);

    return {
        pitch: normalizeFiniteNumber(voiceModulation.pitch, 0),
        rate: rate > 0 ? rate : 1,
        volume: volume >= 0 ? volume : 1,
        warmth: normalizeFiniteNumber(voiceModulation.warmth, 0),
        brightness: normalizeFiniteNumber(voiceModulation.brightness, 0),
        nasality: normalizeFiniteNumber(voiceModulation.nasality, 0)
    };
};

/**
 * Loads and plays an audio URL with the supplied voice modulation.
 *
 * Pass an AudioContext to reuse one owned by the consumer. When omitted, this
 * function creates a context and closes it after playback ends or is stopped.
 */
export const playVoiceAudio = async (
    audioUrl: string,
    voiceModulation: NovelVoiceModulation,
    audioContext?: AudioContext
): Promise<VoiceAudioPlayback> => {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
        throw new Error('Web Audio is unavailable in this environment.');
    }

    const ownsAudioContext = audioContext === undefined;
    const context = audioContext ?? new window.AudioContext();
    const modulation = normalizeVoiceModulation(voiceModulation);

    try {
        const response = await fetch(audioUrl, { mode: 'cors' });
        if (!response.ok) {
            throw new Error(`Unable to load audio: ${response.status} ${response.statusText}`);
        }

        const audioBuffer = await context.decodeAudioData(await response.arrayBuffer());
        await Promise.all([
            ensureBufferSourceWorklet(context),
            ensurePitchShifterWorklet(context)
        ]);

        const channelCount = audioBuffer.numberOfChannels;
        const pitchRatio = Math.pow(2, modulation.pitch / 12) / modulation.rate;
        const bufferSourceNode = createBufferSourceNode(context, modulation.rate, channelCount);
        const pitchShifterNode = createPitchShifterNode(context, pitchRatio, channelCount);

        const warmthFilter = context.createBiquadFilter();
        warmthFilter.type = 'lowshelf';
        warmthFilter.frequency.value = WARMTH_FREQUENCY;
        warmthFilter.gain.value = modulation.warmth;

        const brightnessFilter = context.createBiquadFilter();
        brightnessFilter.type = 'highshelf';
        brightnessFilter.frequency.value = BRIGHTNESS_FREQUENCY;
        brightnessFilter.gain.value = modulation.brightness;

        const nasalityFilter = context.createBiquadFilter();
        nasalityFilter.type = 'peaking';
        nasalityFilter.frequency.value = NASALITY_FREQUENCY;
        nasalityFilter.Q.value = NASALITY_Q;
        nasalityFilter.gain.value = modulation.nasality;

        const gainNode = context.createGain();
        gainNode.gain.value = modulation.volume;

        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.7;

        bufferSourceNode.connect(pitchShifterNode);
        pitchShifterNode.connect(warmthFilter);
        warmthFilter.connect(brightnessFilter);
        brightnessFilter.connect(nasalityFilter);
        nasalityFilter.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(context.destination);

        let resolveEnded: () => void;
        const ended = new Promise<void>((resolve) => {
            resolveEnded = resolve;
        });
        let stopped = false;

        const stop = (): void => {
            if (stopped) {
                return;
            }
            stopped = true;
            stopBufferSourceNode(bufferSourceNode);
            bufferSourceNode.disconnect();
            pitchShifterNode.disconnect();
            warmthFilter.disconnect();
            brightnessFilter.disconnect();
            nasalityFilter.disconnect();
            gainNode.disconnect();
            analyser.disconnect();
            resolveEnded();

            if (ownsAudioContext) {
                void context.close().catch(() => undefined);
            }
        };

        bufferSourceNode.port.onmessage = (event: MessageEvent) => {
            if (event.data?.type === 'ended') {
                stop();
            }
        };

        if (context.state === 'suspended') {
            await context.resume();
        }

        loadBufferSourceAudio(bufferSourceNode, audioBuffer);

        return { audioContext: context, analyser, ended, stop };
    } catch (error) {
        if (ownsAudioContext) {
            await context.close().catch(() => undefined);
        }
        throw error;
    }
};
