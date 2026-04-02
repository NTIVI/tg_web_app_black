import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Gift, ExternalLink, CheckCircle2 } from 'lucide-react';

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

const BONUS_LIST = [
  { id: 'tg_channel', title: 'Join Telegram Channel', reward: 1000, icon: <TelegramIcon />, url: 'https://t.me/your_channel' },
  { id: 'tg_group', title: 'Join Telegram Group', reward: 500, icon: <TelegramIcon />, url: 'https://t.me/your_group' },
  { id: 'twitter', title: 'Follow on X (Twitter)', reward: 750, icon: <TwitterIcon />, url: 'https://twitter.com/your_account' },
  { id: 'instagram', title: 'Follow on Instagram', reward: 750, icon: <InstagramIcon />, url: 'https://instagram.com/your_account' },
  { id: 'youtube', title: 'Subscribe to YouTube', reward: 1000, icon: <YoutubeIcon />, url: 'https://youtube.com/@your_channel' },
];

const Bonuses = ({ user }: any) => {
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user?.telegram_id) {
      fetch(`${API_URL}/bonuses/${user.telegram_id}`)
        .then(res => res.json())
        .then(data => setClaimedIds(data.claimed || []))
        .catch(err => console.error("Error fetching claimed bonuses:", err));
    }
  }, [user]);

  const handleClaim = async (bonus: any) => {
    if (!user || claimedIds.includes(bonus.id)) return;
    
    // Open link
    window.open(bonus.url, '_blank');
    
    setClaiming(bonus.id);
    
    // Simulate verification delay
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
          // Optional: Refresh local balance or notify parent
        }
      } catch (err) {
        console.error("Claim error:", err);
      } finally {
        setClaiming(null);
      }
    }, 2000);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Gift size={32} color="var(--primary-color)" />
        <h1>Bonuses</h1>
      </div>
      <p>Complete simple tasks to earn extra coins.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {BONUS_LIST.map((bonus) => (
          <div 
            key={bonus.id} 
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              marginBottom: 0, 
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
