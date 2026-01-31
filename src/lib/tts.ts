/**
 * 발음 엔진(TTS)을 관리하는 유틸리티입니다.
 * 브라우저 내장 Web Speech API를 사용하여 고품질 음성을 선택합니다.
 */

let selectedVoice: SpeechSynthesisVoice | null = null;

// 고품질 일본어 음성 우선순위 (macOS/iOS Siri, Microsoft, Google 등)
const PREFERRED_JA_VOICES = [
    'Siri',
    'Kyoko',
    'Google 日本語',
    'Microsoft Nanami',
    'Microsoft Haruka'
];

/**
 * 사용 가능한 음성 리스트에서 최적의 일본어 음성을 찾습니다.
 */
const findBestJaVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined') return null;

    const voices = window.speechSynthesis.getVoices();
    const jaVoices = voices.filter(v => v.lang.startsWith('ja'));

    if (jaVoices.length === 0) return null;

    // 우선순위에 따른 검색
    for (const preferredName of PREFERRED_JA_VOICES) {
        const found = jaVoices.find(v => v.name.includes(preferredName));
        if (found) return found;
    }

    // 우선순위 음성이 없으면 일반 일본어 음성 중 첫 번째 반환
    return jaVoices[0];
};

/**
 * 브라우저가 음성 리스트를 비동기적으로 로드할 때를 대비한 초기화 로직
 */
if (typeof window !== 'undefined' && window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            selectedVoice = findBestJaVoice();
        };
    }
    // 즉시 로드 시도
    selectedVoice = findBestJaVoice();
}

// 클라이언트 사이드 오디오 객체 캐시
const audioCache = new Map<string, HTMLAudioElement>();
let currentAudio: HTMLAudioElement | null = null;

/**
 * 텍스트를 일본어로 읽어줍니다.
 * 1순위: 캐시된 오디오 객체 활용
 * 2순위: macOS 네이티브 고품질 TTS API (/api/tts)
 * 3순위: 브라우저 내장 Web Speech API (Fallback)
 */
export const speakJapanese = async (text: string) => {
    if (typeof window === 'undefined') return;

    try {
        // 이전 재생 중인 오디오가 있다면 중지
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        let audio = audioCache.get(text);

        if (!audio) {
            audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
            // 자주 사용되는 발음(가나 등)은 캐싱
            if (text.length < 5) {
                audioCache.set(text, audio);
            }
        } else {
            // 캐시된 객체라면 처음으로 되감기
            audio.currentTime = 0;
        }

        currentAudio = audio;

        // 오디오 재생
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn("OS TTS Playback failed, falling back to Web Speech API:", err);
                fallbackToWebSpeech(text);
            });
        }
    } catch (error) {
        console.error("TTS API Error:", error);
        fallbackToWebSpeech(text);
    }
};

/**
 * 브라우저 내장 API를 사용하는 폴백 로직
 */
const fallbackToWebSpeech = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    if (!selectedVoice) {
        selectedVoice = findBestJaVoice();
    }
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
};
