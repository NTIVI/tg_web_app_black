import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Trophy, Medal, Crown } from 'lucide-react';

const Top = () => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/top`)
      .then(res => res.json())
      .then(data => {
        setTopUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching top users:", err);
        setLoading(false);
      });
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Crown size={24} color="#FFD700" />;
      case 1: return <Medal size={24} color="#C0C0C0" />;
      case 2: return <Medal size={24} color="#CD7F32" />;
      default: return <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)' }}>{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Trophy size={32} color="var(--primary-color)" />
        <h1>Leaderboard</h1>
      </div>
      <p>The richest players in the game.</p>

      <div className="glass-panel" style={{ padding: '0 20px' }}>
        {topUsers.length > 0 ? (
          topUsers.map((user, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '20px 0', 
                borderBottom: index === topUsers.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                {getRankBadge(index)}
              </div>
              
              <img 
                src={user.photo_url || ''} 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  border: index < 3 ? `2px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}` : '1px solid rgba(255,255,255,0.1)',
                  objectFit: 'cover'
                }} 
                alt="Avatar"
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>
                  {user.first_name} {index === 0 && '👑'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  @{user.username || 'user'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '16px' }}>
                  {user.balance.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Coins
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>No players found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Top;
