import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Gift, ExternalLink, CheckCircle2, DollarSign, Target } from 'lucide-react';

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

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
     <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
  </svg>
);

const SOCIAL_CONFIG: any = {
  tiktok: { title: 'TikTok', icon: <TikTokIcon />, bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(206, 32, 41, 0.05) 100%)', border: '1px solid rgba(236, 72, 153, 0.2)', iconColor: '#ff0050', barBg: 'linear-gradient(90deg, #ff0050 0%, #00f2fe 100%)', textColor: '#00f2fe' },
  instagram: { title: 'Instagram', icon: <InstagramIcon />, bg: 'linear-gradient(135deg, rgba(225, 48, 108, 0.1) 0%, rgba(253, 29, 29, 0.05) 100%)', border: '1px solid rgba(225, 48, 108, 0.2)', iconColor: '#E1306C', barBg: 'linear-gradient(90deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', textColor: '#E1306C' },
  facebook: { title: 'Facebook', icon: <FacebookIcon />, bg: 'linear-gradient(135deg, rgba(24, 119, 242, 0.1) 0%, rgba(24, 119, 242, 0.05) 100%)', border: '1px solid rgba(24, 119, 242, 0.2)', iconColor: '#1877F2', barBg: 'linear-gradient(90deg, #1877F2 0%, #3b5998 100%)', textColor: '#1877F2' },
  telegram: { title: 'Telegram', icon: <TelegramIcon />, bg: 'linear-gradient(135deg, rgba(0, 136, 204, 0.1) 0%, rgba(0, 136, 204, 0.05) 100%)', border: '1px solid rgba(0, 136, 204, 0.2)', iconColor: '#0088cc', barBg: 'linear-gradient(90deg, #0088cc 0%, #00aaff 100%)', textColor: '#00aaff' },
  youtube: { title: 'YouTube', icon: <YoutubeIcon />, bg: 'linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 0, 0, 0.05) 100%)', border: '1px solid rgba(255, 0, 0, 0.2)', iconColor: '#FF0000', barBg: 'linear-gradient(90deg, #FF0000 0%, #CC0000 100%)', textColor: '#FF0000' }
};

