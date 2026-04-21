import React from 'react';
import { GameMetadata } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Sword, CircleDot, Hand, Car, Gamepad2 } from 'lucide-react';

const GAMES: GameMetadata[] = [
  {
    id: 'fruit-ninja',
    name: 'Blade Master',
    description: 'Use your hand to slice flying objects. Fast reflexes required.',
    category: 'Action',
    icon: 'Sword'
  },
  {
    id: 'pong',
    name: 'Hand Pong',
    description: 'Control your paddle with vertical hand movements. AI opponent included.',
    category: 'Arcade',
    icon: 'CircleDot'
  },
  {
    id: 'gesture',
    name: 'Sign Hero',
    description: 'Match the displayed hand signs as fast as possible.',
    category: 'Puzzle',
    icon: 'Hand'
  },
  {
    id: 'steering',
    name: 'V-Steer',
    description: 'Control a 3D vehicle by rotating your hands like a steering wheel.',
    category: 'Racing',
    icon: 'Car'
  }
];

const IconMap: Record<string, React.ElementType> = {
  Sword,
  CircleDot,
  Hand,
  Car
};

interface GameSelectionProps {
  onSelectGame: (game: GameMetadata) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({ onSelectGame }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-radial-at-t from-orange-500/10 to-transparent overflow-y-auto">
      <div className="max-w-6xl w-full py-8">
        <header className="mb-8 md:mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4"
          >
            Select Your <span className="text-orange-500">Module</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 font-mono text-xs md:text-sm uppercase tracking-widest"
          >
            Universal Hand Tracking Protocol Active
          </motion.p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {GAMES.map((game, i) => {
            const Icon = (IconMap[game.icon] || Gamepad2) as any;
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => onSelectGame(game)}
                className={cn(
                  "group relative min-h-[220px] md:aspect-square bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 text-left transition-all",
                  "hover:border-orange-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(234,88,12,0.1)]",
                  "overflow-hidden flex flex-col justify-between"
                )}
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Icon className="w-24 h-24 md:w-32 md:h-32 rotate-12 translate-x-4 md:translate-x-8 -translate-y-4 md:-translate-y-8" />
                </div>

                <div className="z-10">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-600 transition-colors">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight mb-2 group-hover:text-orange-500 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs md:text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors line-clamp-2 md:line-clamp-none">
                    {game.description}
                  </p>
                </div>

                <div className="z-10 flex items-center justify-between mt-4">
                  <span className="text-[9px] md:text-[10px] font-mono uppercase text-white/30 tracking-widest border border-white/5 px-2 py-1 rounded">
                    {game.category}
                  </span>
                  <div className="flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-orange-500 opacity-0 group-hover:opacity-100 transition-all">Launch</span>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-orange-500 transition-colors">
                      <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white rounded-full group-hover:bg-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
