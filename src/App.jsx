import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Play, Star } from 'lucide-react';

const PLAYER_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp9H6pI7lJo4UTGr3SPJ3L8yslgsxOlUm7SQ&s"; 
const ENEMY_IMAGE_URL = "https://tfe-bd.sgp1.cdn.digitaloceanspaces.com/posts/25699/mirza-abbas.jpg";

const RUNNING_SOUND_URL = "/WhatsApp Audio 2026-02-04 at 9.00.48 PM.mpeg";
const CAUGHT_SOUND_URL = "/WhatsApp Audio 2026-02-04 at 8.47.12 PM.mpeg";

const PLAYER_SIZE = 50;
const INITIAL_ENEMY_SPEED = 1.5;

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 150 });
  const [enemyPos, setEnemyPos] = useState({ x: 300, y: 300 });
  const [pointPos, setPointPos] = useState({ x: 200, y: 200 });
  const [isMegaPoint, setIsMegaPoint] = useState(false);
  const [pointCounter, setPointCounter] = useState(0); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('face_hc') || '0'));
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const posRef = useRef({ x: 50, y: 150 });
  const enemyPosRef = useRef({ x: 300, y: 300 });
  const pointPosRef = useRef({ x: 200, y: 200 });
  const isMegaPointRef = useRef(false);
  const pointCounterRef = useRef(0);
  const scoreRef = useRef(0);
  
  const keysRef = useRef({});
  const requestRef = useRef();
  const enemySpeedRef = useRef(INITIAL_ENEMY_SPEED);
  const runningAudio = useRef(null);
  const caughtAudio = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    runningAudio.current = new Audio(RUNNING_SOUND_URL);
    caughtAudio.current = new Audio(CAUGHT_SOUND_URL);
    runningAudio.current.loop = true;

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stopAllSounds = () => {
    if (runningAudio.current) {
      runningAudio.current.pause();
      runningAudio.current.currentTime = 0;
    }
    if (caughtAudio.current) {
      caughtAudio.current.pause();
      caughtAudio.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!runningAudio.current || !caughtAudio.current) return;

    if (hasStarted && !isGameOver) {
      runningAudio.current.play().catch(() => {});
    } else {
      runningAudio.current.pause();
    }

    if (isGameOver) {
      stopAllSounds(); 
      caughtAudio.current.play().catch(() => {});
    }
  }, [hasStarted, isGameOver]);

  useEffect(() => {
    const down = (e) => { 
      keysRef.current[e.key.toLowerCase()] = true; 
      e.preventDefault(); // Fix: Prevent page scroll
    };
    const up = (e) => { 
      keysRef.current[e.key.toLowerCase()] = false; 
      e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { 
      window.removeEventListener('keydown', down); 
      window.removeEventListener('keyup', up); 
    };
  }, []);

  const spawnNewPoint = (count) => {
    const nextCount = count + 1;
    const isMega = nextCount % 10 === 0 && nextCount !== 0;
    
    isMegaPointRef.current = isMega;
    pointCounterRef.current = nextCount;
    
    setIsMegaPoint(isMega);
    setPointCounter(nextCount);
    
    const newPointPos = {
      x: Math.floor(Math.random() * (dimensions.width - 100)) + 50,
      y: Math.floor(Math.random() * (dimensions.height - 200)) + 100
    };
    
    pointPosRef.current = newPointPos;
    setPointPos(newPointPos);
  };

  const gameLoop = () => {
    if (isGameOver || !hasStarted) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const speed = dimensions.width < 768 ? 7 : 10;
    
    let moved = false;
    const newPos = { ...posRef.current };
    
    if (keysRef.current['arrowright'] || keysRef.current['d']) {
      newPos.x += speed;
      moved = true;
    }
    if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      newPos.x -= speed;
      moved = true;
    }
    if (keysRef.current['arrowdown'] || keysRef.current['s']) {
      newPos.y += speed;
      moved = true;
    }
    if (keysRef.current['arrowup'] || keysRef.current['w']) {
      newPos.y -= speed;
      moved = true;
    }
    
    newPos.x = Math.max(0, Math.min(newPos.x, dimensions.width - PLAYER_SIZE));
    newPos.y = Math.max(0, Math.min(newPos.y, dimensions.height - PLAYER_SIZE));
    
    posRef.current = newPos;
    
    const dx = newPos.x - pointPosRef.current.x;
    const dy = newPos.y - pointPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      scoreRef.current += isMegaPointRef.current ? 5 : 1;
      setScore(scoreRef.current);
      
      enemySpeedRef.current += 0.05;
      spawnNewPoint(pointCounterRef.current);
    }
    
    const enemyDx = posRef.current.x - enemyPosRef.current.x;
    const enemyDy = posRef.current.y - enemyPosRef.current.y;
    const enemyDist = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);

    if (enemyDist < 45) {
      setIsGameOver(true);
    } else {
      enemyPosRef.current = {
        x: enemyPosRef.current.x + (enemyDx / enemyDist) * enemySpeedRef.current,
        y: enemyPosRef.current.y + (enemyDy / enemyDist) * enemySpeedRef.current
      };
    }
    
    const now = performance.now();
    if (now - lastUpdateRef.current > 50) {
      setPos({ ...posRef.current });
      setEnemyPos({ ...enemyPosRef.current });
      lastUpdateRef.current = now;
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (hasStarted) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [hasStarted, isGameOver]); 

  const handleStart = () => {
    stopAllSounds();
    setHasStarted(true);
  };

  const handleReset = () => {
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('face_hc', scoreRef.current.toString());
    }
    
    stopAllSounds();
    
    posRef.current = { x: 50, y: 150 };
    enemyPosRef.current = { x: dimensions.width - 100, y: dimensions.height - 150 };
    enemySpeedRef.current = INITIAL_ENEMY_SPEED;
    scoreRef.current = 0;
    pointCounterRef.current = 0;
    isMegaPointRef.current = false;
    
    setPos({ x: 50, y: 150 });
    setEnemyPos({ x: dimensions.width - 100, y: dimensions.height - 150 });
    setScore(0);
    setPointCounter(0);
    setIsMegaPoint(false);
    setIsGameOver(false);
    
    spawnNewPoint(-1); 
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-hidden touch-none select-none">
      <div className="absolute top-6 left-6 z-30">
        <div className="text-emerald-400 text-4xl font-black italic flex items-center gap-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          <Zap fill="currentColor" size={30} /> {score}
        </div>
        <div className="text-zinc-500 font-bold text-xs tracking-widest mt-1">রেকর্ড ভোট সংখ্যা: {highScore}</div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] bg-size-[40px_40px] opacity-40" />

      <div className="absolute z-10" style={{ left: pointPos.x, top: pointPos.y }}>
        {isMegaPoint ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="bg-yellow-400 p-2 rounded-xl shadow-[0_0_30px_#facc15] border-2 border-white">
            <Star fill="black" size={32} />
          </motion.div>
        ) : (
          <div className="w-8 h-8 bg-emerald-500 rounded-full shadow-[0_0_20px_#10b981] border-4 border-emerald-300" />
        )}
      </div>

      <motion.div 
        animate={{ x: pos.x, y: pos.y }} 
        transition={{ type: "spring", stiffness: 600, damping: 30 }} 
        className="absolute z-20"
      >
        <img src={PLAYER_IMAGE_URL} alt="P" className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] object-cover" />
      </motion.div>

      <motion.div 
        animate={{ x: enemyPos.x, y: enemyPos.y }} 
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className="absolute z-10"
      >
        <img src={ENEMY_IMAGE_URL} alt="E" className="w-12 h-12 rounded-full border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)] object-cover" />
      </motion.div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center md:hidden">
        <div className="grid grid-cols-3 gap-5 bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10">
          <div />
          <button 
            className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500 touch-none" 
            onTouchStart={() => { keysRef.current['w'] = true; }}
            onTouchEnd={() => { keysRef.current['w'] = false; }}
            onMouseDown={() => { keysRef.current['w'] = true; }}
            onMouseUp={() => { keysRef.current['w'] = false; }}
            onMouseLeave={() => { keysRef.current['w'] = false; }}
          >↑</button>
          <div />
          <button 
            className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500 touch-none" 
            onTouchStart={() => { keysRef.current['a'] = true; }}
            onTouchEnd={() => { keysRef.current['a'] = false; }}
            onMouseDown={() => { keysRef.current['a'] = true; }}
            onMouseUp={() => { keysRef.current['a'] = false; }}
            onMouseLeave={() => { keysRef.current['a'] = false; }}
          >←</button>
          <button 
            className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500 touch-none" 
            onTouchStart={() => { keysRef.current['s'] = true; }}
            onTouchEnd={() => { keysRef.current['s'] = false; }}
            onMouseDown={() => { keysRef.current['s'] = true; }}
            onMouseUp={() => { keysRef.current['s'] = false; }}
            onMouseLeave={() => { keysRef.current['s'] = false; }}
          >↓</button>
          <button 
            className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center active:bg-emerald-500 touch-none" 
            onTouchStart={() => { keysRef.current['d'] = true; }}
            onTouchEnd={() => { keysRef.current['d'] = false; }}
            onMouseDown={() => { keysRef.current['d'] = true; }}
            onMouseUp={() => { keysRef.current['d'] = false; }}
            onMouseLeave={() => { keysRef.current['d'] = false; }}
          >→</button>
        </div>
      </div>

      <AnimatePresence>
        {!hasStarted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] text-center shadow-2xl max-w-sm w-full">
              <h2 className="text-3xl font-black text-white mb-6 italic leading-tight">পাটওয়ারীকে মীর্জা আব্বাসের হাত থেকে বাঁচাও!</h2>
              <button onClick={handleStart} className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black py-4 rounded-2xl font-black text-xl active:scale-95 transition-all">
                <Play size={24} fill="currentColor" /> লাগা দৌড়
              </button>
            </div>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <div className="bg-zinc-900 border border-white/10 p-10 rounded-[2.5rem] text-center shadow-2xl max-w-sm w-full">
              <h2 className="text-5xl font-black text-white mb-2 italic">পাটওয়ারী কট!</h2>
              <p className="text-zinc-400 mb-8 font-medium italic uppercase tracking-widest">সংগৃহীত ভোট: {score}</p>
              <button onClick={handleReset} className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black py-4 rounded-2xl font-black text-xl active:scale-95 transition-all">
                <RotateCcw size={24} /> আবার দৌড়া
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}