import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

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

  const formatBalance = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const PodiumItem = ({ user, rank }: { user: any, rank: number }) => {
    const isFirst = rank === 0;
    const size = isFirst ? 80 : 65;
    const color = rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : '#CD7F32';
    const crownSize = isFirst ? 28 : 20;

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '8px',
        flex: 1,
        marginTop: isFirst ? '0' : '20px',
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        <div style={{ position: 'relative' }}>
          {/* Crown */}
          <div style={{ 
            position: 'absolute', 
            top: isFirst ? '-24px' : '-18px', 
            left: '50%', 
            transform: 'translateX(-50%) rotate(-5deg)',
            zIndex: 2,
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}>
            {isFirst ? <Crown size={crownSize} fill={color} color={color} /> : <Medal size={crownSize} fill={color} color={color} />}
          </div>
          
          {/* Avatar Container */}
          <div style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            padding: '3px',
            background: `linear-gradient(135deg, ${color}, transparent)`,
            boxShadow: `0 0 20px ${color}33`,
            position: 'relative',
            zIndex: 1
          }}>
            <img 
              src={user.photo_url || ''} 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#222' }} 
              alt="Avatar"
            />
          </div>
          
          {/* Rank Number Circle */}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: color,
            color: '#000',
            fontSize: '12px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            border: '2px solid #030303'
          }}>
            {rank + 1}
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ 
            fontWeight: '800', 
            fontSize: isFirst ? '14px' : '12px', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100px',
            margin: '0 auto'
          }}>
            {user.first_name}
          </div>
          <div style={{ 
            color: 'var(--gold-color)', 
            fontWeight: '900', 
            fontSize: isFirst ? '16px' : '14px',
            marginTop: '2px'
          }}>
            ${formatBalance(user.balance || 0)}
          </div>
          <div style={{ 
            fontSize: '9px', 
            background: 'rgba(255,255,255,0.05)', 
            padding: '2px 6px', 
            borderRadius: '10px', 
            display: 'inline-block',
            marginTop: '4px',
            fontWeight: '700',
            color: 'var(--text-secondary)'
          }}>
            LVL {user.level || 1}
          </div>
        </div>
      </div>
    );
  };

  const topThree = topUsers.slice(0, 3);
  const others = topUsers.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ user: topThree[1], rank: 1 });
  if (topThree[0]) podiumOrder.push({ user: topThree[0], rank: 0 });
  if (topThree[2]) podiumOrder.push({ user: topThree[2], rank: 2 });

  return (
    <div className="page" style={{ paddingBottom: '110px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Trophy size={28} color="var(--gold-color)" />
          <h1 style={{ margin: 0, fontSize: '32px' }}>Leaderboard</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.6 }}>The world's richest players</p>
      </div>

      {topUsers.length > 0 ? (
        <>
          {/* Podium section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '40px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)',
            padding: '30px 10px',
            borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {podiumOrder.map((item, i) => (
              <PodiumItem key={i} user={item.user} rank={item.rank} />
            ))}
          </div>

          {/* List Section */}
          <div className="glass-panel" style={{ padding: '8px 16px' }}>
            {others.length > 0 ? (
              others.map((user, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '14px 0', 
                    borderBottom: index === others.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ 
                    width: '28px', 
                    fontSize: '13px', 
                    fontWeight: '800', 
                    color: 'rgba(255,255,255,0.2)',
                    textAlign: 'center'
                  }}>
                    {index + 4}
                  </div>
                  
                  <img 
                    src={user.photo_url || ''} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px', 
                      objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }} 
                    alt="Avatar"
                  />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.first_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>@{user.username || 'user'}</span>
                       <span style={{ 
                        background: 'rgba(255,215,0,0.1)', 
                        color: 'var(--gold-color)', 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        fontSize: '9px', 
                        fontWeight: '800' 
                      }}>
                        Lvl {user.level || 1}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--gold-color)', fontWeight: '900', fontSize: '15px' }}>
                      ${formatBalance(user.balance || 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', opacity: 0.5 }}>
                    Reach the top to see more!
                </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Star size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
          <p>The leaderboard is currently empty.</p>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Top;
