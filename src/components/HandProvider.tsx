import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

interface HandContextType {
  results: HandLandmarkerResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  error: string | null;
  handData: HandData[]; // Simplified format for games
}

const HandContext = createContext<HandContextType | undefined>(undefined);

export const HandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [results, setResults] = useState<HandLandmarkerResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handData, setHandData] = useState<HandData[]>([]);

  const lastVideoTimeRef = useRef(-1);

  // Initialize MediaPipe
  useEffect(() => {
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setLandmarker(handLandmarker);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to init MediaPipe:", err);
        setError("Could not initialize hand tracking.");
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Initialize Camera
  useEffect(() => {
    if (!videoRef.current) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", () => {
              // Trigger loop
            });
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setError("Webcam access is required for this app.");
        });
    }
  }, []);

  // Tracking Loop
  useEffect(() => {
    let animationId: number;

    const detect = async () => {
      if (videoRef.current && landmarker && videoRef.current.readyState >= 2) {
        const startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
          lastVideoTimeRef.current = videoRef.current.currentTime;
          const result = landmarker.detectForVideo(videoRef.current, startTimeMs);
          setResults(result);

          // Process into simplified HandData
          const parsed: HandData[] = result.landmarks.map((marks, i) => ({
            landmarks: marks,
            worldLandmarks: result.worldLandmarks[i],
            handedness: result.handedness[i][0].categoryName as 'Left' | 'Right',
            score: result.handedness[i][0].score
          }));
          setHandData(parsed);
        }
      }
      animationId = requestAnimationFrame(detect);
    };

    if (!isLoading && !error) {
      detect();
    }

    return () => cancelAnimationFrame(animationId);
  }, [landmarker, isLoading, error]);

  return (
    <HandContext.Provider value={{ results, videoRef, canvasRef, isLoading, error, handData }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 opacity-50 pointer-events-none">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-48 h-36 rounded-lg border-2 border-white/20 scale-x-[-1]" 
        />
      </div>
    </HandContext.Provider>
  );
};

export const useHands = () => {
  const context = useContext(HandContext);
  if (!context) throw new Error("useHands must be used within HandProvider");
  return context;
};
