import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'ads'>('users');
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [rewardedAdProvider, setRewardedAdProvider] = useState<'adsgram' | 'google'>('adsgram');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/admin/users`);
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const res = await fetch(`${API_URL}/settings/ads`);
        const data = await res.json();
        if (data.settings) {
          setAdsEnabled(data.settings.ads_enabled === 'true');
          setAdsClientId(data.settings.ads_client_id || '');
          setAdsSlotId(data.settings.ads_slot_id || '');
          setAdsgramBlockId(data.settings.adsgram_block_id || '');
          setRewardedAdProvider(data.settings.rewarded_ad_provider || 'adsgram');
        }
      }
    } catch (err) { console.error(err); }
  };

  const updateBalance = async (telegramId: string, amount: string, action: 'add' | 'remove') => {
    if (!amount) return;
    const res = await fetch(`${API_URL}/admin/user/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, amount, action })
    });
    if (res.ok) fetchData();
  };

  const saveAds = async () => {
    const res = await fetch(`${API_URL}/admin/settings/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ads_enabled: adsEnabled, ads_client_id: adsClientId, ads_slot_id: adsSlotId, adsgram_block_id: adsgramBlockId, rewarded_ad_provider: rewardedAdProvider })
    });
    if (res.ok) { setSaveMessage('Saved!'); setTimeout(() => setSaveMessage(''), 3000); }
  };

  if (!isAuthenticated) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', gap: '16px' }}>
      <h2>Admin Panel</h2>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passcode..." className="input-field" style={{ width: '200px' }} />
      <button className="btn-primary" onClick={() => { if (password.trim() === 'admin777') setIsAuthenticated(true); else alert('Access Denied'); }}>Enter</button>
    </div>
  );

  return (
    <div className="page">
      <h1>Admin</h1>
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <button className={`btn-primary ${activeTab === 'users' ? '' : 'inactive'}`} onClick={() => setActiveTab('users')}>Users</button>
        <button className={`btn-primary ${activeTab === 'ads' ? '' : 'inactive'}`} onClick={() => setActiveTab('ads')}>Ads</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'users' ? (
          <div>
            {users.map(u => (
              <div key={u.telegram_id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{u.first_name} (@{u.username})</strong>
                  <span style={{ color: 'var(--gold-color)' }}>{u.balance} coins</span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <input type="number" id={`amt-${u.telegram_id}`} placeholder="Amt" className="input-field" style={{ width: '80px' }} />
                  <button className="btn-primary" style={{ padding: '5px 10px' }} onClick={() => updateBalance(u.telegram_id, (document.getElementById(`amt-${u.telegram_id}`) as any).value, 'add')}>+</button>
                  <button className="btn-primary" style={{ padding: '5px 10px', background: '#f44336' }} onClick={() => updateBalance(u.telegram_id, (document.getElementById(`amt-${u.telegram_id}`) as any).value, 'remove')}>-</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', margin: '10px 0' }}><input type="checkbox" checked={adsEnabled} onChange={e => setAdsEnabled(e.target.checked)} /> Enable Ads</label>
            <input type="text" value={adsClientId} onChange={e => setAdsClientId(e.target.value)} placeholder="Client ID" className="input-field" />
            <input type="text" value={adsSlotId} onChange={e => setAdsSlotId(e.target.value)} placeholder="Slot ID" className="input-field" />
            <div style={{ marginTop: '15px' }}>
              <button className="btn-primary" onClick={saveAds}>Save</button>
              {saveMessage && <p style={{ color: '#4caf50' }}>{saveMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
