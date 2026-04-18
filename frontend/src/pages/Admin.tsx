import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  Users, 
  Settings, 
  ShoppingBag, 
  Search, 
  Check, 
  Lock, 
  Eye, 
  EyeOff,
  DollarSign,
  Calendar,
  ShoppingCart,
  Newspaper,
  Trash2,
  Image as ImageIcon,
  Plus, 
  Minus,
  AlertCircle,
  AlertCircle,
  Zap,
  HandCoins
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'ads' | 'purchases' | 'social' | 'news' | 'shop' | 'withdrawals'>('users');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  
  // Ads settings
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState('');
  const [adsSlotId, setAdsSlotId] = useState('');
  const [tadsWidgetId, setTadsWidgetId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');


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
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({ imageUrl: '', linkUrl: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '', imageUrl: '' });
  const [shopForm, setShopForm] = useState({ id: null, category: '', name: '', price: '', imageUrl: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      } else if (activeTab === 'shop') {
        const res = await fetch(`${API_URL}/shop/items`, { headers });
        const data = await res.json();
        if (data.items) setShopItems(data.items);
      } else if (activeTab === 'withdrawals') {
        const res = await fetch(`${API_URL}/admin/withdrawals`, { headers });
        const data = await res.json();
        if (data.withdrawals) setWithdrawals(data.withdrawals);
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

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    setSaveMessage('Обновление статистики...');
    try {
      const res = await fetch(`${API_URL}/admin/social-stats/refresh`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        setSaveMessage('Статистика обновлена!');
        fetchData();
      } else {
        setSaveMessage('Ошибка обновления');
      }
    } catch (e: any) {
            if (e.message.includes('Unauthorized') || e.message.includes('token')) {
        setSaveMessage('Ошибка: Сессия истекла');
      } else {
        setSaveMessage(e.message === 'Failed to fetch' ? 'Ошибка сети: Сервер недоступен' : e.message);
      }
    } finally {
      setIsRefreshing(false);
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

  const handleSaveShopItem = async () => {
    if (!shopForm.name || !shopForm.category || !shopForm.price) return alert('Fill name, category and price');
    const res = await fetch(`${API_URL}/admin/shop/items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ ...shopForm, price: parseInt(shopForm.price) })
    });
    if (res.ok) {
      const data = await res.json();
      setShopItems(data.items);
      setShopForm({ id: null, category: '', name: '', price: '', imageUrl: '' });
      setSaveMessage('Товар сохранен');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDeleteShopItem = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    const res = await fetch(`${API_URL}/admin/shop/items/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      }
    });
    if (res.ok) {
      setShopItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const res = await fetch(`${API_URL}/admin/withdraw/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token') || sessionStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      setSaveMessage('Статус обновлен');
      fetchData();
      setTimeout(() => setSaveMessage(''), 3000);
    }
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

        <button 
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'shop' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent', 
            color: activeTab === 'shop' ? 'white' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'shop' ? '0 10px 20px rgba(30, 64, 175, 0.3)' : 'none',
            transform: activeTab === 'shop' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('shop')}
        >
          <ShoppingCart size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Магазин</span>
        </button>

         <button 
          className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`} 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '18px', 
            background: activeTab === 'withdrawals' ? 'linear-gradient(135deg, var(--gold-color), #ffcc00)' : 'transparent', 
            color: activeTab === 'withdrawals' ? 'black' : 'var(--text-secondary)', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '100px',
            boxShadow: activeTab === 'withdrawals' ? '0 10px 20px rgba(245, 158, 11, 0.3)' : 'none',
            transform: activeTab === 'withdrawals' ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => setActiveTab('withdrawals')}
        >
          <HandCoins size={18} />
          <span style={{ fontWeight: '800', fontSize: '13px' }}>Выводы</span>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={saveSocialStats} 
                className="btn-primary" 
                style={{ flex: 2, height: '56px', borderRadius: '18px' }}
              >
                <Check size={20} />
                Сохранить настройки
              </button>
              
              <button 
                onClick={handleRefreshStats} 
                disabled={isRefreshing}
                className="btn-primary" 
                style={{ flex: 1, height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {isRefreshing ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : <Zap size={20} />}
              </button>
            </div>

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

      {activeTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={24} color="var(--primary-color)" /> Управление Товарами
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <input 
                className="input-field" 
                placeholder="Название..." 
                value={shopForm.name} 
                onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))}
              />
              <input 
                className="input-field" 
                placeholder="Категория (пр. Телефоны)..." 
                value={shopForm.category} 
                onChange={e => setShopForm(p => ({ ...p, category: e.target.value }))}
              />
              <input 
                className="input-field" 
                type="number"
                placeholder="Цена (в центах)..." 
                value={shopForm.price} 
                onChange={e => setShopForm(p => ({ ...p, price: e.target.value }))}
              />
              <input 
                className="input-field" 
                placeholder="URL картинки..." 
                value={shopForm.imageUrl} 
                onChange={e => setShopForm(p => ({ ...p, imageUrl: e.target.value }))}
              />
            </div>
            
            <button className="btn-primary" onClick={handleSaveShopItem} style={{ width: '100%', height: '52px', borderRadius: '16px', marginBottom: '16px' }}>
              {shopForm.id ? 'Обновить товар' : 'Добавить товар'}
            </button>
            {shopForm.id && (
              <button 
                className="btn-secondary" 
                onClick={() => setShopForm({ id: null, category: '', name: '', price: '', imageUrl: '' })}
                style={{ width: '100%', marginBottom: '24px', opacity: 0.6 }}
              >
                Отмена редактирования
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {shopItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <img src={item.image_url} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700' }}>{item.category}</div>
                    <div style={{ fontSize: '13px', color: 'var(--gold-color)', fontWeight: '800' }}>${(item.price / 100).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => setShopForm({ id: item.id, category: item.category, name: item.name, price: item.price.toString(), imageUrl: item.image_url })}
                      style={{ background: 'rgba(56, 189, 248, 0.1)', border: 'none', color: 'var(--primary-color)', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteShopItem(item.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="glass-panel" style={{ padding: '0' }}>
            {withdrawals.length > 0 ? (
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <HandCoins size={24} color="var(--gold-color)" />
                        <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Заявки на вывод</h3>
                    </div>
                    {withdrawals.map((w, i) => (
                        <div key={w.id} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{w.first_name?.[0]}</div>
                                    <div>
                                        <div style={{ fontWeight: '700' }}>{w.first_name} (@{w.username})</div>
                                        <div style={{ fontSize: '12px', opacity: 0.5 }}>ID: {w.telegram_id}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--gold-color)', fontWeight: '900', fontSize: '18px' }}>{w.amount_adamants} адамантов</div>
                                    <div style={{ fontSize: '12px', opacity: 0.5 }}>{new Date(w.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                            
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Реквизиты:</div>
                                <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{w.payout_info}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ 
                                    padding: '4px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '12px', 
                                    fontWeight: '800',
                                    background: w.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : w.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: w.status === 'pending' ? 'var(--gold-color)' : w.status === 'completed' ? 'var(--success-color)' : 'var(--error-color)',
                                    border: '1px solid currentColor'
                                }}>
                                    {w.status === 'pending' ? 'ОЖИДАЕТ' : w.status === 'completed' ? 'ВЫПЛАЧЕНО' : 'ОТКЛОНЕНО'}
                                </div>

                                {w.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--success-color)', border: 'none' }}
                                            onClick={() => handleUpdateStatus(w.id, 'completed')}
                                        >Подтвердить</button>
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--error-color)', border: 'none' }}
                                            onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                        >Отклонить</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '80px 20px', textAlign: 'center', opacity: 0.5 }}>
                    <HandCoins size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <p>Пока нет ни одной заявки на вывод.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Admin;
