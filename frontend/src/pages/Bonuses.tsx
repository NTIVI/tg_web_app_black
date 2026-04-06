import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Gift, ExternalLink, CheckCircle2, DollarSign } from 'lucide-react';

const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.891 8.146l-2.003 9.464c-.15.672-.546.837-1.112.518l-3.057-2.254-1.475 1.417c-.163.163-.3.299-.614.299l.22-3.103 5.646-5.105c.246-.219-.054-.341-.381-.123l-6.98 4.394-3.003-1.041c-.653-.204-.664-.653.136-.966l11.728-4.514c.542-.196 1.017.13 1.017.914z"/>
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
  { id: 'tg_channel', title: 'Join Telegram Channel', reward: 1000, icon: <TelegramIcon />, url: 'https://t.me/+CVRfTOr2cCdhYTU6' },
  { id: 'tiktok', title: 'Follow on TikTok', reward: 500, icon: <TikTokIcon />, url: 'https://www.tiktok.com/@just___000' },
  { id: 'youtube', title: 'Subscribe to YouTube', reward: 1000, icon: <YoutubeIcon />, url: 'https://www.youtube.com/@Devki_keksi' },
];

const Bonuses = ({ tgUser, setBalance, dailyStatus, handleClaimDaily, claimingDaily }: any) => {
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const streak = dailyStatus?.currentStreak || 0;
  const steps = [10, 20, 50, 100, 150, 200, 500];

  useEffect(() => {
    const tid = tgUser?.telegram_id || tgUser?.id;
    if (tid) {
      fetch(`${API_URL}/bonuses/${tid}`)
        .then(res => res.json())
        .then(data => setClaimedIds(data.claimed || []))
        .catch(err => console.error("Error fetching claimed bonuses:", err));
    }
  }, [tgUser]);

  const handleClaim = async (bonus: any) => {
    const tid = tgUser?.telegram_id || tgUser?.id;
    if (!tid || claimedIds.includes(bonus.id)) return;
    
    const tg = (window as any).Telegram?.WebApp;
    
    // Better link opening logic
    if (tg) {
        if (bonus.url.includes('t.me/')) {
            tg.openTelegramLink(bonus.url);
        } else {
            tg.openLink(bonus.url);
        }
    } else {
        window.open(bonus.url, '_blank');
    }

    setClaiming(bonus.id);
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/bonus/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            telegramId: tid, 
            bonusId: bonus.id, 
            reward: bonus.reward 
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setClaimedIds(prev => [...prev, bonus.id]);
            setBalance((prev: number) => prev + bonus.reward);
          }
        }
      } catch (err) {
        console.error("Claim error:", err);
      } finally {
        setClaiming(null);
      }
    }, 2000);
  };

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Gift size={32} color="var(--primary-color)" />
        <h1>Бонусы</h1>
      </div>
      
      {/* Daily Bonus Section */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>Ежедневный вход</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Заходите каждый день и получайте баланс!</p>
          </div>
          {dailyStatus?.canClaim && (
            <button 
              className="btn-primary" 
              onClick={handleClaimDaily}
              disabled={claimingDaily}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px', minWidth: '90px' }}
            >
              {claimingDaily ? <div className="spinner" style={{ width: '16px', height: '16px' }}></div> : 'Забрать'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '20px' }}>
          {steps.map((reward, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                background: i < streak ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: i === streak && dailyStatus?.canClaim ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)'
              }}>
                <DollarSign size={14} color={i < streak ? 'white' : 'var(--gold-color)'} />
                <div style={{ 
                  fontSize: '9px', 
                  fontWeight: '800', 
                  color: 'white',
                  position: 'absolute',
                  top: '22px'
                }}>
                  +${(reward / 100).toFixed(2)}
                </div>
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                color: i < streak ? 'var(--primary-color)' : 'rgba(255,255,255,0.4)' 
              }}>
                Дн {i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Slider with Checkpoints */}
        <div style={{ position: 'relative', width: '100%', padding: '0 4px' }}>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '3px', 
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${(streak / 7) * 100}%`,
              background: 'linear-gradient(90deg, #1e40af, #a855f7)',
              borderRadius: '3px',
              transition: 'width 0.5s ease-out',
              zIndex: 1
            }} />

            <div style={{ 
              position: 'absolute',
              top: '50%',
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              transform: 'translateY(-50%)',
              zIndex: 2
            }}>
              {steps.map((_, i) => (
                <div key={i} style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%',
                  background: i < streak ? 'var(--primary-color)' : 'rgba(30, 20, 45, 1)',
                  border: i < streak ? '2px solid white' : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: i < streak ? '0 0 10px var(--primary-color)' : 'none',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>


      <h3 style={{ marginBottom: '16px', opacity: 0.8 }}>Задания</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {BONUS_LIST.map((bonus) => (
          <div 
            key={bonus.id} 
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              border: claimedIds.includes(bonus.id) ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid var(--border-color)',
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
                +${(bonus.reward / 100).toFixed(2)}
              </div>
            </div>

            <button 
              className={`btn-primary ${claimedIds.includes(bonus.id) ? 'success' : ''}`}
              style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                borderRadius: '12px',
                background: claimedIds.includes(bonus.id) ? 'rgba(168, 85, 247, 0.1)' : '',
                color: claimedIds.includes(bonus.id) ? 'var(--success-color)' : '',
                border: claimedIds.includes(bonus.id) ? '1px solid rgba(168, 85, 247, 0.3)' : 'none',
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
