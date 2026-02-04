import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw } from 'lucide-react';

const PLAYER_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp9H6pI7lJo4UTGr3SPJ3L8yslgsxOlUm7SQ&s"; 
const ENEMY_IMAGE_URL = "https://tfe-bd.sgp1.cdn.digitaloceanspaces.com/posts/25699/mirza-abbas.jpg";

const PLAYER_SIZE = 50;
const INITIAL_ENEMY_SPEED = 3.5;

export default function App() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [enemyPos, setEnemyPos] = useState({ x: 250, y: 250 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('face_hc') || '0'));
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const gameRef = useRef(null);
  const keysRef = useRef({});
  const requestRef = useRef();
  const enemySpeedRef = useRef(INITIAL_ENEMY_SPEED);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const update = () => {
    if (isGameOver) return;

    const dynamicSpeed = dimensions.width < 768 ? 7 : 10;

    setPos(prev => {
      let newX = prev.x;
      let newY = prev.y;
      if (keysRef.current['arrowup'] || keysRef.current['w']) newY -= dynamicSpeed;
      if (keysRef.current['arrowdown'] || keysRef.current['s']) newY += dynamicSpeed;
      if (keysRef.current['arrowleft'] || keysRef.current['a']) newX -= dynamicSpeed;
      if (keysRef.current['arrowright'] || keysRef.current['d']) newX += dynamicSpeed;

      return {
        x: Math.max(0, Math.min(newX, dimensions.width - PLAYER_SIZE)),
        y: Math.max(0, Math.min(newY, dimensions.height - PLAYER_SIZE))
      };
    });

    setEnemyPos(prevE => {
      const dx = pos.x - prevE.x;
      const dy = pos.y - prevE.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 45) {
        setIsGameOver(true);
        return prevE;
      }

      enemySpeedRef.current += 0.001;
      setScore(s => s + 1);

      return {
        x: prevE.x + (dx / dist) * enemySpeedRef.current,
        y: prevE.y + (dy / dist) * enemySpeedRef.current
      };
    });

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [pos, isGameOver, dimensions]);

  const reset = () => {
    const finalScore = Math.floor(score / 10);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('face_hc', finalScore.toString());
    }
    setPos({ x: 50, y: 50 });
    setEnemyPos({ x: dimensions.width - 100, y: dimensions.height - 100 });
    enemySpeedRef.current = INITIAL_ENEMY_SPEED;
    setScore(0);
    setIsGameOver(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-hidden touch-none select-none">
      
      
      <div className="absolute top-6 left-6 z-30">
        <div className="text-emerald-400 text-4xl font-black italic flex items-center gap-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          <Zap fill="currentColor" size={30} /> {Math.floor(score / 10)}
        </div>
        <div className="text-zinc-500 font-bold text-xs tracking-widest mt-1">RECORD: {highScore}</div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] bg-size-[40px_40px] opacity-40" />

      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className="absolute z-20"
      >
        <img 
          src={PLAYER_IMAGE_URL} 
          alt="Player" 
          className="w-12.5 h-12.5 rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] object-cover"
        />
      </motion.div>

      {/* Enemy (এনিমির ছবি) */}
      <motion.div
        animate={{ x: enemyPos.x, y: enemyPos.y }}
        className="absolute z-10"
      >
        <img 
          src={ENEMY_IMAGE_URL} 
          alt="Chaser" 
          className="w-12.5 h-12.5 rounded-full border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)] object-cover"
        />
      </motion.div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 md:hidden">
        <div className="grid grid-cols-3 gap-2 bg-white/5 p-4 rounded-3xl backdrop-blur-md">
          <div />
          <button className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500" onPointerDown={() => (keysRef.current['w'] = true)} onPointerUp={() => (keysRef.current['w'] = false)}>↑</button>
          <div />
          <button className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500" onPointerDown={() => (keysRef.current['a'] = true)} onPointerUp={() => (keysRef.current['a'] = false)}>←</button>
          <button className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500" onPointerDown={() => (keysRef.current['s'] = true)} onPointerUp={() => (keysRef.current['s'] = false)}>↓</button>
          <button className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500" onPointerDown={() => (keysRef.current['d'] = true)} onPointerUp={() => (keysRef.current['d'] = false)}>→</button>
        </div>
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="bg-zinc-900 border border-white/10 p-12 rounded-[3rem] text-center shadow-2xl">
              <h2 className="text-6xl font-black text-white mb-2 italic">CAUGHT!</h2>
              <p className="text-zinc-400 mb-8 font-medium italic">Score: {Math.floor(score / 10)}</p>
              <button onClick={reset} className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black py-4 rounded-2xl font-black text-xl active:scale-95">
                <RotateCcw size={24} /> RETRY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}