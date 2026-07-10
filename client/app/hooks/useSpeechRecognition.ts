'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Shared browser-native speech-to-text hook (Web Speech API — zero new
// dependencies), used by both the Store Owner voice product-entry flow
// (ProductModal) and the Customer voice-ordering flow (bulk-purchase page)
// so neither duplicates the SpeechRecognition setup/teardown wiring.
//
// Deliberately does NOT translate — it only converts speech to text in
// whichever language was selected. The resulting (possibly non-English)
// transcript is sent to `/api/voice-product-parse` or `/api/voice-purchase-
// list`, which reuse the existing `indicTranslate()` IndicTrans2 pipeline
// server-side, exactly like every OCR-based route already does.

export interface VoiceLanguageOption {
  code: string;   // BCP-47 locale passed to SpeechRecognition
  short: string;  // ISO 639-1 code sent to the backend as `sourceLang`
  label: string;
}

export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'en-IN', short: 'en', label: 'English' },
  { code: 'ta-IN', short: 'ta', label: 'Tamil' },
  { code: 'te-IN', short: 'te', label: 'Telugu' },
  { code: 'kn-IN', short: 'kn', label: 'Kannada' },
  { code: 'ml-IN', short: 'ml', label: 'Malayalam' },
];

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string;
  start: (lang: VoiceLanguageOption) => void;
  stop: () => void;
}

export function useSpeechRecognition(onFinalResult?: (transcript: string) => void): UseSpeechRecognitionResult {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  const supported = typeof window !== 'undefined'
    && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback((lang: VoiceLanguageOption) => {
    if (!supported) {
      setError("Voice input isn't supported in this browser — try Chrome or Edge.");
      return;
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang.code;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError('');

    recognition.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${res[0].transcript}`.trim();
        } else {
          interimText += res[0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      setError(event.error === 'not-allowed' ? 'Microphone access was denied.' : `Voice input error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
      const final = finalTranscriptRef.current.trim();
      if (final) onFinalResultRef.current?.(final);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [supported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  return { supported, listening, transcript, interimTranscript, error, start, stop };
}
