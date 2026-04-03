import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { Gift, ExternalLink, CheckCircle2, Clock, Video, PlayCircle, Coins } from 'lucide-react';
import { useAdsgram } from '../hooks/useAdsgram';

const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.003 9.464c-.15.672-.546.837-1.112.518l-3.057-2.254-1.475 1.417c-.163.163-.3.299-.614.299l.22-3.103 5.646-5.105c.246-.219-.054-.341-.381-.123l-6.98 4.394-3.003-1.041c-.653-.204-.664-.653.136-.966l11.728-4.514c.542-.196 1.017.13 1.017.914z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.3a2.98 2.98 0 0 0-1.43 2.05c-.13.84.15 1.73.72 2.38.56.67 1.4 1.11 2.26 1.15.89.06 1.83-.24 2.43-.91.68-.7 1.05-1.66 1.03-2.63l-.04-12.06Z"/>
  </svg>
);

const BONUS_LIST = [
  { id: 'tg_channel', title: 'Join Telegram Channel', reward: 1000, icon: <TelegramIcon />, url: 'https://t.me/your_channel' },
  { id: 'tiktok', title: 'Follow on TikTok', reward: 500, icon: <TikTokIcon />, url: 'https://www.tiktok.com/@your_account' },
  { id: 'twitter', title: 'Follow on X (Twitter)', reward: 750, icon: <TwitterIcon />, url: 'https://twitter.com/your_account' },
  { id: 'instagram', title: 'Follow on Instagram', reward: 750, icon: <InstagramIcon />, url: 'https://instagram.com/your_account' },
  { id: 'youtube', title: 'Subscribe to YouTube', reward: 1000, icon: <YoutubeIcon />, url: 'https://youtube.com/@your_channel' },
];

const DailyBonus = ({ userId, onClaim }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/bonus/daily/${userId}`);
      setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { 
    fetchStatus(); 
  }, [fetchStatus]);

  useEffect(() => {
    if (data?.timeLeft > 0) {
      let remaining = data.timeLeft;
      const interval = setInterval(() => {
        remaining -= 1000;
        if (remaining <= 0) {
          clearInterval(interval);
          setData((prev: any) => ({ ...prev, canClaim: true, timeLeft: 0 }));
        } else {
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data]);

  const handleClaim = async () => {
    if (!data?.canClaim || loading) return;
    setLoading(true);
    setData((prev: any) => ({ ...prev, canClaim: false }));
    
    try {
      const res = await fetch(`${API_URL}/bonus/daily/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId })
      });
      const resData = await res.json();
      if (resData.success) {
        onClaim(resData.reward);
        setData({ 
          canClaim: resData.canClaim, 
          timeLeft: resData.timeLeft 
        });
      } else {
        fetchStatus();
      }
    } catch (e) { 
      console.error(e);
      fetchStatus();
    }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '24px', 
      background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(79, 172, 254, 0.1) 100%)',
      border: '1px solid rgba(0, 242, 254, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Бонус 2 раза в день</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>Заходи в 12:00 и 00:00 (UTC) и забирай монеты!</p>
        </div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gold-color)' }}>+250</div>
      </div>
      <button 
        className="btn-primary" 
        disabled={!data?.canClaim || loading} 
        onClick={handleClaim}
        style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div> : 
         data?.canClaim ? 'Забрать бонус' : (
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Clock size={16} /> Доступно через {countdown}
           </div>
         )}
      </button>
    </div>
  );
};

