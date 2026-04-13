import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../config';
import BetControls from './BetControls';

const WheelOfFortune: React.FC<any> = ({ balance, setBalance, setTgUser }) => {
  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const SEGMENTS = [0, 1.2, 0.5, 2, 0, 1.5, 5, 0.2, 1.1, 0, 10, 0.5, 1.2, 0, 20];
  const SEGMENT_ANGLE = 360 / SEGMENTS.length;

  const handleSpin = async () => {
    if (balance < bet) {
      setMessage('Недостаточно баланса');
      return;
    }

    setLoading(true);
    setSpinning(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/games/play`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ game: 'wheel', bet }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setSpinning(false);
      } else {
        const targetRotation = 360 * 5 + (data.segmentIdx * SEGMENT_ANGLE); // 5 full spins + target
        setRotation(prev => prev + (360 - (prev % 360)) + targetRotation);

        setTimeout(() => {
          setSpinning(false);
          setBalance(data.newBalance);
          if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
          
          if (data.winAmount > bet) {
            setMessage(`WIN! x${data.multiplier} (+$${(data.winAmount / 100).toFixed(2)})`);
          } else if (data.winAmount > 0) {
            setMessage(`Return: x${data.multiplier}`);
          } else {
            setMessage('LОSE. Попробуйте еще раз');
          }
        }, 4000);
      }
    } catch (e) {
            if (e.message.includes('Недостаточно баланса')) {
        setMessage('Ошибка: Недостаточно баланса');
      } else if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setMessage('Ошибка: Сессия истекла');
      } else {
        setMessage(e.message === 'Failed to fetch' ? 'Ошибка сети' : e.message);
      }
      setSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
      
      {/* Wheel Visualization */}
      <div style={{ position: 'relative', width: '280px', height: '280px' }}>
        {/* Indicator Arrow */}
        <div style={{ 
            position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', 
            width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid var(--primary-color)',
            zIndex: 10, filter: 'drop-shadow(0 0 10px var(--primary-color))'
        }} />

        <div style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '50%', 
          border: '8px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)',
          transform: `rotate(-${rotation}px)` // Wait, rotation should be in degrees
        }}>
           {/* Wait, the rotation state should be in degrees. Fixed below in CSS transform */}
        </div>

        {/* Real Wheel with SVG for sectors */}
        <svg viewBox="0 0 200 200" style={{
            width: '100%', height: '100%',
            transition: 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)',
            transform: `rotate(${-rotation}deg)` 
        }}>
            {SEGMENTS.map((m, i) => {
                const angle = i * SEGMENT_ANGLE;
                const radians = (angle - 90) * Math.PI / 180;
                const nextRadians = (angle + SEGMENT_ANGLE - 90) * Math.PI / 180;
                const x1 = 100 + 100 * Math.cos(radians);
                const y1 = 100 + 100 * Math.sin(radians);
                const x2 = 100 + 100 * Math.cos(nextRadians);
                const y2 = 100 + 100 * Math.sin(nextRadians);

                return (
                    <g key={i}>
                        <path 
                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`} 
                            fill={i % 2 === 0 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)'}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="0.5"
                        />
                        <text 
                            x={100 + 75 * Math.cos(radians + (SEGMENT_ANGLE * Math.PI / 360))}
                            y={100 + 75 * Math.sin(radians + (SEGMENT_ANGLE * Math.PI / 360))}
                            fill="#fff"
                            fontSize="8"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${angle + SEGMENT_ANGLE/2}, ${100 + 75 * Math.cos(radians + (SEGMENT_ANGLE * Math.PI / 360))}, ${100 + 75 * Math.sin(radians + (SEGMENT_ANGLE * Math.PI / 360))})`}
                        >
                            {m}x
                        </text>
                    </g>
                );
            })}
            <circle cx="100" cy="100" r="10" fill="var(--primary-color)" />
        </svg>
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
 height: '24px', textAlign: 'center', fontSize: '18px', fontWeight: '900', color: message.includes('WIN') ? 'var(--success-color)' : '#fff' 
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
        onPlay={handleSpin} 
        loading={loading || spinning}
      />
    </div>
  );
};

export default WheelOfFortune;
