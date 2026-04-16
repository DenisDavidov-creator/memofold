// --- Helper: play audio URL, resolve true on success ---
const playAudioUrl = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;
    const done = (ok: boolean) => { if (!settled) { settled = true; resolve(ok); } };

    audio.onerror = () => done(false);
    audio.src = url;

    // play() returns Promise — resolves when playback actually starts
    audio.play().then(() => done(true)).catch(() => done(false));

    setTimeout(() => done(false), 5000);
  });

// --- Source 1: dictionaryapi.dev (Wiktionary recordings) ---
const playFromDictionary = async (word: string): Promise<boolean> => {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase().trim())}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    const phonetics: { audio?: string }[] = data[0]?.phonetics ?? [];
    const audioUrl =
      phonetics.find(p => p.audio?.includes('-us'))?.audio ||
      phonetics.find(p => p.audio)?.audio;
    if (!audioUrl) return false;
    return playAudioUrl(audioUrl);
  } catch {
    return false;
  }
};

// --- Source 2: Google Translate TTS (unofficial, works via Audio element) ---
const playFromGoogle = (text: string): Promise<boolean> => {
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8` +
    `&q=${encodeURIComponent(text)}&tl=en-US&client=tw-ob&ttsspeed=0.8`;
  return playAudioUrl(url);
};

// --- Source 3: Merriam-Webster (predictable URL pattern, no key needed) ---
const playFromMerriam = (word: string): Promise<boolean> => {
  const w = word.toLowerCase().trim();
  // MW audio path: first 2 chars of word as subdirectory
  const subdir = w.startsWith('bix') ? 'bix'
    : w.startsWith('gg') ? 'gg'
    : /^[^a-z]/.test(w) ? 'number'
    : w[0];
  const url = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${w}01.mp3`;
  return playAudioUrl(url);
};

// --- Browser TTS fallback (for sentences / when dictionary has no entry) ---
const VOICE_PRIORITY = [
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name === 'Google US English',
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.includes('Google'),
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online')),
  (v: SpeechSynthesisVoice) => v.lang === 'en-US' && !v.localService,
  (v: SpeechSynthesisVoice) => v.lang === 'en-US',
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
];

let cachedVoice: SpeechSynthesisVoice | null | undefined = undefined;

const pickBestVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  for (const check of VOICE_PRIORITY) {
    const found = voices.find(check);
    if (found) { cachedVoice = found; return found; }
  }
  cachedVoice = null;
  return null;
};

if (typeof window !== 'undefined') {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoice = undefined;
    pickBestVoice();
  });
}

const speakFallback = (text: string) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.88;
  const voice = pickBestVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
};

// --- Public API ---
// 1. dictionaryapi.dev  → 2. Merriam-Webster → 3. Google TTS → 4. browser TTS
export const speakEnglish = async (text: string): Promise<void> => {
  const isSingleWord = !text.trim().includes(' ');

  if (isSingleWord) {
    if (await playFromDictionary(text)) return;
    if (await playFromMerriam(text)) return;
  }

  if (await playFromGoogle(text)) return;

  speakFallback(text);
};
