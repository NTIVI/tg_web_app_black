import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import BetControls from './BetControls';


const Crash: React.FC<any> = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [status, setStatus] = useState<'idle' | 'playing' | 'crashed' | 'win'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (status === 'playing' && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentMult = Math.pow(Math.E, 0.06 * elapsed);
        setMultiplier(currentMult);
      }, 50);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, startTime]);

  const startGame = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setMessage('');
    setMultiplier(1.00);
    
    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'crash', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setLoading(false);
      } else {
        setStartTime(data.startTime);
        setStatus('playing');
        setBalance((prev: number) => prev - bet);
        setLoading(false);
      }
    } catch (e) {
      setMessage('Ошибка сети');
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
        setMessage(`WIN! x${data.multiplier.toFixed(2)} (+$${(data.winAmount / 100).toFixed(2)})`);
      } else if (data.status === 'crashed') {
        setStatus('crashed');
        setMessage(`CRASHED AT x${data.crashPoint.toFixed(2)}`);
      }
    } catch (e) {
      setMessage('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
      
      {/* Visual Chart Area */}
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        height: '250px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '32px', 
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Grid Simulation */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{ 
            fontSize: '64px', 
            fontWeight: '900', 
            color: status === 'crashed' ? '#ef4444' : status === 'win' ? 'var(--success-color)' : '#fff',
            textShadow: status === 'playing' ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
            transition: 'color 0.2s'
          }}>
            {multiplier.toFixed(2)}x
          </div>
          {status === 'playing' && <div style={{ fontSize: '14px', color: 'var(--success-color)', fontWeight: '800' }}>В ИГРЕ...</div>}
        </div>

        {/* Dynamic Curve Effect (Simplified) */}
        {status === 'playing' && (
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '100%',
                height: `${Math.min(multiplier * 5, 80)}%`,
                background: 'linear-gradient(0deg, rgba(168, 85, 247, 0.2), transparent)',
                transition: 'height 0.1s linear'
            }} />
        )}
      </div>

      <div style={{ height: '24px', textAlign: 'center', fontSize: '18px', fontWeight: '900', color: status === 'win' ? 'var(--success-color)' : status === 'crashed' ? '#ef4444' : '#fff' }}>
        {message}
      </div>

      {status === 'playing' ? (
          <button 
            className="btn-primary" 
            onClick={handleCashout}
            disabled={loading}
            style={{ 
                width: '100%', 
                maxWidth: '400px', 
                height: '70px', 
                borderRadius: '24px', 
                fontSize: '20px',
                background: 'var(--success-color)',
                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)'
            }}
          >
            ВЫВЕСТИ $${((bet * multiplier) / 100).toFixed(2)}
          </button>
      ) : (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <BetControls bet={bet} setBet={setBet} minBet={100} maxBet={100000} onPlay={startGame} loading={loading} />
              {status !== 'idle' && (
                  <button onClick={() => setStatus('idle')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Новая ставка</button>
              )}
          </div>
      )}
    </div>
  );
};

export default Crash;
