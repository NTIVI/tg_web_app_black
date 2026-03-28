import { useState } from 'react';
import { Coins, PlayCircle } from 'lucide-react';

interface StartProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
}

const Start = ({ userId, balance, setBalance }: StartProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [adMessage, setAdMessage] = useState('');

  const handleWatchAd = async () => {
    if (!userId) return;
    
    setIsWatching(true);
    setAdMessage('Watching Advertisement...');
    
    // Simulate watching an ad for 3 seconds
    setTimeout(async () => {
      setAdMessage('Ad finished! Claiming reward...');
      
      try {
        const res = await fetch('https://tg-web-app-black.onrender.com/api/watch-ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: userId }),
        });
        
        const data = await res.json();
        if (data.success) {
          setBalance(data.newBalance);
          setAdMessage('Reward claimed! +50 Coins');
        } else {
          setAdMessage('Failed to claim reward.');
        }
      } catch (err) {
        setAdMessage('Network error.');
      }
      
      setTimeout(() => {
        setIsWatching(false);
        setAdMessage('');
      }, 2000);
      
    }, 3000);
  };

  return (
    <div className="page">
      <h1>Start Playing</h1>
      <p>Watch ads to earn game coins and buy premium items.</p>
      
      <div className="balance-card" style={{ marginTop: '32px' }}>
        <div>
          <h2>Your Balance</h2>
          <p>Available coins to spend</p>
        </div>
        <div className="balance-amount">
          <Coins size={32} />
          <span>{balance}</span>
        </div>
      </div>
      
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
        {isWatching ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <h3>{adMessage}</h3>
          </div>
        ) : (
          <div>
            <PlayCircle size={64} color="var(--primary-color)" style={{ marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '24px' }}>Ready to earn?</h2>
            {adMessage && <p style={{ color: 'var(--success-color)', marginBottom: '16px' }}>{adMessage}</p>}
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '16px' }} 
              onClick={handleWatchAd}
            >
              Watch Ad
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Start;
