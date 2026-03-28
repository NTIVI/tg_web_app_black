import { useState, useEffect } from 'react';
import { Coins, PlayCircle } from 'lucide-react';
import { API_URL } from '../config';

interface StartProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
}

const Start = ({ userId, balance, setBalance }: StartProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [showDemoAd, setShowDemoAd] = useState(false);
  const [demoAdTime, setDemoAdTime] = useState(3);

  useEffect(() => {
    fetch(`${API_URL}/settings/ads`)
      .then(res => res.json())
      .then(data => {
        if (data.settings && data.settings.adsgram_block_id) {
          setAdsgramBlockId(data.settings.adsgram_block_id);
        }
      })
      .catch(err => console.error("Could not load ads config", err));
  }, []);

  const claimReward = async () => {
    try {
      const res = await fetch(`${API_URL}/watch-ad`, {
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
  };

  const handleWatchAd = async () => {
    if (!userId) return;
    
    setIsWatching(true);
    setAdMessage('Loading Advertisement...');
    
    if (adsgramBlockId) {
      try {
        const AdController = (window as any).Adsgram?.init({ blockId: adsgramBlockId });
        if (!AdController) throw new Error("Adsgram not loaded");
        
        await AdController.show();
        // user watched ad to the end
        setAdMessage('Ad finished! Claiming reward...');
        await claimReward();
      } catch (err) {
        console.error("Adsgram error", err);
        setAdMessage('Ad skipped or unavailable.');
      }
      
      setTimeout(() => {
        setIsWatching(false);
        setAdMessage('');
      }, 2000);
      
    } else {
      // Visual simulation of an ad when no AdsGram is configured
      setShowDemoAd(true);
      setDemoAdTime(3);
      
      const timer = setInterval(() => {
        setDemoAdTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowDemoAd(false);
            setAdMessage('Ad finished! Claiming reward...');
            claimReward().then(() => {
              setTimeout(() => {
                setIsWatching(false);
                setAdMessage('');
              }, 2000);
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
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

      {showDemoAd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: 'white', marginBottom: '16px', letterSpacing: '2px' }}>TEST ADVERTISEMENT</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center', padding: '0 20px', maxWidth: '400px', lineHeight: '1.6' }}>
            Real video ads will appear here once you enter your <strong style={{color: 'var(--primary-color)'}}>AdsGram Block ID</strong> in the Admin Panel.<br/><br/>
            (You provided Google AdSense IDs, which are used for the bottom banner, not for video rewards!)
          </p>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--gold-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--gold-color)', fontWeight: 'bold' }}>
            {demoAdTime}
          </div>
        </div>
      )}
    </div>
  );
};

export default Start;
