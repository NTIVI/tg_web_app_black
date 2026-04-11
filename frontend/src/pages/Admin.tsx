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
  DollarSign,
  Calendar,
  Zap,
  ShoppingCart,
  Newspaper,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'ads' | 'purchases' | 'nft' | 'nft_stats' | 'social'>('users');
  
  // Ads settings
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [tadsWidgetId, setTadsWidgetId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // NFT Admin
  const [nftStats, setNftStats] = useState<any[]>([]);
  const [nftRates, setNftRates] = useState<Record<string, number>>({});
  const [globalNftRate, setGlobalNftRate] = useState<string>('');

  // Social Stats Admin
  const [socialStats, setSocialStats] = useState<any>({
    tiktok: { current: 8450, target: 10000 },
    instagram: { current: 4200, target: 5000 },
    telegram: { current: 2310, target: 3000 },
    facebook: { current: 1540, target: 2000 }
  });

  // News Admin
  const [newsBanners, setNewsBanners] = useState<any[]>([]);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({ imageUrl: '', linkUrl: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '', imageUrl: '' });

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
    let interval: any;
    if (activeTab === 'users') {
      interval = setInterval(fetchData, 5000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/admin/users`, { headers });
        const data = await res.json();
        setUsers(data.users || []);
      } else if (activeTab === 'purchases') {
        const res = await fetch(`${API_URL}/admin/purchases`, { headers });
        const data = await res.json();
        setPurchases(data.purchases || []);
      } else if (activeTab === 'ads') {
        const res = await fetch(`${API_URL}/settings/ads`, { headers });
        const data = await res.json();
        if (data.settings) {
          setAdsEnabled(data.settings.ads_enabled === 'true');
          setAdsClientId(data.settings.ads_client_id || '');
          setAdsSlotId(data.settings.ads_slot_id || '');
          setTadsWidgetId(data.settings.monetag_zone_id || '');
        }
      } else if (activeTab === 'nft') {
        const res = await fetch(`${API_URL}/nft/rates`, { headers });
        const data = await res.json();
        if (data.rates) setNftRates(data.rates);
      } else if (activeTab === 'nft_stats') {
        const res = await fetch(`${API_URL}/admin/nft/stats`, { headers });
        const data = await res.json();
        setNftStats(data.stats || []);
      } else if (activeTab === 'social') {
        const res = await fetch(`${API_URL}/social-stats`, { headers });
        const data = await res.json();
        if (data.stats) setSocialStats(data.stats);
      } else if (activeTab === 'news') {
        const res1 = await fetch(`${API_URL}/news/banners`, { headers });
        const data1 = await res1.json();
        if (data1.banners) setNewsBanners(data1.banners);
        
        const res2 = await fetch(`${API_URL}/news/posts`, { headers });
        const data2 = await res2.json();
        if (data2.posts) setNewsPosts(data2.posts);
      }
    } catch (err) { 
      console.error('Fetch error in Admin:', err); 
      setSaveMessage('Error loading data. Check console or network.');
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const updateBalance = async (telegramId: string, amount: string, action: 'add' | 'remove') => {
    if (!amount || isNaN(parseInt(amount))) return;
    const res = await fetch(`${API_URL}/admin/user/balance`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
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

  const applyGlobalRate = () => {
    const parsed = parseFloat(globalNftRate);
    if (isNaN(parsed)) return;
    setNftRates(prev => {
      const next = { ...prev };
      ['brand1', 'brand2', 'brand3', 'brand4', 'brand5', 'brand6', 'brand7', 'brand8'].forEach(k => {
        next[k] = parsed;
      });
      return next;
    });
  };

  const saveNftRates = async () => {
    const parsedRates: Record<string, number> = {};
    Object.keys(nftRates).forEach(k => {
      parsedRates[k] = parseFloat(String(nftRates[k])) || 0;
    });

    const res = await fetch(`${API_URL}/admin/nft/rates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ rates: parsedRates })
    });
    if (res.ok) {
      setSaveMessage('Проценты сохранены!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const saveSocialStats = async () => {
    const res = await fetch(`${API_URL}/admin/social-stats`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ stats: socialStats })
    });
    if (res.ok) {
      setSaveMessage('Social stats saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleAddBanner = async () => {
    if (!bannerForm.imageUrl) return alert('Укажите URL картинки');
    const res = await fetch(`${API_URL}/admin/news/banners`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(bannerForm)
    });
    if (res.ok) {
      const data = await res.json();
      setNewsBanners(data.banners);
      setBannerForm({ imageUrl: '', linkUrl: '' });
      setSaveMessage('Баннер добавлен');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Удалить баннер?')) return;
    const res = await fetch(`${API_URL}/admin/news/banners/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      }
    });
    if (res.ok) {
      setNewsBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleAddPost = async () => {
    if (!postForm.title) return alert('Укажите заголовок');
    const res = await fetch(`${API_URL}/admin/news/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(postForm)
    });
    if (res.ok) {
      const data = await res.json();
      setNewsPosts(data.posts);
      setPostForm({ title: '', content: '', imageUrl: '' });
      setSaveMessage('Пост добавлен');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Удалить пост?')) return;
    const res = await fetch(`${API_URL}/admin/news/posts/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      }
    });
    if (res.ok) {
      setNewsPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleRateChange = (id: string, val: string) => {
    setNftRates(prev => ({ ...prev, [id]: val as any }));
  };

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase();
    const firstName = (u.first_name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const telegramId = String(u.telegram_id || '').toLowerCase();
    
    return firstName.includes(search) || username.includes(search) || telegramId.includes(search);
  });

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
          onClick={async () => { 
            try {
              const res = await fetch(`${API_URL}/admin/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
              });
              if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('admin_token', data.token);
                setIsAuthenticated(true);
              } else {
                alert('Access Denied: Invalid Passcode');
              }
            } catch (err) {
              alert('Connection error. Is the server running?');
            }
          }}
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

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '6px', 
        borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        paddingRight: '12px'
      }}>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'users' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'users' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'users' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'users' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Пользователи</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'purchases' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'purchases' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'purchases' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'purchases' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingBag size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Стат. Магазин</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'nft' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'nft' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'nft' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'nft' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'nft' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('nft')}
        >
          <Zap size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Акции (%)</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'nft_stats' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'nft_stats' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'nft_stats' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'nft_stats' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'nft_stats' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('nft_stats')}
        >
          <Plus size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Стат. Акций</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'social' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'social' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'social' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'social' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('social')}
        >
          <Users size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Соцсети</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'news' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'news' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'news' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'news' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Новости</span>
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
                        {u.first_name || 'No Name'}
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
                      <DollarSign size={16} />
                      {((u.balance || 0) / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>ID: {String(u.telegram_id || '').slice(-8)}</div>
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

      {activeTab === 'nft' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>Индивидуальное Управление Акциями (%)</h3>
            
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', textAlign: 'center' }}>Массовое управление</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className="input-field" 
                  value={globalNftRate} 
                  onChange={(e) => setGlobalNftRate(e.target.value)} 
                  placeholder="Задать % для всех (пр. +10)"
                  style={{ flex: 1, textAlign: 'center' }}
                />
                <button onClick={applyGlobalRate} className="btn-primary" style={{ padding: '0 20px', borderRadius: '12px', fontSize: '14px' }}>
                  Применить ко всем
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                  { id: 'brand1', name: 'Apple' },
                  { id: 'brand2', name: 'NVIDIA' },
                  { id: 'brand3', name: 'Samsung' },
                  { id: 'brand4', name: 'Xiaomi' },
                  { id: 'brand5', name: 'Netflix' },
                  { id: 'brand6', name: 'Epic Games' },
                  { id: 'brand7', name: 'Steam' },
                  { id: 'brand8', name: 'Xbox' },
              ].map(nft => (
                <div key={nft.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: 'var(--primary-color)', textAlign: 'center' }}>{nft.name}</div>
                  <input 
                    className="input-field" 
                    value={nftRates[nft.id] !== undefined ? nftRates[nft.id] : ''} 
                    onChange={(e) => handleRateChange(nft.id, e.target.value)} 
                    placeholder="Напр. 5.5 или -2.1"
                    style={{ textAlign: 'center', width: '100%' }}
                  />
                </div>
              ))}
            </div>

            <button onClick={saveNftRates} className="btn-primary" style={{ width: '100%', height: '56px', borderRadius: '18px', marginTop: '24px' }}>
              <Zap size={20} />
              Сохранить проценты
            </button>

            {saveMessage && (
              <div style={{ textAlign: 'center', color: 'var(--success-color)', fontSize: '14px', fontWeight: 'bold', marginTop: '16px' }}>{saveMessage}</div>
            )}
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
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Общая статистика покупок</h3>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>Пользователь</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>Акция</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6 }}>Количество куплено</th>
                    <th style={{ padding: '12px 8px', opacity: 0.6, textAlign: 'right' }}>Последняя покупка</th>
                  </tr>
                </thead>
                <tbody>
                  {nftStats.length > 0 ? nftStats.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{row.username ? `@${row.username}` : row.first_name || 'user'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {{
                          brand1: 'Apple',
                          brand2: 'Nvidia',
                          brand3: 'Samsung',
                          brand4: 'Xiaomi',
                          brand5: 'Netflix',
                          brand6: 'Epic Games',
                          brand7: 'Steam',
                          brand8: 'Xbox'
                        }[row.nft_id] || row.nft_id}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--gold-color)', fontWeight: '800' }}>{row.total_qty} шт</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', opacity: 0.5 }}>{new Date(row.last_purchase).toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Нет данных о покупках</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>Управление Соцсетями</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { id: 'tiktok', name: 'TikTok' },
                { id: 'instagram', name: 'Instagram' },
                { id: 'telegram', name: 'Telegram' },
                { id: 'facebook', name: 'Facebook' },
                { id: 'youtube', name: 'YouTube' }
              ].map(network => (
                <div key={network.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{network.name}</span>
                    <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: 'normal' }}>
                        {socialStats[network.id]?.current?.toLocaleString() || 0} сейчас
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>Ссылка на профиль</label>
                    <input 
                      type="text"
                      className="input-field" 
                      value={socialStats[network.id]?.url || ''} 
                      onChange={(e) => setSocialStats((prev: any) => ({ ...prev, [network.id]: { ...prev[network.id], url: e.target.value } }))} 
                      placeholder="https://..."
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>Ручное значение (Сейчас)</label>
                      <input 
                        type="number"
                        className="input-field" 
                        value={socialStats[network.id]?.current || 0} 
                        onChange={(e) => setSocialStats((prev: any) => ({ ...prev, [network.id]: { ...prev[network.id], current: parseInt(e.target.value) || 0 } }))} 
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px', display: 'block' }}>Цель (Target)</label>
                      <input 
                        type="number"
                        className="input-field" 
                        value={socialStats[network.id]?.target || 0} 
                        onChange={(e) => setSocialStats((prev: any) => ({ ...prev, [network.id]: { ...prev[network.id], target: parseInt(e.target.value) || 0 } }))} 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveSocialStats} className="btn-primary" style={{ width: '100%', height: '56px', borderRadius: '18px', marginTop: '24px' }}>
              <Check size={20} />
              Сохранить значения
            </button>

            {saveMessage && (
              <div style={{ textAlign: 'center', color: 'var(--success-color)', fontSize: '14px', fontWeight: 'bold', marginTop: '16px' }}>{saveMessage}</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Banners Section */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={24} color="var(--primary-color)" /> Управление Баннерами
            </h3>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <input 
                className="input-field" 
                placeholder="URL картинки..." 
                value={bannerForm.imageUrl} 
                onChange={e => setBannerForm(p => ({ ...p, imageUrl: e.target.value }))}
                style={{ flex: 2 }}
              />
              <input 
                className="input-field" 
                placeholder="Ссылка (необязательно)..." 
                value={bannerForm.linkUrl} 
                onChange={e => setBannerForm(p => ({ ...p, linkUrl: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={handleAddBanner} style={{ padding: '0 24px', borderRadius: '14px' }}>
                Добавить
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {newsBanners.map(b => (
                <div key={b.id} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '120px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={b.image_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => handleDeleteBanner(b.id)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,0,0,0.8)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {newsBanners.length === 0 && <span style={{ opacity: 0.5 }}>Нет баннеров</span>}
            </div>
          </div>

          {/* Posts Section */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Newspaper size={24} color="var(--primary-color)" /> Новостные Посты
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <input 
                className="input-field" 
                placeholder="Заголовок поста..." 
                value={postForm.title} 
                onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
              />
              <input 
                className="input-field" 
                placeholder="URL картинки (необязательно)..." 
                value={postForm.imageUrl} 
                onChange={e => setPostForm(p => ({ ...p, imageUrl: e.target.value }))}
              />
              <textarea 
                className="input-field" 
                placeholder="Текст поста..." 
                value={postForm.content} 
                onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))}
                style={{ height: '100px', resize: 'vertical' }}
              />
              <button className="btn-primary" onClick={handleAddPost} style={{ height: '48px', borderRadius: '14px' }}>
                Опубликовать Пост
              </button>

              {saveMessage && (
                <div style={{ textAlign: 'center', color: 'var(--success-color)', fontSize: '14px', fontWeight: 'bold' }}>{saveMessage}</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {newsPosts.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {p.image_url && <img src={p.image_url} alt="post" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: '13px', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</div>
                  </div>
                  <button 
                    onClick={() => handleDeletePost(p.id)}
                    style={{ background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff4444', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {newsPosts.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Нет постов</div>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Admin;
