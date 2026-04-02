import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Gift, ExternalLink, CheckCircle2, MessageSquare, Share2, Camera, Play } from 'lucide-react';

const BONUS_LIST = [
  { id: 'tg_channel', title: 'Join Telegram Channel', reward: 1000, icon: <MessageSquare size={24} />, url: 'https://t.me/your_channel' },
  { id: 'tg_group', title: 'Join Telegram Group', reward: 500, icon: <MessageSquare size={24} />, url: 'https://t.me/your_group' },
  { id: 'twitter', title: 'Follow on Twitter', reward: 750, icon: <Share2 size={24} />, url: 'https://twitter.com/your_account' },
  { id: 'instagram', title: 'Follow on Instagram', reward: 750, icon: <Camera size={24} />, url: 'https://instagram.com/your_account' },
  { id: 'youtube', title: 'Subscribe to YouTube', reward: 1000, icon: <Play size={24} />, url: 'https://youtube.com/@your_channel' },
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
