import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NovelVoiceModulation } from '../types';

// Frequency/Q constants for the EQ-style modulation filters.
const WARMTH_FREQUENCY = 300; // low-mid voice body
const BRIGHTNESS_FREQUENCY = 3000; // presence region
const NASALITY_FREQUENCY = 1500; // nasal formant region
const NASALITY_Q = 1.2;

interface NormalizedVoiceModulation {
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
        rate: rate > 0 ? rate : 1,
        volume: volume >= 0 ? volume : 1,
        warmth: normalizeFiniteNumber(voiceModulation?.warmth, 0),
        brightness: normalizeFiniteNumber(voiceModulation?.brightness, 0),
        nasality: normalizeFiniteNumber(voiceModulation?.nasality, 0)
    };
};

export interface UseVoiceAudioResult {
    isAudioPlaying: boolean;
    audioAnalyser: AnalyserNode | null;
}

/**
 * Loads and plays a line of dialogue's speech audio through a Web Audio graph
 * that applies rate/volume/warmth/brightness/nasality voice modulation.
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
    const currentBufferSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
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

    const cleanupAudioGraph = useCallback(() => {
        if (currentBufferSourceNodeRef.current) {
            currentBufferSourceNodeRef.current.onended = null;
            try {
                currentBufferSourceNodeRef.current.stop();
            } catch {
                // Already stopped.
            }
        }
        currentBufferSourceNodeRef.current?.disconnect();
        currentAudioWarmthFilterRef.current?.disconnect();
        currentAudioBrightnessFilterRef.current?.disconnect();
        currentAudioNasalityFilterRef.current?.disconnect();
        currentAudioGainRef.current?.disconnect();
        currentAudioAnalyserRef.current?.disconnect();
        currentBufferSourceNodeRef.current = null;
        currentAudioWarmthFilterRef.current = null;
        currentAudioBrightnessFilterRef.current = null;
        currentAudioNasalityFilterRef.current = null;
        currentAudioGainRef.current = null;
        currentAudioAnalyserRef.current = null;
        setAudioAnalyser(null);
    }, []);

    // Applies a voice modulation to the currently attached audio graph nodes.
    const applyModulationToGraph = useCallback((modulation: NormalizedVoiceModulation) => {
        currentAudioGainRef.current && (currentAudioGainRef.current.gain.value = modulation.volume);
        currentAudioWarmthFilterRef.current && (currentAudioWarmthFilterRef.current.gain.value = modulation.warmth);
        currentAudioBrightnessFilterRef.current && (currentAudioBrightnessFilterRef.current.gain.value = modulation.brightness);
        currentAudioNasalityFilterRef.current && (currentAudioNasalityFilterRef.current.gain.value = modulation.nasality);
    }, []);

    // Builds the Web Audio graph for a decoded line of dialogue and starts playback.
    const buildAudioGraph = useCallback((
        audioBuffer: AudioBuffer,
        modulation: NormalizedVoiceModulation
    ): AnalyserNode | null => {
        if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
            cleanupAudioGraph();
            return null;
        }

        try {
            const audioContext = audioContextRef.current ?? new window.AudioContext();
            audioContextRef.current = audioContext;

            cleanupAudioGraph();

            const bufferSourceNode = audioContext.createBufferSource();
            bufferSourceNode.buffer = audioBuffer;
            bufferSourceNode.playbackRate.value = modulation.rate;

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

            bufferSourceNode.connect(warmthFilter);
            warmthFilter.connect(brightnessFilter);
            brightnessFilter.connect(nasalityFilter);
            nasalityFilter.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);

            currentBufferSourceNodeRef.current = bufferSourceNode;
            currentAudioWarmthFilterRef.current = warmthFilter;
            currentAudioBrightnessFilterRef.current = brightnessFilter;
            currentAudioNasalityFilterRef.current = nasalityFilter;
            currentAudioGainRef.current = gainNode;
            currentAudioAnalyserRef.current = analyser;
            setAudioAnalyser(analyser);

            if (audioContext.state === 'suspended') {
                void audioContext.resume().catch((error) => {
                    console.error('Error resuming audio context:', error);
                });
            }

            bufferSourceNode.start();

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

                const analyser = buildAudioGraph(audioBuffer, normalizedModulation);

                if (loadToken !== audioLoadTokenRef.current) {
                    cleanupAudioGraph();
                    return;
                }

                setIsAudioPlaying(true);

                const bufferSourceNode = currentBufferSourceNodeRef.current;
                if (bufferSourceNode) {
                    bufferSourceNode.onended = () => {
                        if (loadToken === audioLoadTokenRef.current) {
                            setIsAudioPlaying(false);
                        }
                    };
                }

                if (!analyser) {
                    setIsAudioPlaying(false);
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
        // Modulation/rate changes for the *current* line are applied live by the
        // effect below; only a new playbackKey (or enabled/speechUrl) should reload audio.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbackKey, enabled, speechUrl]);

    useEffect(() => {
        const currentTime = audioContextRef.current?.currentTime ?? 0;
        currentBufferSourceNodeRef.current?.playbackRate.setValueAtTime(normalizedModulation.rate, currentTime);
        applyModulationToGraph(normalizedModulation);
    }, [normalizedModulation, applyModulationToGraph]);

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
