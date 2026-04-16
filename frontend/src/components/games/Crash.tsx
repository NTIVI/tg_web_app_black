import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Zap, Rocket, AlertTriangle, CheckCircle2, History } from 'lucide-react';

const Crash: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'crashed' | 'win'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<number[]>([]);
  
  const timerRef = useRef<any>(null);
  const pointsRef = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    if (status === 'playing' && startTime) {
      pointsRef.current = [{x: 0, y: 100}];
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentMult = Math.pow(Math.E, 0.06 * elapsed);
        setMultiplier(currentMult);
        
        // Add point for the chart
        if (pointsRef.current.length < 100) {
            pointsRef.current.push({
                x: elapsed * 10,
                y: 100 / currentMult
            });
        }
      }, 50);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, startTime]);

  const startGame = async () => {
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
        setMessage('⚠️ Пожалуйста, войдите снова');
        return;
    }

    if (balance < bet) {
      setMessage('❌ Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    setMultiplier(1.00);
    pointsRef.current = [{x: 0, y: 100}];
    
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ game: 'crash', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
        setLoading(false);
      } else {
        setStartTime(data.startTime);
        setStatus('playing');
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setLoading(false);
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка сети');
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (status !== 'playing' || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ action: 'cashout' }),
      });
      const data = await res.json();

      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setMessage(`WIN! +$${(data.winAmount / 100).toFixed(2)}`);
        setHistory(prev => [data.multiplier, ...prev].slice(0, 10));
      } else if (data.status === 'crashed') {
        setStatus('crashed');
        setMessage(`CRASHED AT x${data.crashPoint.toFixed(2)}`);
        setHistory(prev => [data.crashPoint, ...prev].slice(0, 10));
      }
    } catch (e: any) {
      setMessage('⚠️ Ошибка при выводе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      
      {/* Visual Crash Area */}
      <div style={{ 
        width: '100%', 
        height: '320px', 
        background: '#0d0d0f', 
        borderRadius: '32px', 
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(168, 85, 247, 0.05)'
      }}>
        {/* Background Grid */}
        <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            opacity: 0.05, 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            transform: status === 'playing' ? `translateY(${(multiplier * 10) % 40}px)` : 'none'
        }} />
        
        {/* Multiplier Display */}
        <div style={{ zIndex: 10, textAlign: 'center' }}>
          <motion.div 
            animate={status === 'playing' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ 
              fontSize: '84px', 
              fontWeight: '950', 
              color: status === 'crashed' ? 'var(--casino-red)' : status === 'win' ? 'var(--success-color)' : '#fff',
              textShadow: status === 'playing' ? `0 0 30px ${multiplier > 2 ? 'var(--success-color)' : 'rgba(255,255,255,0.2)'}` : 'none',
              fontFamily: 'monospace',
              letterSpacing: '-2px'
            }}
          >
            {multiplier.toFixed(2)}x
          </motion.div>
          
          <AnimatePresence>
            {status === 'playing' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: '12px', color: 'var(--success-color)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '-10px' }}
                >
                    <Zap size={14} fill="currentColor" /> Набираем высоту
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Chart Path */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="100%" stopColor="var(--gold-color)" />
                </linearGradient>
            </defs>
            {status === 'playing' && (
                <motion.path 
                    d={`M 0 320 ${pointsRef.current.map(p => `L ${Math.min(p.x * 10, 400)} ${Math.max(p.y * 3, 50)}`).join(' ')}`} 
                    fill="none" 
                    stroke="url(#chartGradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                />
            )}
        </svg>

        {/* Rocket Visual */}
        {status === 'playing' && (
            <motion.div
                animate={{ 
                    x: [0, 2, -2, 0],
                    y: [0, -2, 2, 0],
                    bottom: [`${Math.min(30 + (multiplier - 1) * 20, 80)}%`],
                    left: [`${Math.min(10 + (multiplier - 1) * 30, 85)}%`]
                }}
                style={{
                    position: 'absolute',
                    color: 'var(--gold-color)',
                    zIndex: 5,
                    filter: 'drop-shadow(0 0 15px var(--gold-glow))',
                    transform: 'rotate(45deg)'
                }}
            >
                <Rocket size={44} fill="currentColor" />
                {/* Engine Flame */}
                <motion.div 
                    animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                    style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '20px', background: 'linear-gradient(to bottom, var(--gold-color), transparent)', borderRadius: '0 0 4px 4px' }}
                />
            </motion.div>
        )}
      </div>

      {/* Control / Info Area */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <AnimatePresence mode="wait">
          {message && (
             <motion.div
               key={message}
               initial={{ opacity: 0, scale: 0.9, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: -10 }}
               style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '20px',
                    borderRadius: '24px',
                    background: status === 'win' ? 'rgba(16, 185, 129, 0.15)' : status === 'crashed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${status === 'win' ? 'var(--success-color)' : status === 'crashed' ? 'var(--casino-red)' : 'rgba(255,255,255,0.1)'}`,
                    color: status === 'win' ? 'var(--success-color)' : status === 'crashed' ? 'var(--casino-red)' : '#fff',
                    fontWeight: '950',
                    fontSize: '18px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
               }}
             >
               {status === 'win' ? <CheckCircle2 size={24} /> : status === 'crashed' ? <AlertTriangle size={24} /> : null}
               {message}
             </motion.div>
          )}
        </AnimatePresence>

        {status === 'playing' ? (
            <button 
                className="btn-primary" 
                onClick={handleCashout}
                disabled={loading}
                style={{ 
                    width: '100%', 
                    height: '80px', 
                    borderRadius: '24px', 
                    fontSize: '24px',
                    fontWeight: '950',
                    background: 'var(--success-color)',
                    boxShadow: '0 15px 30px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                }}
            >
                {loading ? <div className="spinner" style={{ width: '28px', height: '28px' }} /> : (
                    <>
                        <span style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px' }}>Вывести профит</span>
                        <span>${((bet * multiplier) / 100).toFixed(2)}</span>
                    </>
                )}
            </button>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={startGame} loading={loading} />
                
                {history.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
                        <History size={16} opacity={0.3} />
                        {history.map((m, i) => (
                            <div key={i} style={{ 
                                padding: '6px 14px', 
                                borderRadius: '12px', 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: m > 2 ? 'var(--success-color)' : m > 1.2 ? 'var(--gold-color)' : 'rgba(255,255,255,0.4)',
                                fontSize: '12px',
                                fontWeight: '900',
                                flexShrink: 0
                            }}>
                                {m.toFixed(2)}x
                            </div>
                        ))}
                    </div>
                )}

                {status !== 'idle' && (
                    <button 
                        onClick={() => { setStatus('idle'); setMultiplier(1.00); setMessage(''); }} 
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', padding: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                    >
                        НОВЫЙ ПОЛЁТ
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Crash;
