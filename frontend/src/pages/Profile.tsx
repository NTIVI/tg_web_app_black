import { Phone, Mail, IdCard } from 'lucide-react';
import { API_URL } from '../config';

const Profile = ({ userId, tgUser }: any) => {
  const getAvatarColor = (id: string) => {
    const colors = ['#9d50bb', '#6e48aa', '#ff00cc', '#3333ff', '#00f2fe', '#ffd700'];
    const idx = parseInt(id) % colors.length || 0;
    return colors[idx];
  };

  const fullName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'User Name';

  const avatarUrl = tgUser?.photo_url || `${API_URL}/avatar/${userId}`;

  return (
    <div className="page">
      <h1>Your Profile</h1>
      <p>Management and stats.</p>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', textAlign: 'center' }}>
        <div 
          style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            marginBottom: '16px',
            backgroundColor: getAvatarColor(userId),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            fontWeight: 'bold',
            color: 'white',
            overflow: 'hidden',
            border: '4px solid var(--surface-color-light)',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}
        >
          <img 
            src={avatarUrl} 
            alt="Profile" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />

        </div>
        
        <h2 style={{ marginBottom: '4px' }}>{fullName}</h2>
        <p style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>@{tgUser?.username || 'no_username'}</p>
        
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>ID: {userId}</span>
          <span style={{ backgroundColor: 'rgba(157, 80, 187, 0.1)', padding: '4px 12px', borderRadius: '20px', color: 'var(--gold-color)' }}>Level 1</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <IdCard size={24} color="var(--primary-color)" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Account Status</div>
            <div style={{ fontWeight: '600' }}>Active Member</div>
          </div>
        </div>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Phone size={24} color="var(--primary-color)" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</div>
            <div style={{ fontWeight: '600' }}>{tgUser?.phone || 'Not linked'}</div>
          </div>
        </div>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Mail size={24} color="var(--primary-color)" />
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</div>
            <div style={{ fontWeight: '600' }}>{tgUser?.email || 'Not linked'}</div>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>
        Settings
      </button>
    </div>
  );
};

export default Profile;
