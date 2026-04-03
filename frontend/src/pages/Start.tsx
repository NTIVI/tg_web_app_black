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

  const { showAd: showAdsgram } = useAdsgram({
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
      setAdMessage('Ad provider not configured.');
      setTimeout(() => setIsWatching(false), 2000);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Welcome YourTurn</h1>
      
      <div className="balance-card">
        <div>
          <h2 style={{ fontSize: '18px', opacity: 0.9 }}>Your Balance</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Total coins earned</p>
        </div>
        <div className="balance-amount">
          <Coins size={28} />
          <span>{balance.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="glass-panel" style={{ 
        textAlign: 'center', 
        padding: '32px 24px',
        background: 'linear-gradient(180deg, rgba(157, 80, 187, 0.1) 0%, rgba(110, 72, 170, 0.05) 100%)',
        border: '1px solid rgba(157, 80, 187, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'var(--primary-glow)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {isWatching ? (
            <div className="loader-container">
              <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{adMessage || 'Preparing your reward...'}</h3>
            </div>
          ) : (
            <div>
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '24px', 
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 8px 16px rgba(157, 80, 187, 0.4)'
              }}>
                <PlayCircle size={36} color="white" />
              </div>
              
              <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: '800' }}>Watch ADS</h2>

              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Watch a quick spotlight video to claim <span style={{ color: 'var(--gold-color)', fontWeight: '700' }}>50 coins</span> instantly.
              </p>

              {adMessage && (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '12px', 
                  borderRadius: '16px', 
                  marginBottom: '20px',
                  color: adMessage.includes('error') || adMessage.includes('skipped') || adMessage.includes('unavailable') ? '#ff4b4b' : 'var(--success-color)',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
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
                  fontSize: '17px',
                  fontWeight: '700',
                  borderRadius: '18px',
                  boxShadow: cooldownTime > 0 ? 'none' : '0 10px 25px rgba(157, 80, 187, 0.3)'
                }} 
                onClick={handleWatchAd}
              >
                {cooldownTime > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Next reward in {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                  </div>
                ) : (
                  <>Claim My Reward</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Help section to make app feel more substantial */}
      <div style={{ padding: '0 10px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>How it works?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Watch ads every 2 minutes to grow your balance.</div>
           </div>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Use coins in the Shop to buy premium access.</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Start;
