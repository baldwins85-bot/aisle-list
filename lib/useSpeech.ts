"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

// Minimal typings for the Web Speech API (not in lib.dom for all setups).
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as new () => SpeechRecognitionLike) ||
    (w.webkitSpeechRecognition as new () => SpeechRecognitionLike) ||
    null
  );
}

export interface UseSpeechResult {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

const isNative = () => Capacitor.isNativePlatform();

/**
 * Continuous speech recognition with two engines:
 *
 * - Native (Capacitor iOS/Android): Apple's SFSpeechRecognizer via the
 *   @capacitor-community/speech-recognition plugin. Microphone + speech
 *   permission is requested once and remembered by the OS across launches,
 *   which fixes the iOS PWA "asks every time" problem.
 * - Web (browser / installed PWA): the Web Speech API.
 *
 * Both call onFinal with each finalized chunk and expose live interim text.
 */
export function useSpeech(onFinal: (chunk: string) => void): UseSpeechResult {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const lastPartialRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(isNative() || getRecognitionCtor() !== null);
  }, []);

  // ---- Native engine (Capacitor) --------------------------------------
  const startNative = useCallback(async () => {
    setError(null);
    shouldListenRef.current = true;
    try {
      const { SpeechRecognition } = await import(
        "@capacitor-community/speech-recognition"
      );

      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        setError("Microphone access was blocked. Enable it in Settings.");
        shouldListenRef.current = false;
        setListening(false);
        return;
      }

      await SpeechRecognition.removeAllListeners();

      // Live partial transcript.
      await SpeechRecognition.addListener("partialResults", (data: { matches?: string[] }) => {
        const text = data.matches?.[0] ?? "";
        lastPartialRef.current = text;
        setInterim(text);
      });

      // iOS ends a segment after a pause; commit the last partial as final
      // and restart while the user still has the mic toggled on.
      await SpeechRecognition.addListener(
        "listeningState",
        (data: { status?: string }) => {
          if (data.status !== "stopped") return;
          const finalText = lastPartialRef.current.trim();
          if (finalText) onFinalRef.current(finalText);
          lastPartialRef.current = "";
          setInterim("");
          if (shouldListenRef.current) {
            SpeechRecognition.start({
              language: "en-GB",
              partialResults: true,
              popup: false,
            }).catch(() => setListening(false));
          } else {
            setListening(false);
          }
        }
      );

      await SpeechRecognition.start({
        language: "en-GB",
        partialResults: true,
        popup: false,
      });
      setListening(true);
    } catch {
      setError("Could not start the microphone.");
      setListening(false);
    }
  }, []);

  const stopNative = useCallback(async () => {
    shouldListenRef.current = false;
    try {
      const { SpeechRecognition } = await import(
        "@capacitor-community/speech-recognition"
      );
      await SpeechRecognition.stop();
      await SpeechRecognition.removeAllListeners();
    } catch {
      // ignore
    }
    // Commit anything captured before the manual stop.
    const finalText = lastPartialRef.current.trim();
    if (finalText) onFinalRef.current(finalText);
    lastPartialRef.current = "";
    setListening(false);
    setInterim("");
  }, []);

  // ---- Web engine (Web Speech API) ------------------------------------
  const startWeb = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError(null);
    shouldListenRef.current = true;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-GB";

    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          onFinalRef.current(transcript);
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow mic access and try again.");
        shouldListenRef.current = false;
        setListening(false);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Speech error: ${event.error}`);
      }
    };

    // Browsers stop recognition after silence; restart while the user still
    // has the mic toggled on.
    rec.onend = () => {
      setInterim("");
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone.");
    }
  }, []);

  const stopWeb = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  // ---- Public API ------------------------------------------------------
  const start = useCallback(() => {
    if (isNative()) startNative();
    else startWeb();
  }, [startNative, startWeb]);

  const stop = useCallback(() => {
    if (isNative()) stopNative();
    else stopWeb();
  }, [stopNative, stopWeb]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      if (isNative()) {
        import("@capacitor-community/speech-recognition")
          .then(({ SpeechRecognition }) => SpeechRecognition.stop().catch(() => {}))
          .catch(() => {});
      }
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
