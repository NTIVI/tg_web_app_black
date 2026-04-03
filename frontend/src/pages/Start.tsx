import { useState, useEffect, useCallback } from 'react';
import { Coins, PlayCircle } from 'lucide-react';
import { API_URL } from '../config';
import { useAdsgram } from '../hooks/useAdsgram';

interface StartProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
}

const Start = ({ userId, balance, setBalance }: StartProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [adsClientId, setAdsClientId] = useState('');
  const [rewardedAdProvider, setRewardedAdProvider] = useState('adsgram');
  const [showDemoAd, setShowDemoAd] = useState(false);
  const [demoAdTime, setDemoAdTime] = useState(3);
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    const lastWatch = localStorage.getItem('last_ad_watch');
    if (lastWatch) {
      const diff = 120 - Math.floor((Date.now() - parseInt(lastWatch)) / 1000);
      if (diff > 0) setCooldownTime(diff);
    }
  }, []);

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  useEffect(() => {
    fetch(`${API_URL}/settings/ads`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setAdsgramBlockId(data.settings.adsgram_block_id || '');
          setAdsClientId(data.settings.ads_client_id || '');
          setRewardedAdProvider(data.settings.rewarded_ad_provider || 'adsgram');
        }
      })
      .catch(err => console.error("Could not load ads config", err));
  }, []);

  const claimReward = useCallback(async () => {
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
    } finally {
      setIsWatching(false);
    }
  }, [userId, setBalance]);

  const showAdsgram = useAdsgram({
    blockId: adsgramBlockId,
    onReward: () => {
        setAdMessage('Ad finished! Claiming reward...');
        claimReward();
    },
    onError: (result) => {
        console.error('Adsgram error:', result);
        setAdMessage('Ad skipped or unavailable.');
        setIsWatching(false);
    }
  });

  const handleWatchAd = async () => {
    if (!userId) return;
    
    setIsWatching(true);
    setAdMessage('Loading Advertisement...');
    
    if (rewardedAdProvider === 'adsgram' && adsgramBlockId) {
      showAdsgram();
    } else if (rewardedAdProvider === 'google' && adsClientId) {
      try {
        // Google AdSense H5 adBreak
        const adBreak = (window as any).adBreak;
        if (adBreak) {
          adBreak({
            type: 'reward',
            name: 'get_coins',
            beforeAd: () => setAdMessage('Ad starting...'),
            afterAd: () => setAdMessage('Ad finished!'),
            beforeReward: (showAdFn: any) => {
              showAdFn();
            },
            adDismissed: () => {
              setAdMessage('Ad skipped.');
              setIsWatching(false);
            },
            adViewed: () => {
              setAdMessage('Ad viewed! Claiming reward...');
              claimReward();
            },
            adBreakDone: () => {
              setIsWatching(false);
            }
          });
        } else {
          throw new Error("Google AdSense H5 not ready");
        }
      } catch (err) {
        console.error("Google Ad error", err);
        setAdMessage('Google Ad unavailable.');
        setTimeout(() => setIsWatching(false), 2000);
      }
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
            <h2 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: '800' }}>Ready to earn?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Watch a short video to get 50 coins instantly.</p>
            {adMessage && (
              <div style={{ 
                background: 'rgba(0, 242, 254, 0.1)', 
                padding: '12px', 
                borderRadius: '12px', 
                marginBottom: '20px',
                color: adMessage.includes('error') || adMessage.includes('skipped') ? '#ff4b4b' : 'var(--success-color)',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid rgba(0, 242, 254, 0.2)'
              }}>
                {adMessage}
              </div>
            )}
            <button 
              className="btn-primary" 
              disabled={cooldownTime > 0}
              style={{ 
                width: '100%', 
                height: '56px',
                fontSize: '18px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: cooldownTime > 0 ? 'none' : '0 8px 20px rgba(0, 242, 254, 0.3)',
                background: cooldownTime > 0 ? 'rgba(255,255,255,0.05)' : '',
                opacity: cooldownTime > 0 ? 0.7 : 1,
                color: cooldownTime > 0 ? 'var(--text-secondary)' : ''
              }} 
              onClick={handleWatchAd}
            >
              {cooldownTime > 0 ? (
                <>
                   Available in {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                </>
              ) : (
                <>
                  <PlayCircle size={24} />
                  Watch Ad
                </>
              )}
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
