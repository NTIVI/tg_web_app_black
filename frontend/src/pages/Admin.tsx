import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import PurchaseList from '../components/admin/PurchaseList';
import UserList from '../components/admin/UserList';
import AdsConfig from '../components/admin/AdsConfig';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'purchases' | 'ads'>('purchases');
  
  // Ad settings state
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [rewardedAdProvider, setRewardedAdProvider] = useState<'adsgram' | 'google'>('adsgram');
  const [saveMessage, setSaveMessage] = useState('');

  const { request, loading } = useApi();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      try {
        const [usersData, purchasesData, adsData] = await Promise.all([
          request('/admin/users'),
          request('/admin/purchases'),
          request('/settings/ads')
        ]);
        
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
      }
    };
    
    fetchData();
  }, [activeTab, isAuthenticated, request]);

  const saveAdsSettings = async () => {
    try {
      await request('/admin/settings/ads', {
        method: 'POST',
        body: JSON.stringify({
          ads_enabled: adsEnabled, ads_client_id: adsClientId, ads_slot_id: adsSlotId,
          adsgram_block_id: adsgramBlockId, rewarded_ad_provider: rewardedAdProvider
        })
      });
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Error saving settings.');
    }
  };

  const updateBalance = async (telegramId: string, amount: string, action: 'add' | 'remove') => {
    if (!amount || isNaN(parseInt(amount))) return;
    try {
      const data = await request('/admin/user/balance', {
        method: 'POST',
        body: JSON.stringify({ telegramId, amount: parseInt(amount), action })
      });
      setUsers(prev => prev.map(u => u.telegram_id === telegramId ? { ...u, balance: data.newBalance } : u));
    } catch (err) {
      console.error("Balance update failed", err);
    }
  };

  const updatePurchaseStatus = async (purchaseId: string, status: string) => {
    try {
      await request('/admin/purchase/status', {
        method: 'POST',
        body: JSON.stringify({ purchaseId, status })
      });
      setPurchases(prev => prev.map(p => p._id === purchaseId ? { ...p, status } : p));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const deletePurchase = async (id: string) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await request(`/admin/purchase/${id}`, { method: 'DELETE' });
      setPurchases(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (!isAuthenticated) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', gap: '16px' }}>
      <h2>Admin Panel Access</h2>
      <input type="password" className="input-field" placeholder="Passcode..." value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '80%', maxWidth: '300px' }} />
      <button className="btn-primary" onClick={() => { if (password === 'admin777') setIsAuthenticated(true); else alert('Access Denied'); setPassword(''); }}>Verify</button>
    </div>
  );

  if (loading && users.length === 0) return <div className="page"><div className="loader-container"><div className="spinner"></div></div></div>;

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <div style={{ display: 'flex', gap: '8px', margin: '24px 0' }}>
        {(['purchases', 'users', 'ads'] as const).map(tab => (
          <button key={tab} className={`btn-primary ${activeTab === tab ? '' : 'inactive'}`} style={{ flex: 1, background: activeTab === tab ? 'var(--primary-color)' : 'var(--surface-color)' }} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="glass-panel">
        {activeTab === 'purchases' && <PurchaseList purchases={purchases} onUpdateStatus={updatePurchaseStatus} onDelete={deletePurchase} />}
        {activeTab === 'users' && <UserList users={users} onUpdateBalance={updateBalance} />}
        {activeTab === 'ads' && (
          <AdsConfig 
            adsEnabled={adsEnabled} setAdsEnabled={setAdsEnabled}
            adsClientId={adsClientId} setAdsClientId={setAdsClientId}
            adsSlotId={adsSlotId} setAdsSlotId={setAdsSlotId}
            adsgramBlockId={adsgramBlockId} setAdsgramBlockId={setAdsgramBlockId}
            rewardedAdProvider={rewardedAdProvider} setRewardedAdProvider={setRewardedAdProvider}
            onSave={saveAdsSettings} saveMessage={saveMessage}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
