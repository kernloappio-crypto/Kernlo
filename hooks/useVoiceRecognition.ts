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
  const isActiveRef = useRef(false); // Track if recognition is actively listening
  const initializationRef = useRef(false); // 🟨 FIX: Prevent re-initialization

  const SILENCE_DURATION = 1500; // 1.5 seconds

  // 🟨 FIX 2: Initialize Speech Recognition API ONCE, separate handler updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip initialization if already done
    if (initializationRef.current && recognitionRef.current) {
      console.log('⏭️ Recognition already initialized, skipping re-init');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.('Web Speech API not supported in this browser');
      return;
    }

    console.log('✨ Creating new Speech Recognition instance');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    // Store reference immediately
    recognitionRef.current = recognition;
    initializationRef.current = true;

    console.log('✅ Speech Recognition instance created and stored');

    return () => {
      // Only abort if recognition is active (not if component is just updating handlers)
      if (recognitionRef.current && isActiveRef.current) {
        console.log('🧹 useEffect cleanup: aborting active recognition');
        recognitionRef.current.abort();
      } else if (recognitionRef.current && !isActiveRef.current) {
        console.log('⏸️ useEffect cleanup: recognition already inactive');
      }
    };
  }, []); // 🟨 EMPTY dependency array: only init once on mount

  // 🟨 FIX 3: Separate effect for updating handlers
  // This prevents the initialization effect from re-running when callbacks change
  useEffect(() => {
    if (!recognitionRef.current || !initializationRef.current) {
      console.log('⏳ Recognition not yet initialized, waiting...');
      return;
    }

    console.log('📝 Updating event handlers');

    /**
     * Handle recognition started
     */
    recognitionRef.current.onstart = () => {
      console.log('🎤 ✓ ONSTART FIRED - Recognition started - listening for speech');
      isActiveRef.current = true;
    };

    /**
     * Handle incoming transcript
     */
    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 ✓ ONRESULT FIRED - event:', event);
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
    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('❌ ✓ ONERROR FIRED - SPEECH RECOGNITION ERROR:', event.error);
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

      console.log('❌ Error message:', errorMsg);
      onError?.(errorMsg);
      stopRecording();
    };

    /**
     * Handle end of recognition
     */
    recognitionRef.current.onend = () => {
      console.log('✓ Recognition ended');
      isActiveRef.current = false;
      setIsRecording(false);
    };

    // No cleanup here - we're not destroying the recognition object
  }, [onTranscript, onError, onSubmit]); // 🟨 Update when callbacks change

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
    console.log('🎤 startRecording called', {
      isSupported,
      recognitionRefExists: !!recognitionRef.current,
      initializationComplete: initializationRef.current,
      isActive: isActiveRef.current,
    });

    if (!isSupported) {
      console.log('❌ Skipping - Web Speech API not supported');
      onError?.('Web Speech API not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      console.log('❌ Skipping - recognitionRef.current is null');
      onError?.('Speech recognition not initialized');
      return;
    }

    if (!initializationRef.current) {
      console.log('❌ Skipping - initialization not complete');
      onError?.('Speech recognition not ready');
      return;
    }

    try {
      console.log('📊 Recognition state before start():', {
        timestamp: Date.now(),
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        language: recognitionRef.current.language,
        onstartDefined: typeof recognitionRef.current.onstart === 'function',
        onerrorDefined: typeof recognitionRef.current.onerror === 'function',
        onendDefined: typeof recognitionRef.current.onend === 'function',
        onresultDefined: typeof recognitionRef.current.onresult === 'function',
      });

      // If already running, stop first to reset state
      if (isActiveRef.current) {
        console.log('⏸️ Recognition already running, stopping first...');
        recognitionRef.current.stop();
        // Give browser time to process stop
        // Note: onend should fire and set isActiveRef.current to false
      }

      console.log('🚀 Calling start()...');
      recognitionRef.current.start();
      setIsRecording(true);
      lastTranscriptRef.current = '';
      console.log('✅ start() succeeded, waiting for onstart handler to fire...');
    } catch (err) {
      console.error('❌ CRITICAL: Failed to start recording', {
        errorName: err instanceof Error ? err.name : 'unknown',
        errorMessage: err instanceof Error ? err.message : String(err),
        errorCode: (err as any)?.code,
        fullError: err,
      });
      onError?.(
        `Failed to start microphone: ${err instanceof Error ? err.message : String(err)}`
      );
      isActiveRef.current = false;
      setIsRecording(false);
    }
  }, [isSupported, onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    console.log('⏹️ stopRecording called', {
      recognitionRefExists: !!recognitionRef.current,
      isActive: isActiveRef.current,
    });

    if (!recognitionRef.current) {
      console.log('⚠️ recognitionRef.current is null, cannot stop');
      return;
    }

    try {
      console.log('🛑 Calling stop()...');
      recognitionRef.current.stop();
      setIsRecording(false);
      clearSilenceTimeout();
      console.log('✅ stop() called');
    } catch (err) {
      console.error('⚠️ Error stopping recording:', {
        errorName: err instanceof Error ? err.name : 'unknown',
        errorMessage: err instanceof Error ? err.message : String(err),
        fullError: err,
      });
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
