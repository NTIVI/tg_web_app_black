import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Gem, Bomb, Shield, Trophy, AlertCircle } from 'lucide-react';

interface MinesProps {
  balance: number;
  setBalance: (val: number) => void;
  setTgUser?: (val: (prev: any) => any) => void;
}

const Mines: React.FC<MinesProps> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<boolean[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Clear message after 3s if not win/lose
  useEffect(() => {
    if (message && status !== 'win' && status !== 'lose') {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message, status, setMessage]);

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
    setRevealed([]);
    setMines([]);
    setCurrentMultiplier(1);
    setMessage('');
    
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ game: 'mines', bet, mineCount }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage('⚠️ ' + data.error);
      } else {
        setStatus('playing');
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Mines startGame error:', err);
      setMessage('⚠️ Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (index: number) => {
    if (status !== 'playing' || revealed.includes(index) || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ action: 'open', index }),
      });
      const data = await res.json();

      if (data.error) {
          setMessage('⚠️ ' + data.error);
          return;
      }

      if (data.status === 'lose') {
        setStatus('lose');
        setMines(data.mines);
        setMessage('БОМБА! ВЫ ПРОИГРАЛИ');
      } else if (data.status === 'playing') {
        setRevealed(data.revealed);
        setCurrentMultiplier(data.currentMultiplier);
        if (setTgUser) setTgUser(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
       console.error('Mines handleAction error:', err);
       setMessage('⚠️ Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (status !== 'playing' || revealed.length === 0 || loading) return;

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

      if (data.error) {
          setMessage('⚠️ ' + data.error);
          return;
      }

      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        setMines(data.mines);
        if (setTgUser) setTgUser(prev => ({ ...prev, ...data }));
        setMessage(`WIN! +$${(data.winAmount / 100).toFixed(2)}`);
      }
    } catch {
        setMessage('⚠️ Ошибка при выводе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      
      {/* Game Header HUD */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        maxWidth: '350px',
        padding: '0 10px',
        marginBottom: '10px'
      }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Множитель</div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--gold-color)' }}>x{currentMultiplier.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Профит</div>
              <div style={{ fontSize: '24px', fontWeight: '950', color: 'var(--success-color)' }}>
                  +${((bet * (currentMultiplier - 1)) / 100).toFixed(2)}
              </div>
          </div>
      </div>

      {/* 5x5 Premium Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '10px', 
        width: '100%', 
        maxWidth: '360px',
        background: 'rgba(255,255,255,0.03)',
        padding: '16px',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.02)'
      }}>
        {Array.from({ length: 25 }).map((_, i) => {
          const isRevealed = revealed.includes(i);
          const isMine = mines[i];
          const isClickable = status === 'playing' && !isRevealed && !loading;

          return (
            <motion.div 
              key={i}
              onClick={() => handleOpen(i)}
              whileHover={isClickable ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotateY: isRevealed || mines.length > 0 ? 180 : 0,
                backgroundColor: isRevealed 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : isMine 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(255,255,255,0.05)',
                borderColor: isRevealed 
                    ? 'rgba(16, 185, 129, 0.4)' 
                    : isMine 
                        ? 'rgba(239, 68, 68, 0.4)' 
                        : 'rgba(255,255,255,0.1)'
              }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
              style={{ 
                aspectRatio: '1',
                borderRadius: '14px',
                cursor: isClickable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
                position: 'relative'
              }}
            >
              <div style={{ 
                  position: 'absolute', 
                  backfaceVisibility: 'hidden',
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                   {/* Front side (Unrevealed) */}
                   <Shield size={18} color="rgba(255,255,255,0.1)" />
              </div>

              <div style={{ 
                  position: 'absolute', 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                   {/* Back side (Revealed) */}
                   {isRevealed && !isMine && (
                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                           <Gem size={24} color="#10b981" fill="#10b981" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
                       </motion.div>
                   )}
                   {isMine && (
                       <motion.div 
                         initial={{ scale: 0 }} 
                         animate={{ scale: [0, 1.2, 1], x: [0, -2, 2, -2, 2, 0] }}
                         transition={{ duration: 0.4 }}
                       >
                           <Bomb size={24} color="#ef4444" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }} />
                       </motion.div>
                   )}
                   {!isRevealed && isMine && mines.length > 0 && (
                       <Bomb size={20} color="rgba(239, 68, 68, 0.3)" />
                   )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Status Message Overlay */}
      <div style={{ textAlign: 'center', height: '30px' }}>
         <AnimatePresence mode="wait">
            {message && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -10 }}
                    key={message}
                    style={{ 
                        fontSize: '16px', 
                        fontWeight: '900', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: status === 'win' ? 'var(--success-color)' : status === 'lose' ? 'var(--casino-red)' : '#fff' 
                    }}
                >
                    {status === 'win' && <Trophy size={18} />}
                    {message.includes('⚠️') || message.includes('❌') ? <AlertCircle size={18} /> : null}
                    {message}
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Controls Container */}
      <div style={{ width: '100%', maxWidth: '360px', marginTop: '10px' }}>
          {status === 'playing' ? (
              <button 
                className="btn-primary" 
                onClick={cashOut}
                disabled={revealed.length === 0 || loading}
                style={{ 
                    width: '100%', 
                    height: '64px', 
                    borderRadius: '20px',
                    background: 'var(--success-color)',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                }}
              >
                {loading ? <div className="spinner" style={{ width: '24px', height: '24px' }} /> : (
                    <>
                        <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' }}>Забрать выигрыш</span>
                        <span style={{ fontSize: '20px', fontWeight: '950' }}>${((bet * currentMultiplier) / 100).toFixed(2)}</span>
                    </>
                )}
              </button>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Mine Count Selector */}
                  <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '12px 20px', 
                      borderRadius: '18px', 
                      border: '1px solid rgba(255,255,255,0.08)' 
                  }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>Кол-во мин</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--casino-red)' }}>{mineCount}</span>
                      </div>
                      <input 
                        type="range" min="1" max="24" value={mineCount} 
                        onChange={(e) => setMineCount(parseInt(e.target.value))}
                        disabled={loading}
                        style={{ flex: 3 }}
                      />
                  </div>

                  <BetControls 
                    bet={bet} 
                    setBet={setBet} 
                    minBet={50} 
                    maxBet={100000} 
                    onPlay={startGame} 
                    loading={loading} 
                  />
                  
                  {status !== 'idle' && (
                      <button 
                        onClick={() => { setStatus('idle'); setMessage(''); }} 
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                      >
                          СБРОСИТЬ ПОЛЕ
                      </button>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default Mines;

