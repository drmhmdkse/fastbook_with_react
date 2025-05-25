import {GrCaretNext, GrCaretPrevious, GrPowerReset, GrStop} from "react-icons/gr";
import { useState, useEffect, useRef, useCallback } from 'react'
import './app.css'
import {GoPlay} from "react-icons/go";

function App() {
  const [text, setText] = useState('');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // seconds per word
  const [lastWordChangeTime, setLastWordChangeTime] = useState(0);
  const intervalRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(0);
  const lastWordChangeTimeRef = useRef(0);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setText(content);
      // Split text into words, filtering out empty strings
      const wordArray = content.split(/\s+/).filter(word => word.length > 0);
      setWords(wordArray);
      setCurrentWordIndex(0);
      setIsPlaying(false);
      previousTimeRef.current = 0;
      lastWordChangeTimeRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
    reader.readAsText(file);
  };

  // Handle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle reset
  const handleReset = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    previousTimeRef.current = 0;
    lastWordChangeTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  // Handle previous word
  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  // Handle next word
  const handleNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  // Handle speed change with debouncing
  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    // Speed change is handled by the animation frame loop
    // No need to restart an interval here
  };

  // Animation frame callback for smoother word changes
  const animationFrameCallback = useCallback((time) => {
    if (!isPlaying) return;

    if (previousTimeRef.current === 0) {
      previousTimeRef.current = time;
      lastWordChangeTimeRef.current = time;
      setLastWordChangeTime(time);
    }

    const elapsed = time - lastWordChangeTimeRef.current;
    const speedInMs = speed * 1000;

    if (elapsed >= speedInMs) {
      setCurrentWordIndex(prevIndex => {
        if (prevIndex >= words.length - 1) {
          setIsPlaying(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
      lastWordChangeTimeRef.current = time;
      setLastWordChangeTime(time);
    }

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animationFrameCallback);
    }
  }, [isPlaying, speed, words.length]);

  // Effect to handle play/pause using requestAnimationFrame
  useEffect(() => {
    if (isPlaying) {
      previousTimeRef.current = 0; // Reset time tracking
      lastWordChangeTimeRef.current = 0; // Reset last word change time
      requestRef.current = requestAnimationFrame(animationFrameCallback);
    } else {
      // Cancel any pending animation frame
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }

    return () => {
      // Clean up animation frame on unmount or when dependencies change
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isPlaying, animationFrameCallback]);

  return (
    <div className="fast-reader-container">
      <h1 className="app-title">Fast Book Reading</h1>

      <div className="file-upload-section">
        <div className="file-upload-container">
            <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="file-input"
            />

        </div>
        <div className="sample-download-container">
          <a 
            href="/sample.txt" 
            download 
            className="sample-download-link"
          >
            Download sample text file
          </a>
        </div>
      </div>

      <div className="word-display-area">
        <div
          key={currentWordIndex} // Key helps React identify when to animate
          className="current-word"
        >
          {words.length > 0 && currentWordIndex < words.length ? words[currentWordIndex] : 'Load text...'}
        </div>
      </div>

      <div className="controls-container">
        <button 
          onClick={handlePreviousWord}
          disabled={words.length === 0 || currentWordIndex === 0}
          className="control-button"
        >
          <GrCaretPrevious />
        </button>

        <button 
          onClick={togglePlay}
          disabled={words.length === 0}
          className={`control-button ${isPlaying ? 'pause-button' : 'play-button'}`}
        >
          {isPlaying ? <GrStop /> : <GoPlay />}
        </button>

        <button 
          onClick={handleReset}
          disabled={words.length === 0}
          className="control-button"
        >
          <GrPowerReset />
        </button>

        <button 
          onClick={handleNextWord}
          disabled={words.length === 0 || currentWordIndex === words.length - 1}
          className="control-button"
        >
          <GrCaretNext />
        </button>
      </div>

      <div className="speed-control-container">
        <label className={`speed-label ${speed < 0.5 ? 'speed-label-fast' : speed > 1.5 ? 'speed-label-slow' : ''}`}>
          Speed (seconds/word): {speed.toFixed(2)}
        </label>
        <div className="speed-slider-container">
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.05" 
            value={speed} 
            onChange={handleSpeedChange}
            className="speed-slider"
          />
          <div className="speed-labels">
            <span className="speed-label-fast-text">Fast</span>
            <span className="speed-label-normal-text">Normal</span>
            <span className="speed-label-slow-text">Slow</span>
          </div>
        </div>
      </div>

      <div className="progress-indicator">
        {words.length > 0 && (
          <p>Progress: {currentWordIndex + 1} / {words.length} words</p>
        )}
      </div>
    </div>
  );
}

export default App;
