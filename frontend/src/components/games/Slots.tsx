import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Star, Zap, Gem, Bell, Apple, Cherry } from 'lucide-react';

const SYMBOLS = [
  { icon: <Star size={40} />, color: '#fbbf24', value: '7', multiplier: 50 },
  { icon: <Zap size={40} />, color: '#8b5cf6', value: 'zap', multiplier: 25 },
  { icon: <Gem size={40} />, color: '#3b82f6', value: 'gem', multiplier: 15 },
  { icon: <Bell size={40} />, color: '#f59e0b', value: 'bell', multiplier: 10 },
  { icon: <Apple size={40} />, color: '#ef4444', value: 'apple', multiplier: 5 },
  { icon: <Cherry size={40} />, color: '#ec4899', value: 'cherry', multiplier: 2 },
];

const Slots: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100); // 1.00$
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 1, 2]);
  const [message, setMessage] = useState('');

  const spinReels = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setSpinning(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'slots', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setSpinning(false);
        return;
      }

      // Outcome indices from backend (0-5)
      const outcome = data.result.outcome; // [idx1, idx2, idx3]

      // Start animation
      setTimeout(() => {
        setReels(outcome);
        setSpinning(false);
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));

        if (data.winAmount > 0) {
          setMessage(`ВЫИГРЫШ: $${(data.winAmount / 100).toFixed(2)} (x${data.multiplier})`);
        } else {
          setMessage('Увы, попробуйте еще раз');
        }
      }, 2000);

    } catch (e: any) {
            if (e.message.includes('Недостаточно баланса')) {
        setMessage('Ошибка: Недостаточно баланса');
      } else if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setMessage('Ошибка: Сессия истекла');
      } else {
        setMessage(e.message === 'Failed to fetch' ? 'Ошибка сети' : e.message);
      }
      setSpinning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* Slots Machine Display */}
      <div className="slots-container" style={{
        display: 'flex',
        gap: '15px',
        background: 'rgba(255,255,255,0.02)',
        padding: '24px',
        borderRadius: '32px',
        border: '2px solid rgba(255,255,255,0.05)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(168, 85, 247, 0.1)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Lights Effect */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'linear-gradient(90deg, transparent, var(--primary-color), transparent)', animation: 'scanLine 2s linear infinite' }} />

        {[0, 1, 2].map((i) => (
          <div key={i} className={`reel ${spinning ? 'spinning' : ''}`} style={{
            width: '80px',
            height: '100px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              transition: spinning ? 'none' : 'transform 0.5s cubic-bezier(0.45, 0.05, 0.55, 0.95)',
              transform: spinning ? 'translateY(-500%)' : 'translateY(0)',
              color: SYMBOLS[reels[i]].color,
              filter: spinning ? 'blur(4px)' : 'none'
            }}>
              {SYMBOLS[reels[i]].icon}
            </div>
            {/* Spinning Blur Placeholder if needed */}
          </div>
        ))}
      </div>

      {/* Message Area */}
      <div style={{ height: '24px', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          {message && (
             <motion.div
               key={message}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.5, opacity: 0 }}
               style={{
 height: '24px', textAlign: 'center' 
               }}
             >
               {message}
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <BetControls 
        bet={bet} 
        setBet={setBet} 
        minBet={10} 
        maxBet={100000} 
        onPlay={spinReels} 
        loading={spinning}
      />

      <style>{`
        @keyframes spinning {
          0% { transform: translateY(0); }
          100% { transform: translateY(-1000%); }
        }
        .reel.spinning div {
          animation: spinning 0.1s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Slots;
