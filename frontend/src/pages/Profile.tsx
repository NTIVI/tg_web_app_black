import { useState, useEffect } from 'react';
import { Phone, Mail, IdCard } from 'lucide-react';
import { API_URL } from '../config';

const Profile = ({ userId, tgUser }: any) => {
  const getAvatarColor = (id: string) => {
    const colors = ['#9d50bb', '#6e48aa', '#ff00cc', '#3333ff', '#00f2fe', '#ffd700'];
    const idx = parseInt(id) % colors.length || 0;
    return colors[idx];
  };

  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/admin/purchases`)
      .then(res => res.json())
      .then(data => {
        const userPurchases = data.purchases?.filter((p: any) => p.telegram_id === userId) || [];
        setPurchases(userPurchases);
      })
      .catch(err => console.error("Failed to fetch user purchases", err));
  }, [userId]);

  const fullName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'User Name';
  const avatarUrl = tgUser?.photo_url || `${API_URL}/avatar/${userId}`;

  return (
    <div className="page">
      <h1>Your Profile</h1>
      <p>Management and stats.</p>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px', backgroundColor: getAvatarColor(userId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: 'white', overflow: 'hidden', border: '4px solid var(--surface-color-light)', boxShadow: '0 0 20px var(--primary-glow)' }}>
          <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
        <h2 style={{ marginBottom: '4px' }}>{fullName}</h2>
        <p style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>@{tgUser?.username || 'no_username'}</p>
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>ID: {userId}</span>
          <span style={{ backgroundColor: 'rgba(157, 80, 187, 0.1)', padding: '4px 12px', borderRadius: '20px', color: 'var(--gold-color)' }}>Level 1</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <IdCard size={24} color="var(--primary-color)" />
          <div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Account Status</div><div style={{ fontWeight: '600' }}>Active Member</div></div>
        </div>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Phone size={24} color="var(--primary-color)" />
          <div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</div><div style={{ fontWeight: '600' }}>{tgUser?.phone || 'Not linked'}</div></div>
        </div>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Mail size={24} color="var(--primary-color)" />
          <div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</div><div style={{ fontWeight: '600' }}>{tgUser?.email || 'Not linked'}</div></div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>My Purchases</h3>
        {purchases.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>You haven't bought anything yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {purchases.map((p: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div><div style={{ fontWeight: '600', color: 'white' }}>{p.item_name}</div><div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(p.purchased_at).toLocaleDateString()}</div></div>
                <div style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', background: p.status === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)', color: p.status === 'approved' ? '#4caf50' : '#ffc107', border: `1px solid ${p.status === 'approved' ? '#4caf50' : '#ffc107'}` }}>{p.status === 'approved' ? 'APPROVED' : 'PENDING'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>Settings</button>
    </div>
  );
};

export default Profile;
