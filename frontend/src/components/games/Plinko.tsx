import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';

const Plinko: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [message, setMessage] = useState('');
  const [ballPos, setBallPos] = useState({ x: 50, y: 0 });

  // 8 rows of pins
  const ROWS = 8;
  const BUCKETS = [10, 5, 2, 0.5, 0.2, 0.2, 0.5, 2, 5, 10]; // 10 buckets (ROWS + 2)

  const handleDrop = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setDropping(true);
    setMessage('');
    
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'plinko', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setDropping(false);
      } else {
        // Generate a path that ends in data.bucketIdx
        // bucketIdx is between 0 and 9
        animateBall(data.bucketIdx, data);
      }
    } catch (e: any) {
            if (e.message.includes('Недостаточно баланса')) {
        setMessage('Ошибка: Недостаточно баланса');
      } else if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setMessage('Ошибка: Сессия истекла');
      } else {
        setMessage(e.message === 'Failed to fetch' ? 'Ошибка сети' : e.message);
      }
      setDropping(false);
    } finally {
      setLoading(false);
    }
  };

  const animateBall = (targetBucket: number, data: any) => {
    
    // Total buckets is 10. Center is between index 4 and 5.
    // Each step is -5% or +5% (scaled to target)
    // This is a simplified animation
    
    const duration = 2000;
    const steps = ROWS;
    const interval = duration / steps;
    
    let step = 0;
    const t = setInterval(() => {
      if (step >= steps) {
        clearInterval(t);
        setDropping(false);
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        if (data.winAmount > bet) {
           setMessage(`WIN! x${data.multiplier} (+$${(data.winAmount / 100).toFixed(2)})`);
        } else {
           setMessage(`Return: x${data.multiplier}`);
        }
        return;
      }

      // Logic to move towards targetBucket
      // This is a dummy visual path
      setBallPos({ x: 50 + (step * (targetBucket - 4.5) * 2), y: (step + 1) * (100 / (ROWS + 1)) });
      step++;
    }, interval);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* Plinko Board */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '400px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '32px', 
        position: 'relative',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        {/* Pins */}
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            {Array.from({ length: r + 2 }).map((_, p) => (
              <div key={p} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        ))}

        {/* Buckets */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', gap: '4px' }}>
          {BUCKETS.map((m, i) => (
            <div key={i} style={{ 
              flex: 1, 
              height: '30px', 
              background: m > 1 ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: '900',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {m}x
            </div>
          ))}
        </div>

        {/* Ball */}
        {dropping && (
          <div style={{ 
            position: 'absolute', 
            top: `${ballPos.y}%`, 
            left: `${ballPos.x}%`, 
            width: '14px', 
            height: '14px', 
            background: 'var(--gold-color)', 
            borderRadius: '50%',
            boxShadow: '0 0 10px var(--gold-color)',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s linear',
            zIndex: 10
          }} />
        )}
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
 height: '24px', textAlign: 'center', fontSize: '18px', fontWeight: '900' 
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
        onPlay={handleDrop} 
        loading={loading || dropping}
      />
    </div>
  );
};

export default Plinko;
