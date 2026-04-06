import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  Users, 
  Settings, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff,
  Coins,
  Calendar,
  TrendingUp,
  Zap,
  ShoppingCart
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'ads' | 'purchases' | 'trade' | 'nft' | 'nft_stats'>('users');
  
  // Ads settings
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [tadsWidgetId, setTadsWidgetId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [manualTicks, setManualTicks] = useState('');

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
      } else if (activeTab === 'purchases') {
        const res = await fetch(`${API_URL}/admin/purchases`);
        const data = await res.json();
        setPurchases(data.purchases || []);
      } else if (activeTab === 'ads') {
        const res = await fetch(`${API_URL}/settings/ads`);
        const data = await res.json();
        if (data.settings) {
          setAdsEnabled(data.settings.ads_enabled === 'true');
          setAdsClientId(data.settings.ads_client_id || '');
          setAdsSlotId(data.settings.ads_slot_id || '');
          setTadsWidgetId(data.settings.monetag_zone_id || '');
        }
      } else if (activeTab === 'trade') {
        const res = await fetch(`${API_URL}/trade/admin/status`);
        const data = await res.json();
        setTradeStatus(data);
      }
    } catch (err) { console.error(err); }
  };

  const updateBalance = async (telegramId: string, amount: string, action: 'add' | 'remove') => {
    if (!amount || isNaN(parseInt(amount))) return;
    const res = await fetch(`${API_URL}/admin/user/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, amount, action })
    });
    if (res.ok) {
      fetchData();
      // Clear input
      const input = document.getElementById(`amt-${telegramId}`) as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const saveAds = async () => {
    const res = await fetch(`${API_URL}/admin/settings/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ads_enabled: adsEnabled, 
        ads_client_id: adsClientId, 
        ads_slot_id: adsSlotId, 
        monetag_zone_id: tadsWidgetId,
        rewarded_ad_provider: 'monetag' 
      })
    });
    if (res.ok) { setSaveMessage('Settings saved successfully!'); setTimeout(() => setSaveMessage(''), 3000); }
  };

  const saveTradeOverride = async () => {
    const res = await fetch(`${API_URL}/trade/admin/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticks: manualTicks })
    });
    if (res.ok) { 
        setSaveMessage('Trade sequence saved!'); 
        setTimeout(() => setSaveMessage(''), 3000); 
        fetchData();
        setManualTicks('');
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.telegram_id.includes(searchTerm)
  );

  if (!isAuthenticated) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '48px 32px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(145deg, rgba(20,20,25,0.9), rgba(10,10,15,0.95))' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))', 
          width: '88px', 
          height: '88px', 
          borderRadius: '28px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 32px auto', 
          border: '1px solid var(--primary-color)',
          boxShadow: '0 0 30px var(--primary-glow)'
        }}>
          <Lock size={44} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px', letterSpacing: '-1px' }}>Admin Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '15px' }}>Authentication Required</p>
        
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Enter passcode..." 
            className="input-field" 
            style={{ width: '100%', height: '56px', fontSize: '16px', paddingRight: '54px', borderRadius: '18px' }} 
            onKeyDown={(e) => e.key === 'Enter' && password.trim() === 'NTIVI' && setIsAuthenticated(true)}
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>
        
        <button 
          className="btn-primary" 
          style={{ width: '100%', height: '56px', fontSize: '17px', fontWeight: '800', borderRadius: '18px', boxShadow: '0 10px 25px var(--primary-glow)' }}
          onClick={() => { if (password.trim() === 'NTIVI') setIsAuthenticated(true); else alert('Access Denied'); }}
        >
          Authorize
        </button>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Admin Panel</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 10px var(--success-color)' }}></div>
            Management Console
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          className={`btn-primary ${activeTab === 'users' ? '' : 'inactive'}`} 
          style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'users' ? '' : 'transparent', color: activeTab === 'users' ? 'white' : 'var(--text-secondary)', minWidth: '100px', boxShadow: activeTab === 'users' ? '' : 'none', border: 'none' }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={20} />
          <span style={{ fontWeight: '700' }}>Users</span>
        </button>
        <button 
          className={`btn-primary ${activeTab === 'purchases' ? '' : 'inactive'}`} 
          style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'purchases' ? '' : 'transparent', color: activeTab === 'purchases' ? 'white' : 'var(--text-secondary)', minWidth: '110px', boxShadow: activeTab === 'purchases' ? '' : 'none', border: 'none' }}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingBag size={20} />
          <span style={{ fontWeight: '700' }}>Stats</span>
        </button>
        <button 
          className={`btn-primary ${activeTab === 'trade' ? '' : 'inactive'}`} 
          style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'trade' ? '' : 'transparent', color: activeTab === 'trade' ? 'white' : 'var(--text-secondary)', minWidth: '100px', boxShadow: activeTab === 'trade' ? '' : 'none', border: 'none' }}
          onClick={() => setActiveTab('trade')}
        >
          <TrendingUp size={20} />
          <span style={{ fontWeight: '700' }}>Trade</span>
        </button>
        <button 
          className={`btn-primary ${activeTab === 'nft' ? '' : 'inactive'}`} 
          style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'nft' ? '' : 'transparent', color: activeTab === 'nft' ? 'white' : 'var(--text-secondary)', minWidth: '80px', boxShadow: activeTab === 'nft' ? '' : 'none', border: 'none' }}
          onClick={() => setActiveTab('nft')}
        >
          <Zap size={20} />
          <span style={{ fontWeight: '700' }}>NFT</span>
        </button>
        <button 
          className={`btn-primary ${activeTab === 'nft_stats' ? '' : 'inactive'}`} 
          style={{ flex: 1, padding: '12px', borderRadius: '14px', background: activeTab === 'nft_stats' ? '' : 'transparent', color: activeTab === 'nft_stats' ? 'white' : 'var(--text-secondary)', minWidth: '100px', boxShadow: activeTab === 'nft_stats' ? '' : 'none', border: 'none' }}
          onClick={() => setActiveTab('nft_stats')}
        >
          <Plus size={20} />
          <span style={{ fontWeight: '700' }}>Stats</span>
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={20} />
            <input 
              type="text" 
              placeholder="Search users by name or ID..." 
              className="input-field" 
              style={{ width: '100%', paddingLeft: '48px', borderRadius: '18px' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
              <div key={u.telegram_id} className="glass-panel" style={{ padding: '20px', marginBottom: 0, borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={u.photo_url || ''} 
                      style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                      alt="User"
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>
                        {u.first_name}
                        <span style={{ 
                          marginLeft: '8px', 
                          background: 'linear-gradient(135deg, var(--gold-color), #ff9900)', 
                          color: '#000', 
                          padding: '1px 6px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '800' 
                        }}>
                          LVL {u.level || 1}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>@{u.username || 'user'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Coins size={16} />
                      {u.balance}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>ID: {u.telegram_id.slice(-8)}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <input 
                    type="number" 
                    id={`amt-${u.telegram_id}`} 
                    placeholder="Amount..." 
                    className="input-field" 
                    style={{ flex: 1, height: '40px', fontSize: '14px', borderRadius: '10px' }} 
                  />
                  <button 
                    className="btn-primary" 
                    style={{ padding: '0 12px', height: '40px', borderRadius: '10px', minWidth: '40px' }} 
                    onClick={() => updateBalance(u.telegram_id, (document.getElementById(`amt-${u.telegram_id}`) as HTMLInputElement).value, 'add')}
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '0 12px', height: '40px', borderRadius: '10px', minWidth: '40px', background: 'linear-gradient(135deg, #f44336, #c62828)' }} 
                    onClick={() => updateBalance(u.telegram_id, (document.getElementById(`amt-${u.telegram_id}`) as HTMLInputElement).value, 'remove')}
                  >
                    <Minus size={20} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
                <Search size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'purchases' && (
        <div className="glass-panel" style={{ padding: '0' }}>
          {purchases.length > 0 ? (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <ShoppingBag size={20} color="var(--primary-color)" />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Recent Purchases</h3>
              </div>
              {purchases.map((p, i) => (
                <div key={i} style={{ padding: '16px 0', borderBottom: i === purchases.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={p.photo_url || ''} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} alt="Avatar" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{p.item_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>by {p.first_name} (@{p.username || 'user'})</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '14px' }}>{p.price}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Calendar size={10} />
                      {new Date(p.purchased_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p style={{ opacity: 0.5 }}>No purchases recorded in the database.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '12px' }}>
                <Settings size={22} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Monetization Settings</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <label style={{ fontWeight: '700', display: 'block', fontSize: '15px' }}>Enable Global Ads</label>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show banners and video rewards</div>
              </div>
              <input 
                type="checkbox" 
                checked={adsEnabled} 
                onChange={e => setAdsEnabled(e.target.checked)} 
                style={{ width: '24px', height: '24px', accentColor: 'var(--primary-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Ad Provider</label>
              <div 
                className="input-field"
                style={{ width: '100%', background: 'var(--surface-color-light)', height: '52px', display: 'flex', alignItems: 'center', padding: '0 16px', opacity: 0.8 }}
              >
                Tads.me (Official)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Tads.me Widget ID</label>
                <input type="text" value={tadsWidgetId} onChange={e => setTadsWidgetId(e.target.value)} placeholder="e.g. 9609" className="input-field" style={{ width: '100%', height: '52px', border: '1px solid var(--primary-color)' }} />
              </div>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }}></div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Google Publisher ID</label>
                <input type="text" value={adsClientId} onChange={e => setAdsClientId(e.target.value)} placeholder="ca-pub-..." className="input-field" style={{ width: '100%', height: '52px' }} />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button className="btn-primary" style={{ width: '100%', height: '56px', borderRadius: '18px' }} onClick={saveAds}>
                <Check size={22} />
                <span style={{ fontSize: '17px', fontWeight: '800' }}>Apply Configuration</span>
              </button>
              {saveMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', background: 'rgba(0,242,254,0.1)', padding: '12px', borderRadius: '12px', marginTop: '16px', fontSize: '14px', border: '1px solid rgba(0,242,254,0.2)' }}>
                  <AlertCircle size={18} />
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trade' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--primary-glow)', padding: '10px', borderRadius: '12px' }}>
                <TrendingUp size={22} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Trade Management</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Текущая цена</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--secondary-color)' }}>
                    {tradeStatus?.currentPrice?.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.4, marginTop: '8px' }}>
                    Следующий тик: {Math.max(0, Math.floor((tradeStatus?.nextTickTime - Date.now()) / 1000))}с
                </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: '700' }}>
                 Очередь будущих тиков
              </label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', minHeight: '60px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {tradeStatus?.manualTicks && tradeStatus.manualTicks.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {tradeStatus.manualTicks.map((t: number, i: number) => (
                              <div key={i} style={{ 
                                  background: t > 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                  color: t > 0 ? '#4ade80' : '#f87171',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '800',
                                  border: `1px solid ${t > 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                              }}>
                                  {t > 0 ? '+' : ''}{t}%
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div style={{ opacity: 0.3, textAlign: 'center', fontSize: '14px' }}>Очередь пуста. Работает рандом (±2-5%).</div>
                  )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea 
                  value={manualTicks}
                  onChange={e => setManualTicks(e.target.value)}
                  placeholder="Введите последовательность процентов через пробел, напр: +3 -5 +2 +4 -3" 
                  className="input-field"
                  style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '18px', resize: 'none' }}
                />
                <button className="btn-primary" style={{ width: '100%', height: '56px', borderRadius: '18px' }} onClick={saveTradeOverride}>
                    <Check size={22} />
                    <span style={{ fontSize: '17px', fontWeight: '800' }}>Save Sequence</span>
                </button>
              </div>
            </div>

            {saveMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', background: 'rgba(0,242,254,0.1)', padding: '12px', borderRadius: '12px', fontSize: '14px', border: '1px solid rgba(0,242,254,0.2)' }}>
                  <AlertCircle size={18} />
                  {saveMessage}
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'nft' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ 
            width: '100%', 
            maxWidth: '400px', 
            aspectRatio: '1/1', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none', background: 'linear-gradient(45deg, var(--primary-color) 25%, transparent 25%, transparent 50%, var(--primary-color) 50%, var(--primary-color) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
            
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>NFT Control Hub</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', opacity: 0.6, marginBottom: '8px' }}>Target Change (%)</label>
                <input type="text" placeholder="+5%" className="input-field" style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', opacity: 0.6, marginBottom: '8px' }}>Growth Time (seconds)</label>
                <input type="text" placeholder="30" className="input-field" style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800' }} />
              </div>
              
              <button className="btn-primary" style={{ height: '56px', borderRadius: '18px', marginTop: '10px' }}>
                <Zap size={20} />
                Launch Manipulation
              </button>
              
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--success-color)', fontWeight: '700' }}>Price Growing</span>
                  <span>+3.2% / +5%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '64%', height: '100%', background: 'linear-gradient(to right, var(--success-color), #4ade80)', boxShadow: '0 0 10px var(--success-color)', animation: 'pulse 2s infinite' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                  <TrendingUp size={16} color="var(--success-color)" />
                </div>
              </div>
            </div>
            
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `}</style>
          </div>
        </div>
      )}

      {activeTab === 'nft_stats' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ 
            width: '100%', 
            maxWidth: '100%', 
            aspectRatio: '1/1', 
            display: 'flex', 
            flexDirection: 'column',
            padding: '24px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ShoppingCart size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Purchase Statistics</h3>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>User</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>NFT</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>Qty</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6, textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { u: 'user123', n: 'NFT #1', q: '5 pcs', d: '06.04.2026' },
                    { u: 'cyber_punk', n: 'NFT #3', q: '2 pcs', d: '06.04.2026' },
                    { u: 'neon_rider', n: 'NFT #2', q: '1 pc', d: '05.04.2026' },
                    { u: 'meta_guru', n: 'NFT #1', q: '10 pcs', d: '05.04.2026' },
                    { u: 'bit_lord', n: 'NFT #3', q: '3 pcs', d: '04.04.2026' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{row.u}</td>
                      <td style={{ padding: '12px 8px' }}>{row.n}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--gold-color)', fontWeight: '800' }}>{row.q}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', opacity: 0.5 }}>{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
