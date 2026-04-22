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
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
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
        console.log("MediaPipe HandLandmarker initialized successfully.");
      } catch (err) {
        console.error("Failed to init MediaPipe:", err);
        setError("Could not initialize hand tracking. This might be a browser compatibility issue.");
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Initialize Camera
  useEffect(() => {
    if (!videoRef.current) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
            };
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setError("Webcam access is required for hand tracking.");
        });
    } else {
      setError("Webcam not supported in this browser.");
    }
  }, []);

  // Tracking Loop
  useEffect(() => {
    let animationId: number;
    let isDetecting = false;

    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (video && landmarker && video.readyState >= 2 && !isDetecting) {
        const startTimeMs = performance.now();
        
        try {
          isDetecting = true;
          const result = landmarker.detectForVideo(video, startTimeMs);
          setResults(result);

          // Draw debug landmarks in corner
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (result.landmarks) {
              ctx.strokeStyle = '#f97316';
              ctx.fillStyle = '#f97316';
              ctx.lineWidth = 2;
              result.landmarks.forEach(marks => {
                marks.forEach(pt => {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, Math.PI * 2);
                  ctx.fill();
                });
              });
            }
          }

          if (result.landmarks && result.landmarks.length > 0) {
            const parsed: HandData[] = result.landmarks.map((marks, i) => ({
              landmarks: marks,
              worldLandmarks: result.worldLandmarks[i],
              handedness: result.handedness[i][0].categoryName as 'Left' | 'Right',
              score: result.handedness[i][0].score
            }));
            setHandData(parsed);
          } else {
            setHandData(current => current.length > 0 ? [] : current);
          }
        } catch (e) {
          console.warn("MediaPipe Detection Error:", e);
        } finally {
          isDetecting = false;
        }
      }
      animationId = requestAnimationFrame(detect);
    };

    if (!isLoading && !error && landmarker) {
      detect();
    }

    return () => cancelAnimationFrame(animationId);
  }, [landmarker, isLoading, error]);

  return (
    <HandContext.Provider value={{ results, videoRef, canvasRef, isLoading, error, handData }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 opacity-80 pointer-events-none group">
        <div className="relative overflow-hidden rounded-lg border-2 border-white/20 shadow-2xl">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-48 h-36 scale-x-[-1] object-cover" 
          />
          <canvas
            ref={canvasRef}
            width={192}
            height={144}
            className="absolute inset-0 w-full h-full scale-x-[-1]"
          />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-mono text-orange-500 uppercase tracking-tighter">
            {isLoading ? "init..." : handData.length > 0 ? "Tracking" : "Searching..."}
          </div>
        </div>
      </div>
    </HandContext.Provider>
  );
};

export const useHands = () => {
  const context = useContext(HandContext);
  if (!context) throw new Error("useHands must be used within HandProvider");
  return context;
};
