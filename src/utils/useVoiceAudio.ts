import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NovelVoiceModulation } from '../types';
import { ensureBufferSourceWorklet, createBufferSourceNode, loadBufferSourceAudio, stopBufferSourceNode } from './TimeStretch';
import { ensurePitchShifterWorklet, createPitchShifterNode } from './PitchShifter';

// Frequency/Q constants for the EQ-style modulation filters.
const WARMTH_FREQUENCY = 300; // low-mid voice body
const BRIGHTNESS_FREQUENCY = 3000; // presence region
const NASALITY_FREQUENCY = 1500; // nasal formant region
const NASALITY_Q = 1.2;

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

const normalizeVoiceModulation = (voiceModulation: NovelVoiceModulation | undefined): NormalizedVoiceModulation => {
    const rate = normalizeFiniteNumber(voiceModulation?.rate, 1);
    const volume = normalizeFiniteNumber(voiceModulation?.volume, 1);
    return {
        pitch: normalizeFiniteNumber(voiceModulation?.pitch, 0),
        rate: rate > 0 ? rate : 1,
        volume: volume >= 0 ? volume : 1,
        warmth: normalizeFiniteNumber(voiceModulation?.warmth, 0),
        brightness: normalizeFiniteNumber(voiceModulation?.brightness, 0),
        nasality: normalizeFiniteNumber(voiceModulation?.nasality, 0)
    };
};

// Converts +/- semitones into a frequency ratio for the pitch-shifter node.
const semitonesToRatio = (semitones: number): number => Math.pow(2, semitones / 12);

export interface UseVoiceAudioResult {
    isAudioPlaying: boolean;
    audioAnalyser: AnalyserNode | null;
}

/**
 * Loads and plays a line of dialogue's speech audio through a Web Audio graph
 * that applies pitch/rate/volume/warmth/brightness/nasality voice modulation.
 *
 * Rate (duration) and pitch are decoupled via separate AudioWorklet nodes (see
 * TimeStretch.tsx and PitchShifter.tsx) rather than HTMLMediaElement.playbackRate,
 * so none of this ever affects a caller's text typing animation.
 *
 * `playbackKey` identifies the current line (e.g. its script index); audio is
 * (re)loaded whenever it changes, while `voiceModulation` changes are applied
 * live to the existing graph without interrupting playback.
 */
