import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useSpeechRecognition() {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const getLanguageTag = (langCode) => {
    switch (langCode) {
      case 'ta':
        return 'ta-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const startListening = useCallback((onResultCallback) => {
    if (!recognitionRef.current) return;

    try {
      const recognition = recognitionRef.current;
      recognition.lang = getLanguageTag(i18n.language);

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        if (onResultCallback) {
          onResultCallback(text);
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      setIsListening(false);
    }
  }, [i18n.language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening
  };
}
