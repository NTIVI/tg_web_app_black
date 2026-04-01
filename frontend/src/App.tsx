import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Start from './pages/Start';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { useApi } from './hooks/useApi';

function App() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const { request, loading, error } = useApi();
  
  const init = useCallback(async () => {
    const tg = (window as any).Telegram?.WebApp;
    
    // Theme sync
    if (tg?.themeParams) {
      Object.entries(tg.themeParams).forEach(([key, val]: [string, any]) => {
        document.documentElement.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, val);
      });
    }

    const user = tg?.initDataUnsafe?.user || { id: "123456", username: "MockUser", first_name: "Mock" };
    const initData = tg?.initData || "";
    tg?.expand?.();
    tg?.ready?.();

    try {
      const data = await request('/auth', {
        method: 'POST',
        body: JSON.stringify({ initData, initDataUnsafe: { user } })
      });
      if (data.user) {
        setTgUser({ ...user, ...data.user });
        setBalance(data.user.balance);
      }
    } catch (e) {
      console.error("Auth failed", e);
    }
  }, [request]);

  useEffect(() => {
    init();
  }, [init]);

  if (loading || !tgUser) return (
    <div className="page loader-container">
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ff3366' }}>Login Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={init}>Try Again</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <h2 style={{ color: 'var(--primary-color)', marginTop: '16px' }}>Entering...</h2>
        </div>
      )}
    </div>
  );

  const props = { userId: tgUser?.telegram_id, balance, setBalance, tgUser };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Start {...props} />} />
          <Route path="shop" element={<Shop {...props} />} />
          <Route path="profile" element={<Profile {...props} />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
