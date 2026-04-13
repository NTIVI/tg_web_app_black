import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Dice6 } from 'lucide-react';

const Dice: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [type, setType] = useState<'under' | 'over'>('under');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  const winChance = type === 'under' ? target : 100 - target;
  const multiplier = winChance > 0 ? (98 / winChance).toFixed(2) : '0.00';

  const handleRoll = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'dice', bet, target, type }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setResult(data);
        setBalance(data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        
        if (data.win) {
          setMessage(`WIN! x${data.multiplier.toFixed(2)} (+$${(data.winAmount / 100).toFixed(2)})`);
        } else {
          setMessage('MISS! Попробуйте еще раз');
        }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* Visual Dice Card */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.2) 100%)' }}>
        <div style={{ fontSize: '14px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '20px' }}>Результат</div>
        
        <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {result ? (
                <div style={{ fontSize: '64px', fontWeight: '900', color: result.win ? 'var(--success-color)' : '#fff', animation: 'scaleUp 0.3s' }}>
                    {result.roll}
                </div>
            ) : (
                <div style={{ opacity: 0.1 }}><Dice6 size={80} /></div>
            )}
        </div>

        {/* Custom Slider */}
        <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: '800' }}>
                <span>Шанс: {winChance.toFixed(1)}%</span>
                <span>Множитель: x{multiplier}</span>
            </div>
            <input 
                type="range" 
                min="2" 
                max="98" 
                value={target} 
                onChange={(e) => setTarget(parseInt(e.target.value))}
                disabled={loading}
                style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <button 
                    onClick={() => setType('under')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'under' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', marginRight: '5px', cursor: 'pointer' }}
                >
                    Меньше {target}
                </button>
                <button 
                    onClick={() => setType('over')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'over' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '800', marginLeft: '5px', cursor: 'pointer' }}
                >
                    Больше {target}
                </button>
            </div>
        </div>
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
        onPlay={handleRoll} 
        loading={loading}
      />

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: var(--primary-color);
            cursor: pointer;
            box-shadow: 0 0 10px var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default Dice;
