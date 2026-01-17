import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Copy, AlertCircle, Send } from 'lucide-react';

interface SpeechToTextProps {
  onTranscriptionUpdate?: (text: string) => void;
  onAutoSend?: (text: string) => void;
  autoStopDelay?: number; // ms of silence before auto-stop (default 3000)
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscriptionUpdate,
  onAutoSend,
  autoStopDelay = 3000
}) => {
  const [isListening, setIsListening] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState('');
  const [showSentIndicator, setShowSentIndicator] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const shouldBeListeningRef = useRef<boolean>(false);

  // Speech-to-text buffer
  const sttFinalRef = useRef<string>('');

  // Keep message in a ref for safe sends
  const messageTextRef = useRef<string>('');
  useEffect(() => {
    messageTextRef.current = messageText;
  }, [messageText]);

  // Monitor for silence and auto-stop
  useEffect(() => {
    if (!isListening) return;

    // Clear any existing timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Set a new timer to check for silence
    const checkSilence = () => {
      const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
      
      if (timeSinceLastSpeech >= autoStopDelay) {
        // Silence detected - stop listening
        stopListeningAndSend();
      } else {
        // Not enough silence yet, check again
        const remainingTime = autoStopDelay - timeSinceLastSpeech;
        silenceTimerRef.current = window.setTimeout(checkSilence, remainingTime + 100);
      }
    };

    silenceTimerRef.current = window.setTimeout(checkSilence, autoStopDelay);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isListening, autoStopDelay]);

  // Init SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      lastSpeechTimeRef.current = Date.now();
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      // Update last speech time whenever we get results
      lastSpeechTimeRef.current = Date.now();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim += t;
        }
      }

      if (final) {
        // Accumulate STT
        sttFinalRef.current = (sttFinalRef.current + final).replace(/\s+/g, ' ').trim() + ' ';
        onTranscriptionUpdate?.(sttFinalRef.current.trim());
      }

      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      if (shouldBeListeningRef.current && (event.error === 'no-speech' || event.error === 'aborted')) {
        return;
      }

      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError(`Error: ${event.error}`);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setInterimText('');

      // Restart if user still wants listening (Chrome ends on silence)
      if (shouldBeListeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              try {
                recognition.start();
              } catch {}
            }, 300);
          }
        }, 250);
        return;
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      try {
        recognition.stop();
      } catch {}
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [onTranscriptionUpdate]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    setShowSentIndicator(false);
    shouldBeListeningRef.current = true;

    // Reset STT buffers for new session
    sttFinalRef.current = '';
    onTranscriptionUpdate?.('');
    setInterimText('');

    if (!isListening) {
      try {
        recognitionRef.current.start();
        setError('');
        lastSpeechTimeRef.current = Date.now();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start recording. Please try again.');
      }
    }
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {}

    setIsListening(false);
    setInterimText('');
  };

  const stopListeningAndSend = () => {
    // Stop listening first
    stopListening();

    // Send the STT content if we have any
    const text = sttFinalRef.current.trim();
    if (text && onAutoSend) {
      onAutoSend(text);
      
      // Show sent indicator
      setShowSentIndicator(true);
      setTimeout(() => setShowSentIndicator(false), 2000);
    }

    // Reset STT state after send
    sttFinalRef.current = '';
    onTranscriptionUpdate?.('');
  };

  const sendMessageBoxText = () => {
    if (!onAutoSend) return;

    const text = messageTextRef.current.trim();
    if (!text) return;

    onAutoSend(text);

    // Clear message after sending
    setMessageText('');
    messageTextRef.current = '';

    // Show sent indicator
    setShowSentIndicator(true);
    setTimeout(() => setShowSentIndicator(false), 2000);
  };

  const copyMessageToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageTextRef.current);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const onChangeMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
  };

  const onKeyDownMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageBoxText();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Speech to Text</h2>
        </div>
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const canSendMessage = !!messageText.trim();

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Mic className="text-pink-400" size={24} />
        <h2 className="text-xl font-semibold text-white">Voice + Messages</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-center mb-4 h-6">
        {showSentIndicator ? (
          <div className="flex items-center gap-2 text-green-400">
            <Send size={16} />
            <span className="text-sm font-medium">Sent!</span>
          </div>
        ) : isListening ? (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Listening... (stops after {autoStopDelay / 1000}s silence)</span>
          </div>
        ) : null}
      </div>

      {/* Listen toggle */}
      <button
        onClick={isListening ? stopListeningAndSend : startListening}
        className={`w-full ${
          isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-pink-600 hover:bg-pink-700'
        } text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4`}
      >
        {isListening ? (
          <>
            <Square size={20} />
            Stop & Send
          </>
        ) : (
          <>
            <Mic size={20} />
            Start Listening
          </>
        )}
      </button>

      {/* MESSAGE BOX */}
      <div className="relative">
        <textarea
          value={messageText}
          onChange={onChangeMessage}
          onKeyDown={onKeyDownMessage}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          className="w-full bg-gray-900 text-white rounded-lg p-3 pr-14 pb-14 border border-gray-600 focus:border-pink-500 focus:outline-none resize-none scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          rows={6}
        />

        {/* Copy button INSIDE (top-right) */}
        <button
          onClick={copyMessageToClipboard}
          disabled={!canSendMessage}
          className={`absolute top-3 right-3 p-2 rounded-md border transition-colors ${
            canSendMessage
              ? 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-400'
              : 'border-gray-800 text-gray-600 cursor-not-allowed'
          }`}
          title="Copy"
        >
          <Copy size={16} />
        </button>

        {/* Send button INSIDE (bottom-right) */}
        <button
          onClick={sendMessageBoxText}
          disabled={!canSendMessage || !onAutoSend}
          className={`absolute bottom-3 right-3 p-3 rounded-md transition-colors ${
            canSendMessage && onAutoSend
              ? 'bg-pink-600 hover:bg-pink-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Show interim STT feedback */}
      {isListening && interimText && (
        <p className="text-xs text-gray-500 mt-3">
          <span className="italic">Listening (draft): {interimText}</span>
        </p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-500">Powered by Web Speech API</div>
        <div className="text-xs text-gray-500">Auto-stops after {autoStopDelay / 1000}s silence</div>
      </div>
    </div>
  );
};

export default SpeechToText;