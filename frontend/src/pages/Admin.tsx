import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'purchases' | 'ads'>('purchases');
  const [isLoading, setIsLoading] = useState(true);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [rewardedAdProvider, setRewardedAdProvider] = useState<'adsgram' | 'google'>('adsgram');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      try {
        const [usersRes, purchasesRes, adsRes] = await Promise.all([
          fetch(`${API_URL}/admin/users`),
          fetch(`${API_URL}/admin/purchases`),
          fetch(`${API_URL}/settings/ads`)
        ]);
        
        const usersData = await usersRes.json();
        const purchasesData = await purchasesRes.json();
        const adsData = await adsRes.json();
        
        setUsers(usersData.users || []);
        setPurchases(purchasesData.purchases || []);
        if (adsData.settings) {
          setAdsEnabled(adsData.settings.ads_enabled === 'true');
          setAdsClientId(adsData.settings.ads_client_id || '');
          setAdsSlotId(adsData.settings.ads_slot_id || '');
          setAdsgramBlockId(adsData.settings.adsgram_block_id || '');
          setRewardedAdProvider(adsData.settings.rewarded_ad_provider || 'adsgram');
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, isAuthenticated]);

  const saveAdsSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ads_enabled: adsEnabled, ads_client_id: adsClientId, ads_slot_id: adsSlotId,
          adsgram_block_id: adsgramBlockId, rewarded_ad_provider: rewardedAdProvider
        })
      });
      if (res.ok) setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error("Failed to save ads settings", err);
    }
  };

  const updateBalance = async (telegramId: string, amount: string, action: 'add' | 'remove') => {
    if (!amount || isNaN(parseInt(amount))) return;
    try {
      const res = await fetch(`${API_URL}/admin/user/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, amount: parseInt(amount), action })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.telegram_id === telegramId ? { ...u, balance: data.newBalance } : u));
      }
    } catch (err) {
      console.error("Failed to update balance", err);
    }
  };

  const updatePurchaseStatus = async (purchaseId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/purchase/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, status })
      });
      if (res.ok) {
        setPurchases(prev => prev.map(p => p._id === purchaseId ? { ...p, status } : p));
      }
    } catch (err) {
      console.error("Failed to update purchase status", err);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/purchase/${purchaseId}`, { method: 'DELETE' });
      if (res.ok) setPurchases(prev => prev.filter(p => p._id !== purchaseId));
    } catch (err) {
      console.error("Failed to delete purchase", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', gap: '16px' }}>
        <h2>Admin Panel Access</h2>
        <input type="password" className="input-field" placeholder="Enter Passcode..." value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '80%', maxWidth: '300px', textAlign: 'center' }} />
        <button className="btn-primary" onClick={() => { if (password === 'admin777') setIsAuthenticated(true); else alert('Access Denied'); setPassword(''); }}>Verify</button>
      </div>
    );
  }

  if (isLoading) return <div className="page"><div className="loader-container"><div className="spinner"></div></div></div>;

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <div style={{ display: 'flex', gap: '8px', marginTop: '24px', marginBottom: '24px' }}>
        <button className={`btn-primary ${activeTab === 'purchases' ? '' : 'inactive'}`} style={{ flex: 1, background: activeTab === 'purchases' ? 'var(--primary-color)' : 'var(--surface-color)' }} onClick={() => setActiveTab('purchases')}>Purchases</button>
        <button className={`btn-primary ${activeTab === 'users' ? '' : 'inactive'}`} style={{ flex: 1, background: activeTab === 'users' ? 'var(--primary-color)' : 'var(--surface-color)' }} onClick={() => setActiveTab('users')}>Users Data</button>
        <button className={`btn-primary ${activeTab === 'ads' ? '' : 'inactive'}`} style={{ flex: 1, background: activeTab === 'ads' ? 'var(--primary-color)' : 'var(--surface-color)' }} onClick={() => setActiveTab('ads')}>Ads Setup</button>
      </div>

      <div className="glass-panel">
        {activeTab === 'purchases' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Purchases</h2>
            {purchases.length === 0 ? <p>No purchases yet.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {purchases.map(p => (
                  <li key={p._id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: 'white', fontSize: '16px' }}>{p.item_name}</strong>
                      <span style={{ color: p.status === 'approved' ? '#4caf50' : p.status === 'rejected' ? '#f44336' : 'var(--gold-color)', fontWeight: 'bold' }}>
                        {p.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      By @{p.username} (ID: {p.telegram_id}) • {new Date(p.purchased_at).toLocaleString()}
                    </div>
                    {p.status !== 'approved' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#4caf50', flex: 1 }} onClick={() => updatePurchaseStatus(p._id, 'approved')}>Confirm</button>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#f44336', flex: 1 }} onClick={() => deletePurchase(p._id)}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Registered Users ({users.length})</h2>
            {users.length === 0 ? <p>No users yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map(u => (
                  <div key={u.telegram_id} className="glass-panel" style={{ padding: '16px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{u.first_name} {u.last_name} <span style={{ fontWeight: 'normal', color: 'var(--primary-color)', marginLeft: '8px', fontSize: '14px' }}>@{u.username || 'no_username'}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>ID: {u.telegram_id}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--gold-color)', fontWeight: 'bold', fontSize: '16px' }}>{u.balance} Coins</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Balance</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Contact Info</div>
                        <div style={{ color: 'white' }}>📞 {u.phone || 'Not set'}</div>
                        <div style={{ color: 'white' }}>✉️ {u.email || 'Not set'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Activity Log</div>
                        <div style={{ color: 'white' }}>Joined: {new Date(u.registered_at).toLocaleDateString()}</div>
                        <div style={{ color: 'white' }}>Seen: {new Date(u.last_seen).toLocaleString()}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="number" placeholder="Amount" id={`balance-input-${u.telegram_id}`} style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 10px', color: 'white', fontSize: '14px' }} />
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#4caf50' }} onClick={() => { const input = document.getElementById(`balance-input-${u.telegram_id}`) as HTMLInputElement; updateBalance(u.telegram_id, input.value, 'add'); input.value = ''; }}>+ Add</button>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#f44336' }} onClick={() => { const input = document.getElementById(`balance-input-${u.telegram_id}`) as HTMLInputElement; updateBalance(u.telegram_id, input.value, 'remove'); input.value = ''; }}>- Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ads' && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Google AdSense Configuration</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={adsEnabled} onChange={(e) => setAdsEnabled(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary-color)' }} />
                Enable Google Ads
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Client ID (e.g., ca-pub-12345...)</label>
              <input type="text" className="input-field" value={adsClientId} onChange={(e) => setAdsClientId(e.target.value)} placeholder="ca-pub-XXXXXXXXX" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Slot ID</label>
              <input type="text" className="input-field" value={adsSlotId} onChange={(e) => setAdsSlotId(e.target.value)} placeholder="1234567890" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--gold-color)' }}>Rewarded Ad Provider</h3>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="provider" value="adsgram" checked={rewardedAdProvider === 'adsgram'} onChange={() => setRewardedAdProvider('adsgram')} />
                  AdsGram
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="provider" value="google" checked={rewardedAdProvider === 'google'} onChange={() => setRewardedAdProvider('google')} />
                  Google Ads (H5)
                </label>
              </div>
              
              {rewardedAdProvider === 'adsgram' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>AdsGram Block ID</label>
                  <input type="text" className="input-field" value={adsgramBlockId} onChange={(e) => setAdsgramBlockId(e.target.value)} placeholder="int-XXXXXX" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'white' }} />
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Google AdSense H5 Rewarded Ads will use the Client ID and Slot ID provided above.</p>
              )}
            </div>
            <button className="btn-primary" onClick={saveAdsSettings} style={{ width: '100%' }}>Save Ads Settings</button>
            {saveMessage && <p style={{ color: '#4caf50', marginTop: '12px', textAlign: 'center' }}>{saveMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
