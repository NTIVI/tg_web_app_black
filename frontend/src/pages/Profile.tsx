import { useState, useEffect } from 'react';
import { User, Phone, Mail } from 'lucide-react';
import { API_URL } from '../config';

interface ProfileProps {
  userId: string | null;
  balance: number;
}

const Profile = ({ userId, balance }: ProfileProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      // Fetch user data
      fetch('https://tg-web-app-black.onrender.com/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initDataUnsafe: { user: { id: userId, username: 'Current' } } })
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserData(data.user);
          setPhone(data.user.phone || '');
          setEmail(data.user.email || '');
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
    }
  }, [userId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId, phone, email }),
      });
      const data = await res.json();
      if (data.success) {
        setUserData(data.user);
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  if (isLoading) return <div className="page"><div className="loader-container"><div className="spinner"></div></div></div>;

  return (
    <div className="page">
      <h1>Your Profile</h1>
      <p>Manage your account settings and view info.</p>

      <div className="glass-panel" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--surface-color-light)', borderRadius: '50%' }}>
          <User size={32} color="var(--primary-color)" />
        </div>
        <div>
          <h2>@{userData?.username || 'Unknown'}</h2>
          <p style={{ color: 'var(--gold-color)', fontWeight: 'bold' }}>Balance: {balance} Coins</p>
        </div>
      </div>

      <h2 style={{ marginTop: '32px' }}>Registration Details</h2>
      <form onSubmit={handleRegister} className="glass-panel" style={{ marginTop: '16px' }}>
        {message && <p style={{ color: 'var(--success-color)', marginBottom: '16px' }}>{message}</p>}
        
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Phone size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="tel" 
            className="input-field" 
            style={{ paddingLeft: '48px' }} 
            placeholder="Phone Number (+1 234 ...)" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <Mail size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="email" 
            className="input-field" 
            style={{ paddingLeft: '48px' }} 
            placeholder="Gmail Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default Profile;
