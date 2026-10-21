import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const voices = require('@lord-raven/novel-visualizer');

test('package root exports the complete ActorVoice runtime API', () => {
    for (const name of [
        'DEFAULT_VOICE_MODULATION',
        'normalizeVoiceModulation',
        'ACTOR_VOICE_ACCENTS',
        'ACTOR_VOICE_GENDER_LABELS',
        'ACTOR_VOICES',
        'getActorVoice',
        'formatActorVoiceLabel',
        'getActorVoiceVolume'
    ]) {
        assert.ok(Object.hasOwn(voices, name), `Missing public export: ${name}`);
    }
});

test('public catalog helpers expose voice metadata and preserve missing-ID behavior', () => {
    const voice = voices.ACTOR_VOICES[0];
    assert.ok(voice);
    assert.equal(voices.getActorVoice(voice.id), voice);
    assert.ok(voices.ACTOR_VOICE_ACCENTS.includes(voice.accent));
    assert.equal(
        voices.formatActorVoiceLabel(voice),
        `${voices.ACTOR_VOICE_GENDER_LABELS[voice.gender]} - ${voice.accent} - ${voice.description}`
    );
    const quietVoice = voices.ACTOR_VOICES.find(entry => entry.volumeModifier !== 1);
    assert.ok(quietVoice);
    assert.equal(voices.getActorVoiceVolume(quietVoice.id), quietVoice.volumeModifier);
    for (const id of [undefined, '', 'unknown-voice']) {
        assert.equal(voices.getActorVoice(id), undefined);
        assert.equal(voices.getActorVoiceVolume(id), 1);
    }
});

test('public modulation helper retains defaults, numeric parsing, and bounds', () => {
    assert.deepEqual(voices.normalizeVoiceModulation(undefined), voices.DEFAULT_VOICE_MODULATION);
    assert.deepEqual(voices.normalizeVoiceModulation(1.1), {
        rate: 1.1, warmth: 0, brightness: 0, nasality: 0
    });
    assert.deepEqual(voices.normalizeVoiceModulation({
        rate: '2', warmth: -20, brightness: 20, nasality: '3'
    }), { rate: 1.2, warmth: -12, brightness: 12, nasality: 3 });
    assert.deepEqual(voices.normalizeVoiceModulation({
        rate: 0, warmth: Infinity, brightness: '', nasality: NaN
    }), { rate: 0.8, warmth: 0, brightness: 0, nasality: 0 });
});
