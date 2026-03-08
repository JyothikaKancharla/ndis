import React, { createContext, useState, useCallback, useRef } from 'react';

export const RecordingContext = createContext();

export const RecordingProvider = ({ children }) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState('');
  
  // Refs for MediaRecorder and stream
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunksRef = useRef([]);
  
  // Speech Recognition
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Initialize Speech Recognition (Web Speech API)
  const initializeSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscription((prev) => {
          const newText = prev + finalTranscript;
          return newText.trim();
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network' && isListeningRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch (_) {}
        }, 1000);
      } else if (event.error !== 'no-speech') {
        setError(`Transcription error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  // Start recording with transcription
  const startRecording = useCallback(async (cId) => {
    try {
      setError('');
      setClientId(cId);

      // Start microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('RecordingContext: ondataavailable, chunk size:', event.data.size);
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('RecordingContext: onstop event, chunks count:', chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('RecordingContext: Created blob in onstop, size:', blob.size);
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start speech recognition
      const recognition = initializeSpeechRecognition();
      if (recognition) {
        recognition.start();
      }
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
      setIsRecording(false);
    }
  }, [initializeSpeechRecognition]);

  // Stop recording (pause)
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsRecording(false);
      setIsPaused(true);

      // Pause speech recognition
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.abort();
      }
    }
  }, [isRecording]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsRecording(true);
      setIsPaused(false);

      // Resume speech recognition
      const recognition = initializeSpeechRecognition();
      if (recognition) {
        recognition.start();
      }
    }
  }, [isPaused, initializeSpeechRecognition]);

  // Complete recording (stop and finalize)
  const completeRecording = useCallback(() => {
    return new Promise((resolve) => {
      console.log('RecordingContext: completeRecording called');
      if (mediaRecorderRef.current) {
        // Set up onstop handler to resolve when blob is ready
        mediaRecorderRef.current.onstop = () => {
          console.log('RecordingContext: completeRecording onstop fired, chunks:', chunksRef.current.length);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('RecordingContext: Created blob in completeRecording, size:', blob.size);
          setAudioBlob(blob);
          
          // Stop speech recognition
          if (recognitionRef.current) {
            recognitionRef.current.abort();
          }

          // Stop microphone stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
          
          setIsRecording(false);
          setIsPaused(false);
          
          console.log('RecordingContext: Resolving with blob, size:', blob.size);
          // Resolve with blob
          resolve(blob);
        };
        
        console.log('RecordingContext: Calling mediaRecorder.stop()');
        mediaRecorderRef.current.stop();
      } else {
        console.warn('RecordingContext: mediaRecorderRef.current is null');
        resolve(null);
      }
    });
  }, []);

  // Reset recording state
  const resetRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
    setIsPaused(false);
    setTranscription('');
    setAudioBlob(null);
    setError('');
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }, []);

  // Update transcription manually (for editing)
  const updateTranscription = useCallback((text) => {
    setTranscription(text);
  }, []);

  const value = {
    // State
    isRecording,
    isPaused,
    transcription,
    audioBlob,
    clientId,
    error,

    // Methods
    startRecording,
    stopRecording,
    resumeRecording,
    completeRecording,
    resetRecording,
    updateTranscription,
    setError,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};
