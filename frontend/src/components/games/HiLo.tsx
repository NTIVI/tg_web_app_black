import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Club, Spade, Heart, Diamond, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';

const SuitIcon = ({ suit, size = 20 }: { suit: string, size?: number }) => {
  switch (suit) {
    case 'hearts': return <Heart size={size} color="#ef4444" fill="#ef4444" />;
    case 'diamonds': return <Diamond size={size} color="#ef4444" fill="#ef4444" />;
    case 'clubs': return <Club size={size} color="#333" fill="#333" />;
    case 'spades': return <Spade size={size} color="#333" fill="#333" />;
    default: return null;
  }
};

const Card = ({ card }: { card: any }) => (
  <motion.div 
    initial={{ x: 50, opacity: 0, rotateY: 90 }}
    animate={{ x: 0, opacity: 1, rotateY: 0 }}
    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
    style={{
      width: '100px',
      height: '140px',
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
      position: 'relative',
      color: '#000',
    }}>
    <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '18px', fontWeight: '900' }}>{card.value}</div>
    <SuitIcon suit={card.suit} size={40} />
    <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '18px', fontWeight: '900', transform: 'rotate(180deg)' }}>{card.value}</div>
  </motion.div>
);

const HiLo: React.FC<any> = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose'>('idle');
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const startGame = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    setMultiplier(1.0);
    
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'hilo', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setCurrentCard(data.currentCard);
        setStatus('playing');
        setBalance((prev: number) => prev - bet);
      }
    } catch (e: any) {
       console.error('HiLo startGame error:', e);
       setMessage('Ошибка сети: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (guess: 'higher' | 'lower' | 'same') => {
    if (status !== 'playing' || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ action: 'guess', guess }),
      });
      const data = await res.json();

      if (data.status === 'lose') {
        setStatus('lose');
        setCurrentCard(data.nextCard);
        setMessage('ПРОИГРЫШ! Карта оказалась ' + (data.nextCard.value));
      } else if (data.status === 'playing') {
        setCurrentCard(data.currentCard);
        setMultiplier(data.currentMultiplier);
      }
    } catch (e: any) {
       console.error('HiLo handleGuess error:', e);
       setMessage('Ошибка сети: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
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
        setMessage(`WIN! +$${(data.winAmount / 100).toFixed(2)}`);
      }
    } catch (e: any) {
       console.error('HiLo cashOut error:', e);
       setMessage('Ошибка сети: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* Table Area */}
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '300px', 
        borderRadius: '32px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        {currentCard ? <Card card={currentCard} /> : <div style={{ opacity: 0.1 }}><HelpCircle size={100} /></div>}
        
        {status === 'playing' && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '14px', fontWeight: '900' }}>
               x{multiplier.toFixed(2)}
            </div>
        )}
      </div>

      <div style={{ height: '24px', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
            {message && (
                <motion.div 
                    key={message}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{ fontSize: '18px', fontWeight: '900', color: status === 'win' ? 'var(--success-color)' : status === 'lose' ? '#ef4444' : '#fff' }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {status === 'playing' ? (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleGuess('higher')} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}><ArrowUp size={20} /> ВЫШЕ</button>
                  <button onClick={() => handleGuess('same')} className="btn-primary" style={{ flex: 0.5, background: 'rgba(255,255,255,0.05)' }}>=</button>
                  <button onClick={() => handleGuess('lower')} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}><ArrowDown size={20} /> НИЖЕ</button>
              </div>
              <button 
                className="btn-primary" 
                onClick={cashOut}
                disabled={loading}
                style={{ height: '60px', borderRadius: '20px', background: 'var(--success-color)' }}
              >
                ЗАБРАТЬ $${((bet * multiplier) / 100).toFixed(2)}
              </button>
          </div>
      ) : (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <BetControls bet={bet} setBet={setBet} minBet={50} maxBet={100000} onPlay={startGame} loading={loading} />
              {status !== 'idle' && (
                  <button onClick={() => setStatus('idle')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Сбросить</button>
              )}
          </div>
      )}

      {/* Removed keyframes since we use framer-motion */}
    </div>
  );
};

export default HiLo;
