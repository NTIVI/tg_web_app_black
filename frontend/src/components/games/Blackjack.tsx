import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';
import { Club, Spade, Heart, Diamond } from 'lucide-react';

const SuitIcon = ({ suit, size = 20 }: { suit: string, size?: number }) => {
  switch (suit) {
    case 'hearts': return <Heart size={size} color="#ef4444" fill="#ef4444" />;
    case 'diamonds': return <Diamond size={size} color="#ef4444" fill="#ef4444" />;
    case 'clubs': return <Club size={size} color="#333" fill="#333" />;
    case 'spades': return <Spade size={size} color="#333" fill="#333" />;
    default: return null;
  }
};

const Card = ({ card, hidden }: { card: any, hidden?: boolean }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0, y: -20, rotateY: hidden ? 180 : 0 }}
    animate={{ scale: 1, opacity: 1, y: 0, rotateY: hidden ? 180 : 0 }}
    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
    style={{
      width: '60px',
      height: '90px',
      background: hidden ? 'linear-gradient(135deg, #1e40af, #a855f7)' : '#fff',
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      position: 'relative',
      color: '#000',
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    }}>
    {!hidden && (
      <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '12px', fontWeight: '900' }}>{card.value}</div>
        <SuitIcon suit={card.suit} size={28} />
        <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '12px', fontWeight: '900', transform: 'rotate(180deg)' }}>{card.value}</div>
      </div>
    )}
    {hidden && <div style={{ color: '#fff', fontSize: '24px', fontWeight: '900', opacity: 0.3, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>?</div>}
  </motion.div>
);

const Blackjack: React.FC<any> = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'win' | 'lose' | 'push' | 'bust'>('idle');
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const startLevel = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'blackjack', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setPlayerHand(data.playerHand);
        setDealerHand(data.dealerHand);
        setStatus('playing');
        setBalance((prev: number) => prev - bet);
      }
    } catch (e: any) {
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

  const handleAction = async (action: 'hit' | 'stand') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/games/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.error) {
          setMessage(data.error);
      } else {
          if (data.playerHand) setPlayerHand(data.playerHand);
          if (data.dealerHand) setDealerHand(data.dealerHand);
          if (data.status) setStatus(data.status);
          if (data.balance !== undefined) setBalance(data.balance);

          if (data.status === 'bust') setMessage('ПЕРЕБОР! ВЫ ПРОИГРАЛИ');
          else if (data.status === 'win') setMessage('ПОБЕДА! +$' + (data.winAmount / 100).toFixed(2));
          else if (data.status === 'lose') setMessage('ДИЛЕР ВЫИГРАЛ');
          else if (data.status === 'push') setMessage('НИЧЬЯ (PUSH)');
      }
    } catch (e: any) {
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
      
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '350px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '32px', 
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Dealer Hand */}
        <div>
          <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: '10px' }}>Дилер</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {dealerHand.map((c, i) => <Card key={i} card={c} hidden={c.hidden} />)}
            {dealerHand.length === 0 && <div style={{ color: 'rgba(255,255,255,0.05)', fontSize: '40px' }}><Club size={60} /></div>}
          </div>
        </div>

        {/* Message Overlay */}
        <div style={{ textAlign: 'center', minHeight: '30px' }}>
          <AnimatePresence mode="wait">
            {message && (
              <motion.div 
                key={message}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                style={{ fontSize: '18px', fontWeight: '900', color: status === 'win' ? 'var(--success-color)' : status === 'playing' ? '#fff' : '#ef4444' }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Hand */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            {playerHand.map((c, i) => <Card key={i} card={c} />)}
            {playerHand.length === 0 && <div style={{ color: 'rgba(255,255,255,0.05)', fontSize: '40px' }}><Heart size={60} /></div>}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', textAlign: 'center' }}>Вы</div>
        </div>
      </div>

      {status === 'playing' ? (
        <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
          <button 
            className="btn-primary" 
            onClick={() => handleAction('hit')}
            disabled={loading}
            style={{ flex: 1, height: '60px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            ЕЩЁ (HIT)
          </button>
          <button 
            className="btn-primary" 
            onClick={() => handleAction('stand')}
            disabled={loading}
            style={{ flex: 1, height: '60px', background: 'var(--primary-color)' }}
          >
            ХВАТИТ (STAND)
          </button>
        </div>
      ) : (
        <BetControls 
          bet={bet} 
          setBet={setBet} 
          minBet={100} 
          maxBet={100000} 
          onPlay={startLevel} 
          loading={loading}
        />
      )}

      {status !== 'idle' && status !== 'playing' && (
          <button 
            onClick={() => { setStatus('idle'); setPlayerHand([]); setDealerHand([]); setMessage(''); }}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '800' }}
          >
            Новая игра
          </button>
      )}
    </div>
  );
};

export default Blackjack;
