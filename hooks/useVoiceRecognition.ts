import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  onSubmit: () => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const useVoiceRecognition = ({
  onTranscript,
  onSubmit,
  onError,
}: UseVoiceRecognitionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef('');

  const SILENCE_DURATION = 1500; // 1.5 seconds

  // Initialize Speech Recognition API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.('Web Speech API not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    /**
     * Handle incoming transcript
     */
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 onresult event:', event);
      let interimTranscript = '';
      let finalTranscript = '';

      // Collect all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log('📝 Transcript:', transcript, 'isFinal:', event.results[i].isFinal);

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Combine: final + interim
      const fullTranscript = finalTranscript + interimTranscript;
      console.log('📝 Full transcript:', fullTranscript);

      // Pass to parent
      if (fullTranscript) {
        lastTranscriptRef.current = fullTranscript.trim();
        console.log('📤 Calling onTranscript with:', lastTranscriptRef.current);
        onTranscript(lastTranscriptRef.current);
      }

      // Reset silence timer on speech activity
      if (finalTranscript || interimTranscript) {
        clearSilenceTimeout();

        // If we have final transcript, start silence timer
        if (finalTranscript) {
          setSilenceTimeout();
        }
      }
    };

    /**
     * Handle error
     */
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMsg = 'Microphone error';

      if (event.error === 'network') {
        errorMsg = 'Network error - check internet connection';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected - try speaking louder';
      } else if (event.error === 'permission-denied') {
        errorMsg = 'Microphone permission denied';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access not allowed';
      }

      onError?.(errorMsg);
      stopRecording();
    };

    /**
     * Handle end of recognition
     */
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimeout();
      recognition.abort();
    };
  }, [onTranscript, onError]);

  /**
   * Clear silence timeout
   */
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  /**
   * Set silence timeout → trigger submit
   */
  const setSilenceTimeout = useCallback(() => {
    clearSilenceTimeout();
    silenceTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Silence detected - auto-submitting');
      stopRecording();
      onSubmit();
    }, SILENCE_DURATION);
  }, [onSubmit]);

  /**
   * Start recording
   */
  const startRecording = useCallback(() => {
    console.log('🎤 startRecording called - isSupported:', isSupported, 'recognitionRef:', recognitionRef.current);
    if (!isSupported || !recognitionRef.current) {
      console.log('❌ Skipping - isSupported:', isSupported, 'recognitionRef exists:', !!recognitionRef.current);
      return;
    }

    try {
      console.log('🎤 Starting recording...');
      recognitionRef.current.start();
      setIsRecording(true);
      lastTranscriptRef.current = '';
    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.('Failed to start microphone');
    }
  }, [isSupported, onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      clearSilenceTimeout();
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }, [clearSilenceTimeout]);

  /**
   * Toggle recording
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    toggleRecording,
    startRecording,
    stopRecording,
  };
};

export default useVoiceRecognition;