const Bonuses = ({ tgUser, setBalance, dailyStatus, handleClaimDaily, claimingDaily, setTgUser }: any) => {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [userQuests, setUserQuests] = useState<any[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(true);
  const [socialStats, setSocialStats] = useState<any>(() => {
    const cached = localStorage.getItem('cached_social_stats');
    return cached ? JSON.parse(cached) : {
      tiktok: { current: 0, target: 10000 },
      instagram: { current: 0, target: 5000 },
      telegram: { current: 0, target: 3000 },
      facebook: { current: 0, target: 2000 },
      youtube: { current: 0, target: 10000 }
    };
  });

  const streak = dailyStatus?.currentStreak || 0;
  const steps = [10, 20, 50, 100, 250, 500, 1000]; // in cents

  useEffect(() => {
    const tid = tgUser?.telegram_id || tgUser?.id;
    if (tid) {
      fetch(`${API_URL}/bonuses/${tid}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      })
        .then(res => res.json())
        .then(data => setClaimedIds(data.claimed || []))
        .catch(err => console.error("Error fetching claimed bonuses:", err));
    }
  }, [tgUser]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/social-stats`);
        const data = await res.json();
        if (data.stats) {
          setSocialStats(data.stats);
          localStorage.setItem('cached_social_stats', JSON.stringify(data.stats));
        }
      } catch (e: any) {}
    };
    fetchStats();
    fetchStats();
    fetchQuests();
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await fetch(`${API_URL}/quests`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.quests) setUserQuests(data.quests);
    } catch (e: any) {
      console.error('Fetch quests error:', e);
    } finally {
      setLoadingQuests(false);
    }
  };

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
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
          },
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
            if (data.balance !== undefined) {
              setBalance(data.balance);
            } else {
              setBalance((prev: number) => prev + bonus.reward);
            }
            if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
          }
        }
      } catch (err) {
        console.error("Claim error:", err);
      } finally {
        setClaiming(null);
      }
    }, 2000);
  };

  const handleClaimQuest = async (questId: number) => {
    try {
      const res = await fetch(`${API_URL}/quests/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ questId })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        fetchQuests(); // Refresh quests
      }
    } catch (e: any) {
      console.error('Claim quest error:', e);
    }
  };

  const formatSubs = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const BONUS_LIST = [
    { 
      id: 'tg_channel', 
      title: 'Вступить в Telegram канал', 
      reward: 1000, 
      icon: <TelegramIcon />, 
      url: 'https://t.me/+CVRfTOr2cCdhYTU6', 
      subs: `${formatSubs(socialStats.telegram?.current || 2310)} Подписчиков` 
    },
    { 
      id: 'youtube', 
      title: 'Подписаться на YouTube', 
      reward: 1000, 
      icon: <YoutubeIcon />, 
      url: 'https://www.youtube.com/@YourTurn_Arm', 
      subs: `${formatSubs(socialStats.youtube?.current || 15200)} Подписчиков`
    },
    { 
      id: 'instagram', 
      title: 'Подписаться на Instagram', 
      reward: 500, 
      icon: <InstagramIcon />, 
      url: 'https://www.instagram.com/yourturn_arm/', 
      subs: `${formatSubs(socialStats.instagram?.current || 5400)} Подписчиков`
    },
    { 
      id: 'facebook', 
      title: 'Подписаться на Facebook', 
      reward: 300, 
      icon: <FacebookIcon />, 
      url: 'https://www.facebook.com/yourturn.arm/', 
      subs: `${formatSubs(socialStats.facebook?.current || 1200)} Подписчиков`
    },
    { 
      id: 'tiktok', 
      title: 'Подписаться на TikTok', 
      reward: 500, 
      icon: <TikTokIcon />, 
      url: 'https://www.tiktok.com/@just___000', 
      subs: `${formatSubs(socialStats.tiktok?.current || 8450)} Подписчиков` 
    },
  ];

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

      {/* Community Goal Section */}
      <h3 style={{ marginBottom: '16px', opacity: 0.8 }}>Наши цели</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
      {[ 'tiktok', 'instagram', 'telegram', 'facebook', 'youtube' ].map((key, i) => {
        const stat = socialStats[key] || { current: 0, target: 100 };
        const conf = SOCIAL_CONFIG[key] || SOCIAL_CONFIG.tiktok;
        const pct = stat.target > 0 ? Math.min(100, (stat.current / stat.target) * 100) : 0;
        const left = Math.max(0, stat.target - stat.current);
        
        // Make the last one span full width if it's an odd number
        const isFullWidth = i === 4;

        return (
          <div 
            key={key}
            className="glass-panel" 
            style={{ 
              padding: '16px', 
              marginBottom: '0',
              background: conf.bg,
              border: conf.border,
              gridColumn: isFullWidth ? 'span 2' : 'span 1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ 
                color: conf.iconColor, 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {conf.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conf.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Цель: {stat.target.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: '700' }}>
                <span>{stat.current.toLocaleString()}</span>
                <span style={{ opacity: 0.5 }}>{pct.toFixed(0)}%</span>
              </div>

              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: conf.barBg, borderRadius: '3px', transition: 'width 1s ease' }}></div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                Ещё <span style={{ color: conf.textColor, fontWeight: '700' }}>{left.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {/* Quests Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '32px' }}>
        <Target size={24} color="var(--primary-color)" />
        <h3 style={{ margin: 0, opacity: 0.8 }}>Ежедневные квесты</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {loadingQuests ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
        ) : userQuests.length > 0 ? userQuests.map((q: any) => {
          const isDone = q.current_progress >= q.target_value;
          const isClaimed = q.is_claimed;
          const pct = Math.min(100, (q.current_progress / q.target_value) * 100);

          return (
            <div key={q.id} className="glass-panel" style={{ padding: '16px', marginBottom: 0, border: isClaimed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800' }}>{q.title}</span>
                    {isClaimed && <CheckCircle2 size={14} color="var(--success-color)" />}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>{q.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--gold-color)', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                     <DollarSign size={14} />+${(q.reward_balance / 100).toFixed(2)}
                  </div>
                  <div style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '11px', opacity: 0.8 }}>+{q.reward_xp} XP</div>
                </div>
              </div>

              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ 
                  width: `${pct}%`, 
                  height: '100%', 
                  background: isDone ? 'var(--success-color)' : 'linear-gradient(90deg, #1e40af, #a855f7)', 
                  borderRadius: '4px',
                  boxShadow: isDone ? 'none' : '0 0 10px rgba(168, 85, 247, 0.4)'
                }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                  ПРОГРЕСС: {q.current_progress} / {q.target_value}
                </span>
                {isDone ? (
                  isClaimed ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Получено</span>
                  ) : (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleClaimQuest(q.id)}
                      style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '10px', minWidth: '80px', background: 'var(--success-color)' }}
                    >
                      Забрать
                    </button>
                  )
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '800' }}>{pct.toFixed(0)}%</span>
                )}
              </div>
            </div>
          );
        }) : (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Квестов пока нет</div>
        )}
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
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{bonus.subs}</div>
              <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '14px', marginTop: '4px' }}>
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
                  <CheckCircle2 size={16} /> Готово
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> Начать
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
