import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';

const CoinFlip: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [betOn, setBetOn] = useState<'heads' | 'tails'>('heads');
  const [loading, setLoading] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [message, setMessage] = useState('');

  const handleFlip = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setFlipping(true);
    setMessage('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'coinflip', bet, betOn }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setFlipping(false);
      } else {
        // Animation delay
        setTimeout(() => {
          setFlipping(false);
          setResult(data.result);
          setBalance(data.newBalance);
          if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
          
          if (data.win) {
            setMessage(`WIN! x1.95 (+$${(data.winAmount / 100).toFixed(2)})`);
          } else {
            setMessage('LОSE! Попробуйте еще раз');
          }
        }, 2000);
      }
    } catch (e) {
            if (e.message.includes('Недостаточно баланса')) {
        setMessage('Ошибка: Недостаточно баланса');
      } else if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setMessage('Ошибка: Сессия истекла');
      } else {
        setMessage(e.message === 'Failed to fetch' ? 'Ошибка сети' : e.message);
      }
      setFlipping(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* 3D Coin Visualization */}
      <div style={{ position: 'relative', width: '150px', height: '150px', perspective: '1000px' }}>
        <div className={`coin ${flipping ? 'spinning' : ''} ${result ? result : ''}`} style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease-out',
            transform: result === 'tails' ? 'rotateY(180deg)' : 'rotateY(0)'
        }}>
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                borderRadius: '50%',
                border: '4px solid #b45309',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
                zIndex: 2
            }}>
                <span style={{ fontSize: '40px', fontWeight: '900', color: '#b45309' }}>H</span>
            </div>
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                borderRadius: '50%',
                border: '4px solid #b45309',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                zIndex: 1
            }}>
                <span style={{ fontSize: '40px', fontWeight: '900', color: '#b45309' }}>T</span>
            </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '300px' }}>
          <button 
            onClick={() => setBetOn('heads')}
            disabled={loading || flipping}
            style={{ flex: 1, padding: '15px', borderRadius: '16px', background: betOn === 'heads' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
          >
              ОРЕЛ
          </button>
          <button 
            onClick={() => setBetOn('tails')}
            disabled={loading || flipping}
            style={{ flex: 1, padding: '15px', borderRadius: '16px', background: betOn === 'tails' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
          >
              РЕШКА
          </button>
      </div>

      <div style={{ height: '24px', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          {message && (
             <motion.div
               key={message}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.5, opacity: 0 }}
               style={{
 height: '24px', textAlign: 'center', fontSize: '18px', fontWeight: '900', color: result ? (message.includes('WIN') ? 'var(--success-color)' : '#ef4444') : '#fff' 
               }}
             >
               {message}
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BetControls 
        bet={bet} 
        setBet={setBet} 
        minBet={10} 
        maxBet={100000} 
        onPlay={handleFlip} 
        loading={loading || flipping}
      />

      <style>{`
        @keyframes spin {
            0% { transform: rotateY(0); }
            100% { transform: rotateY(1800deg); }
        }
        .coin.spinning {
            animation: spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default CoinFlip;
