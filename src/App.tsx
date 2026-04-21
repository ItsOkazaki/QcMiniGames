import { useState } from 'react';
import { HandProvider } from './components/HandProvider';
import { GameSelection } from './components/GameSelection';
import { GameEngine } from './components/GameEngine';
import { GameMetadata } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Gamepad2, Settings, Info } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);

  return (
    <HandProvider>
      <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-orange-500/30">
        {/* Header / Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md z-40 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight uppercase">Mostapha <span className="text-orange-500 font-mono">Mini-Games</span></h1>
              <div className="text-[10px] text-white/40 font-mono flex items-center gap-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                System Active • 60 FPS Target
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-white/50">
            <button className="hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
            <button className="hover:text-white transition-colors"><Info className="w-5 h-5" /></button>
          </nav>
        </header>

        {/* Global Game Overlay / Console Output */}
        <div className="fixed bottom-6 left-6 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
            <Terminal className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
              {activeGame ? `Engine: Running ${activeGame.name}` : "System: Idle"}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="relative h-[calc(100vh-64px)] w-full">
          <AnimatePresence mode="wait">
            {!activeGame ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <GameSelection onSelectGame={setActiveGame} />
              </motion.div>
            ) : (
              <motion.div
                key="engine"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full relative"
              >
                <button 
                  onClick={() => setActiveGame(null)}
                  className="absolute top-6 left-6 z-50 px-4 py-2 bg-black/50 hover:bg-black/80 border border-white/10 rounded-lg text-sm font-medium transition-all hover:border-orange-500/50 flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Exit to Menu
                </button>
                <GameEngine game={activeGame} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </HandProvider>
  );
}
