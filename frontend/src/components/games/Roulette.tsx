import { useState, useRef } from 'react';
import { API_URL } from '../../config';
import BetControls from './BetControls';

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const getColor = (num: number) => {
  if (num === 0) return '#10b981'; // Green
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return reds.includes(num) ? '#ef4444' : '#1a1a1a'; // Red or Black
};

const Roulette: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [betOn, setBetOn] = useState<'red' | 'black' | 'green'>('red');
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [rotation, setRotation] = useState(0);
  const tapeRef = useRef<HTMLDivElement>(null);

  // Flattened tape for infinite scroll effect
  const tapeNumbers = [...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS, ...ROULETTE_NUMBERS];

  const handlePlay = async () => {
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
        body: JSON.stringify({ game: 'roulette', bet, betOn }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setSpinning(false);
        return;
      }

      const winNumber = data.result.winNumber;
      const indexInTape = ROULETTE_NUMBERS.indexOf(winNumber) + (ROULETTE_NUMBERS.length * 2);
      const itemWidth = 80; // px
      const offset = (indexInTape * itemWidth) - (window.innerWidth / 2) + (itemWidth / 2);

      setRotation(offset);

      setTimeout(() => {
        setSpinning(false);
        setBalance(data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));

        if (data.winAmount > 0) {
          setMessage(`ПОБЕДА: $${(data.winAmount / 100).toFixed(2)} (${winNumber} ${getColor(winNumber).includes('ef4444') ? 'Красное' : getColor(winNumber).includes('10b981') ? 'Зеро' : 'Черное'})`);
        } else {
          setMessage(`ВЫПАЛО: ${winNumber}. Попробуйте еще раз!`);
        }
      }, 3000);

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
      
      {/* Tape Selection Indicator */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#000', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '2px', height: '100%', background: 'var(--primary-color)', zIndex: 10, boxShadow: '0 0 15px var(--primary-color)' }} />
        
        <div 
          ref={tapeRef}
          style={{ 
            display: 'flex', 
            transition: spinning ? 'transform 3s cubic-bezier(0.1, 0, 0.1, 1)' : 'none',
            transform: `translateX(-${rotation}px)`
          }}
        >
          {tapeNumbers.map((num, i) => (
            <div key={i} style={{ 
              minWidth: '80px', 
              height: '80px', 
              background: getColor(num), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px', 
              fontWeight: '900',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              margin: '0 5px'
            }}>
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Betting Options */}
      <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
        <button 
          onClick={() => setBetOn('red')}
          disabled={spinning}
          style={{ flex: 1, padding: '16px', borderRadius: '16px', background: betOn === 'red' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)', border: betOn === 'red' ? '2px solid #fff' : '1px solid #ef4444', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
        >
          КРАСНОЕ x2
        </button>
        <button 
          onClick={() => setBetOn('green')}
          disabled={spinning}
          style={{ width: '80px', background: betOn === 'green' ? '#10b981' : 'rgba(16, 185, 129, 0.1)', border: betOn === 'green' ? '2px solid #fff' : '1px solid #10b981', borderRadius: '16px', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
        >
          ЗЕРО x14
        </button>
        <button 
          onClick={() => setBetOn('black')}
          disabled={spinning}
          style={{ flex: 1, padding: '16px', borderRadius: '16px', background: betOn === 'black' ? '#1a1a1a' : 'rgba(255, 255, 255, 0.05)', border: betOn === 'black' ? '2px solid #fff' : '1px solid #1a1a1a', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
        >
          ЧЕРНОЕ x2
        </button>
      </div>

      {/* Message Area */}
      <div style={{ textAlign: 'center', height: '24px', fontWeight: '800', fontSize: '18px' }}>
        {message}
      </div>

      <BetControls 
        bet={bet} 
        setBet={setBet} 
        minBet={10} 
        maxBet={100000} 
        onPlay={handlePlay} 
        loading={spinning}
      />
    </div>
  );
};

export default Roulette;
