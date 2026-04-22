import React, { useEffect, useRef, useState } from 'react';
import { GameMetadata } from '../types';
import { useHands } from './HandProvider';
import { BladeMaster } from '../games/BladeMaster';
import { HandPong } from '../games/HandPong';
import { SignHero } from '../games/SignHero';
import { VSteer } from '../games/VSteer';

interface GameEngineProps {
  game: GameMetadata;
}

export const GameEngine: React.FC<GameEngineProps> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { handData, isLoading } = useHands();
  const [score, setScore] = useState(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handDataRef = useRef(handData);
  useEffect(() => {
    handDataRef.current = handData;
  }, [handData]);

  // Initialize and run the 2D game loop if it's a 2D game
  useEffect(() => {
    if (game.id === 'steering') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update canvas size directly
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let gameInstance: any;

    if (game.id === 'fruit-ninja') {
      gameInstance = new BladeMaster(canvas, setScore);
    } else if (game.id === 'pong') {
      gameInstance = new HandPong(canvas, setScore);
    } else if (game.id === 'gesture') {
      gameInstance = new SignHero(canvas, setScore);
    }

    let animationId: number;
    const loop = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update & Draw using ref for latest hand data
      if (gameInstance) {
        gameInstance.update(handDataRef.current);
        gameInstance.draw(ctx);
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      if (gameInstance?.cleanup) gameInstance.cleanup();
    };
  }, [game.id, dimensions]); // Removed handData from dependencies

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-white/50 animate-pulse">
        Initializing Orbital Hand-Tracking Matrix...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative bg-black overflow-hidden cursor-none">
      {/* HUD Overview */}
      <div className="absolute top-6 right-6 z-30 pointer-events-none flex flex-col items-end">
        <div className="text-[10px] font-mono text-orange-500/50 uppercase tracking-[0.2em] mb-1">Live Score</div>
        <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
          {score.toString().padStart(5, '0')}
        </div>
      </div>

      {/* No Hand Detected Warning */}
      {handData.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-500">
          <div className="bg-orange-500/10 border border-orange-500/30 backdrop-blur-md px-8 py-6 rounded-2xl flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <span className="text-orange-500 text-2xl font-bold">!</span>
            </div>
            <div className="text-center">
              <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-1">No Hand Detected</h3>
              <p className="text-white/40 text-[10px] uppercase font-mono">Position your hand in front of the camera</p>
            </div>
          </div>
        </div>
      )}

      {game.id === 'steering' ? (
        <VSteer handData={handData} onScore={setScore} />
      ) : (
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full h-full block"
        />
      )}

      {/* Hand Tracker HUD Overlay (Mini) */}
      <div className="absolute bottom-6 right-6 pointer-events-none p-4 bg-black/40 border border-white/5 rounded-xl backdrop-blur-sm z-30">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            {handData.map((h, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            ))}
            {handData.length === 0 && <div className="w-2 h-2 rounded-full bg-red-500/50" />}
          </div>
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest whitespace-nowrap">
            {handData.length} Hand{handData.length !== 1 ? 's' : ''} detected
          </span>
        </div>
      </div>
    </div>
  );
};