const Bonuses = ({ user, setBalance }: any) => {
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    const lastWatch = localStorage.getItem('last_ad_watch');
    if (lastWatch) {
      const diff = 120 - Math.floor((Date.now() - parseInt(lastWatch)) / 1000);
      if (diff > 0) setCooldownTime(diff);
    }
    
    const handleStorage = () => {
      const lastWatch = localStorage.getItem('last_ad_watch');
      if (lastWatch) {
        const diff = 120 - Math.floor((Date.now() - parseInt(lastWatch)) / 1000);
        if (diff > 0) setCooldownTime(diff);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
    if (user?.telegram_id) {
      fetch(`${API_URL}/bonuses/${user.telegram_id}`)
        .then(res => res.json())
        .then(data => setClaimedIds(data.claimed || []))
        .catch(err => console.error("Error fetching claimed bonuses:", err));
    }
  }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/settings/ads`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) setAdsgramBlockId(data.settings.adsgram_block_id || '');
      })
      .catch(err => console.error("Could not load ads config", err));
  }, []);

  const { showAd, isReady, isLoading: adLoading } = useAdsgram({
    blockId: adsgramBlockId,
    onReward: () => {
        const reward = 50;
        localStorage.setItem('last_ad_watch', Date.now().toString());
        setCooldownTime(120);
        fetch(`${API_URL}/watch-ad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: user?.telegram_id }),
        }).then(res => res.json()).then(data => {
            if (data.success) {
                setBalance((prev: number) => prev + reward);
            }
        });
    },
    onError: (err) => {
        console.error('Adsgram error:', err);
        // Reset loading state if error occurs
    }
  });

  const handleClaim = async (bonus: any) => {
    if (!user || claimedIds.includes(bonus.id)) return;
    window.open(bonus.url, '_blank');
    setClaiming(bonus.id);
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/bonus/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            telegramId: user.telegram_id, 
            bonusId: bonus.id, 
            reward: bonus.reward 
          })
        });
        if (res.ok) {
          setClaimedIds([...claimedIds, bonus.id]);
          setBalance((prev: number) => prev + bonus.reward);
        }
      } catch (err) {
        console.error("Claim error:", err);
      } finally {
        setClaiming(null);
      }
    }, 2000);
  };

  const handleDailyClaim = (reward: number) => {
    setBalance((prev: number) => prev + reward);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Gift size={32} color="var(--primary-color)" />
        <h1>Бонусы</h1>
      </div>
      
      <DailyBonus userId={user?.telegram_id} onClaim={handleDailyClaim} />

      <h3 style={{ marginBottom: '16px', opacity: 0.8 }}>Реклама и задания</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Ad Booster Task */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(157, 80, 187, 0.15) 0%, rgba(110, 72, 170, 0.1) 100%)',
            border: '1px solid rgba(157, 80, 187, 0.4)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '18px', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 12px rgba(157, 80, 187, 0.3)'
          }}>
            <Video size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.2px' }}>Удачное Видео</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Coins size={14} color="var(--gold-color)" />
              <span style={{ color: 'var(--gold-color)', fontWeight: '700', fontSize: '14px' }}>+50 монет</span>
            </div>
          </div>
          <button 
            className="btn-primary"
            disabled={cooldownTime > 0 || !isReady || adLoading}
            style={{ 
              padding: '10px 20px', 
              fontSize: '14px', 
              borderRadius: '14px',
              minWidth: '110px',
              height: '44px',
              background: (cooldownTime > 0 || !isReady || adLoading) ? 'rgba(255,255,255,0.05)' : '',
              color: (cooldownTime > 0 || !isReady || adLoading) ? 'var(--text-secondary)' : '',
              border: (cooldownTime > 0 || !isReady || adLoading) ? '1px solid rgba(255,255,255,0.1)' : 'none',
              boxShadow: (cooldownTime > 0 || !isReady || adLoading) ? 'none' : '0 6px 12px rgba(157, 80, 187, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => showAd()}
          >
            {adLoading ? (
                <div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }}></div>
            ) : cooldownTime > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} /> 
                  <span>{formatTime(cooldownTime)}</span>
                </div>
            ) : !isReady ? (
                <span>Загрузка...</span>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlayCircle size={18} /> 
                  <span>Смотреть</span>
                </div>
            )}
          </button>
        </div>

        {BONUS_LIST.map((bonus) => (
          <div 
            key={bonus.id} 
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              border: claimedIds.includes(bonus.id) ? '1px solid rgba(0, 242, 254, 0.2)' : '1px solid var(--border-color)',
              opacity: claimedIds.includes(bonus.id) ? 0.7 : 1
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: 'rgba(255,255,255,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: claimedIds.includes(bonus.id) ? 'var(--success-color)' : 'var(--primary-color)'
            }}>
              {bonus.icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{bonus.title}</div>
              <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '14px' }}>
                +{bonus.reward.toLocaleString()} coins
              </div>
            </div>

            <button 
              className={`btn-primary ${claimedIds.includes(bonus.id) ? 'success' : ''}`}
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                borderRadius: '12px',
                background: claimedIds.includes(bonus.id) ? 'rgba(0, 242, 254, 0.1)' : '',
                color: claimedIds.includes(bonus.id) ? 'var(--success-color)' : '',
                border: claimedIds.includes(bonus.id) ? '1px solid rgba(0, 242, 254, 0.3)' : 'none',
                minWidth: '90px'
              }}
              disabled={claimedIds.includes(bonus.id) || claiming === bonus.id}
              onClick={() => handleClaim(bonus)}
            >
              {claiming === bonus.id ? (
                <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></div>
              ) : claimedIds.includes(bonus.id) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={16} /> Done
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> Start
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bonuses;
