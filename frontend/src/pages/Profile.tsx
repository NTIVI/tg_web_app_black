import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const Profile = ({ userId, tgUser }: any) => {
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/admin/purchases`).then(r => r.json()).then(data => {
      setPurchases(data.purchases?.filter((p: any) => p.telegram_id === userId) || []);
    });
  }, [userId]);

  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src={tgUser?.photo_url || ''} style={{ width: '80px', height: '80px', borderRadius: '40px' }} />
        <h2>{tgUser?.first_name}</h2>
        <p>@{tgUser?.username}</p>
        <p style={{ color: 'var(--gold-color)', fontSize: '20px', fontWeight: 'bold' }}>{tgUser?.balance} Coins</p>
      </div>

      <div className="glass-panel">
        <h3>My Purchases</h3>
        {purchases.map((p, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <strong>{p.item_name}</strong> - {p.price} coins
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