export const useVoiceAudio = (
    enabled: boolean,
    speechUrl: string | undefined,
    playbackKey: number,
    voiceModulation: NovelVoiceModulation | undefined
): UseVoiceAudioResult => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentBufferSourceNodeRef = useRef<AudioWorkletNode | null>(null);
    const currentPitchShifterNodeRef = useRef<AudioWorkletNode | null>(null);
    const currentAudioAnalyserRef = useRef<AnalyserNode | null>(null);
    const currentAudioWarmthFilterRef = useRef<BiquadFilterNode | null>(null);
    const currentAudioBrightnessFilterRef = useRef<BiquadFilterNode | null>(null);
    const currentAudioNasalityFilterRef = useRef<BiquadFilterNode | null>(null);
    const currentAudioGainRef = useRef<GainNode | null>(null);
    const audioLoadTokenRef = useRef<number>(0);
    const prevPlaybackKeyRef = useRef<number>(playbackKey);

    const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
    const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);

    const normalizedModulation = useMemo(() => normalizeVoiceModulation(voiceModulation), [voiceModulation]);

    // The buffer-source node's `rate` controls duration and, as a side effect,
    // shifts pitch by the same ratio. The pitch-shifter node's ratio corrects
    // for that so the audio lands on the desired final pitch regardless of rate.
    const pitchShifterRatio = useMemo(
        () => semitonesToRatio(normalizedModulation.pitch) / normalizedModulation.rate,
        [normalizedModulation]
    );

    const cleanupAudioGraph = useCallback(() => {
        if (currentBufferSourceNodeRef.current) {
            stopBufferSourceNode(currentBufferSourceNodeRef.current);
        }
        currentBufferSourceNodeRef.current?.disconnect();
        currentPitchShifterNodeRef.current?.disconnect();
        currentAudioWarmthFilterRef.current?.disconnect();
        currentAudioBrightnessFilterRef.current?.disconnect();
        currentAudioNasalityFilterRef.current?.disconnect();
        currentAudioGainRef.current?.disconnect();
        currentAudioAnalyserRef.current?.disconnect();
        currentBufferSourceNodeRef.current = null;
        currentPitchShifterNodeRef.current = null;
        currentAudioWarmthFilterRef.current = null;
        currentAudioBrightnessFilterRef.current = null;
        currentAudioNasalityFilterRef.current = null;
        currentAudioGainRef.current = null;
        currentAudioAnalyserRef.current = null;
        setAudioAnalyser(null);
    }, []);

    // Applies a voice modulation to the currently attached audio graph nodes.
    // `rate` and `pitch` are AudioParams on the buffer-source/pitch-shifter nodes
    // (see the effect below), since those two must stay in sync with each other.
    const applyModulationToGraph = useCallback((modulation: NormalizedVoiceModulation) => {
        currentAudioGainRef.current && (currentAudioGainRef.current.gain.value = modulation.volume);
        currentAudioWarmthFilterRef.current && (currentAudioWarmthFilterRef.current.gain.value = modulation.warmth);
        currentAudioBrightnessFilterRef.current && (currentAudioBrightnessFilterRef.current.gain.value = modulation.brightness);
        currentAudioNasalityFilterRef.current && (currentAudioNasalityFilterRef.current.gain.value = modulation.nasality);
    }, []);

    // Builds the Web Audio graph for a decoded line of dialogue and starts playback.
    const buildAudioGraph = useCallback(async (
        audioBuffer: AudioBuffer,
        rate: number,
        pitchRatio: number,
        modulation: NormalizedVoiceModulation
    ): Promise<AnalyserNode | null> => {
        if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
            cleanupAudioGraph();
            return null;
        }

        try {
            const audioContext = audioContextRef.current ?? new window.AudioContext();
            audioContextRef.current = audioContext;

            await Promise.all([
                ensureBufferSourceWorklet(audioContext),
                ensurePitchShifterWorklet(audioContext)
            ]);

            cleanupAudioGraph();

            const channelCount = audioBuffer.numberOfChannels;
            const bufferSourceNode = createBufferSourceNode(audioContext, rate, channelCount);
            const pitchShifterNode = createPitchShifterNode(audioContext, pitchRatio, channelCount);

            const warmthFilter = audioContext.createBiquadFilter();
            warmthFilter.type = 'lowshelf';
            warmthFilter.frequency.value = WARMTH_FREQUENCY;
            warmthFilter.gain.value = modulation.warmth;

            const brightnessFilter = audioContext.createBiquadFilter();
            brightnessFilter.type = 'highshelf';
            brightnessFilter.frequency.value = BRIGHTNESS_FREQUENCY;
            brightnessFilter.gain.value = modulation.brightness;

            const nasalityFilter = audioContext.createBiquadFilter();
            nasalityFilter.type = 'peaking';
            nasalityFilter.frequency.value = NASALITY_FREQUENCY;
            nasalityFilter.Q.value = NASALITY_Q;
            nasalityFilter.gain.value = modulation.nasality;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = modulation.volume;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.7;

            bufferSourceNode.connect(pitchShifterNode);
            pitchShifterNode.connect(warmthFilter);
            warmthFilter.connect(brightnessFilter);
            brightnessFilter.connect(nasalityFilter);
            nasalityFilter.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            currentBufferSourceNodeRef.current = bufferSourceNode;
            currentPitchShifterNodeRef.current = pitchShifterNode;
            currentAudioWarmthFilterRef.current = warmthFilter;
            currentAudioBrightnessFilterRef.current = brightnessFilter;
            currentAudioNasalityFilterRef.current = nasalityFilter;
            currentAudioGainRef.current = gainNode;
            currentAudioAnalyserRef.current = analyser;
            setAudioAnalyser(analyser);

            if (audioContext.state === 'suspended') {
                await audioContext.resume().catch((error) => {
                    console.error('Error resuming audio context:', error);
                });
            }

            loadBufferSourceAudio(bufferSourceNode, audioBuffer);

            return analyser;
        } catch (error) {
            console.warn('Audio graph unavailable; continuing without playback.', error);
            cleanupAudioGraph();
            return null;
        }
    }, [cleanupAudioGraph]);

    useEffect(() => {
        if (prevPlaybackKeyRef.current === playbackKey) {
            return;
        }
        prevPlaybackKeyRef.current = playbackKey;

        setIsAudioPlaying(false);
        cleanupAudioGraph();

        const loadToken = ++audioLoadTokenRef.current;

        if (!enabled || !speechUrl) {
            return;
        }

        const abortController = new AbortController();

        (async () => {
            try {
                if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
                    return;
                }

                const audioContext = audioContextRef.current ?? new window.AudioContext();
                audioContextRef.current = audioContext;

                const response = await fetch(speechUrl, { signal: abortController.signal, mode: 'cors' });
                const arrayBuffer = await response.arrayBuffer();

                // Bail out if a newer line started loading while this one was in flight.
                if (loadToken !== audioLoadTokenRef.current) {
                    return;
                }

                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                if (loadToken !== audioLoadTokenRef.current) {
                    return;
                }

                const analyser = await buildAudioGraph(audioBuffer, normalizedModulation.rate, pitchShifterRatio, normalizedModulation);

                if (loadToken !== audioLoadTokenRef.current) {
                    cleanupAudioGraph();
                    return;
                }

                setIsAudioPlaying(true);

                const bufferSourceNode = currentBufferSourceNodeRef.current;
                if (bufferSourceNode) {
                    bufferSourceNode.port.onmessage = (event: MessageEvent) => {
                        if (event.data?.type === 'ended' && loadToken === audioLoadTokenRef.current) {
                            setIsAudioPlaying(false);
                        }
                    };
                }
            } catch (error) {
                if ((error as { name?: string })?.name !== 'AbortError') {
                    console.error('Error loading audio:', error);
                }
                if (loadToken === audioLoadTokenRef.current) {
                    setIsAudioPlaying(false);
                }
            }
        })();

        return () => {
            abortController.abort();
        };
        // Modulation/rate/pitch changes for the *current* line are applied live by the
        // effect below; only a new playbackKey (or enabled/speechUrl) should reload audio.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackKey, enabled, speechUrl]);

    useEffect(() => {
        const currentTime = audioContextRef.current?.currentTime ?? 0;
        currentBufferSourceNodeRef.current?.parameters.get('rate')?.setValueAtTime(normalizedModulation.rate, currentTime);
        currentPitchShifterNodeRef.current?.parameters.get('pitchRatio')?.setValueAtTime(pitchShifterRatio, currentTime);
        applyModulationToGraph(normalizedModulation);
    }, [normalizedModulation, pitchShifterRatio, applyModulationToGraph]);

    useEffect(() => {
        setIsAudioPlaying(false);
        cleanupAudioGraph();
    }, [enabled, cleanupAudioGraph]);

    useEffect(() => {
        return () => {
            cleanupAudioGraph();
            if (audioContextRef.current) {
                void audioContextRef.current.close().catch(() => undefined);
                audioContextRef.current = null;
            }
        };
    }, [cleanupAudioGraph]);

    return { isAudioPlaying, audioAnalyser };
};
