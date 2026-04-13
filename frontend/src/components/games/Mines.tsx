import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Gem, Bomb } from 'lucide-react';

const Mines: React.FC<any> = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<boolean[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const startGame = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
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
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'mines', bet, mineCount }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setStatus('playing');
        setBalance((prev: number) => prev - bet);
      }
    } catch (e: any) {
      console.error('Mines startGame error:', e);
      setMessage('Ошибка сети: ' + e.message);
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

      if (data.status === 'lose') {
        setStatus('lose');
        setMines(data.mines);
        setMessage('БОМБА! ВЫ ПРОИГРАЛИ');
      } else if (data.status === 'playing') {
        setRevealed(data.revealed);
        setCurrentMultiplier(data.currentMultiplier);
      }
    } catch (e: any) {
       console.error('Mines handleAction error:', e);
       setMessage('Ошибка сети: ' + e.message);
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

      if (data.status === 'win') {
        setStatus('win');
        setBalance(data.balance);
        setMines(data.mines);
        setMessage(`WIN! +$${(data.winAmount / 100).toFixed(2)}`);
      }
    } catch (e) {
            if (e.message.includes('Недостаточно баланса')) {
        setMessage('Ошибка: Недостаточно баланса');
      } else if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setMessage('Ошибка: Сессия истекла');
      } else {
        setMessage(e.message === 'Failed to fetch' ? 'Ошибка сети' : e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      
      {/* 5x5 Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '8px', 
        width: '100%', 
        maxWidth: '350px',
        background: 'rgba(255,255,255,0.02)',
        padding: '12px',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div 
            key={i}
            onClick={() => handleOpen(i)}
            whileHover={status === 'playing' && !revealed.includes(i) ? { scale: 1.05 } : {}}
            whileTap={status === 'playing' && !revealed.includes(i) ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotateY: revealed.includes(i) || mines.length > 0 ? 360 : 0,
              backgroundColor: revealed.includes(i) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'
            }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
            style={{ 
              aspectRatio: '1',
              borderRadius: '12px',
              cursor: status === 'playing' && !revealed.includes(i) ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              perspective: '1000px'
            }}
          >
            {revealed.includes(i) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Gem size={24} color="var(--primary-color)" /></motion.div>}
            {mines[i] && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Bomb size={24} color={revealed.includes(i) ? '#ef4444' : 'rgba(239, 68, 68, 0.4)'} /></motion.div>}
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: 'center', height: '24px' }}>
         <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={message || status}
            style={{ fontSize: '18px', fontWeight: '900', color: status === 'win' ? 'var(--success-color)' : status === 'lose' ? '#ef4444' : '#fff' }}
         >
            {message || (status === 'playing' ? `Текущий множитель: x${currentMultiplier.toFixed(2)}` : '')}
         </motion.div>
      </div>

      {status === 'playing' ? (
          <div style={{ width: '100%', maxWidth: '350px' }}>
              <button 
                className="btn-primary" 
                onClick={cashOut}
                disabled={revealed.length === 0 || loading}
                style={{ width: '100%', height: '60px', borderRadius: '20px' }}
              >
                ЗАБРАТЬ $${((bet * currentMultiplier) / 100).toFixed(2)}
              </button>
          </div>
      ) : (
          <div style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Bomb size={18} color="#ef4444" />
                  <span style={{ fontSize: '12px', opacity: 0.7, flex: 1 }}>МИН: {mineCount}</span>
                  <input 
                    type="range" min="1" max="24" value={mineCount} 
                    onChange={(e) => setMineCount(parseInt(e.target.value))}
                    style={{ flex: 2 }}
                  />
              </div>
              <BetControls bet={bet} setBet={setBet} minBet={50} maxBet={100000} onPlay={startGame} loading={loading} />
              {status !== 'idle' && (
                  <button onClick={() => setStatus('idle')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Сбросить</button>
              )}
          </div>
      )}
    </div>
  );
};

export default Mines;
