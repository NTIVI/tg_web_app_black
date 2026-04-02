import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Start from './pages/Start';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Top from './pages/Top';
import Bonuses from './pages/Bonuses';
import Admin from './pages/Admin';
import { API_URL } from './config';

function App() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.themeParams) {
        Object.entries(tg.themeParams).forEach(([key, val]: [string, any]) => {
          document.documentElement.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, val);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
        init(true);
        isInitialMount.current = false;
    } else {
        init(false); // Background refresh on nav
    }
  }, [location.pathname]);

  const init = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user || { id: "12345", username: "MockUser", first_name: "Mock", last_name: "Account" };
    const initData = tg?.initData || "";

    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, initDataUnsafe: { user } })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.user) {
        setTgUser({ ...user, ...data.user });
        setBalance(data.user.balance);
      } else {
        throw new Error("Invalid user data");
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const props = { userId: tgUser?.telegram_id, balance, setBalance, tgUser };

  if (loading || !tgUser) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
      {error ? (
        <><h2>Ошибка входа</h2><p>{error}</p><button className="btn-primary" onClick={() => init(true)}>Попробовать снова</button></>
      ) : (
        <><div className="spinner"></div><h2 style={{ color: 'var(--primary-color)' }}>Вход...</h2><p>Авторизация через Telegram</p></>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Start {...props} />} />
        <Route path="shop" element={<Shop {...props} />} />
        <Route path="top" element={<Top />} />
        <Route path="bonuses" element={<Bonuses {...props} />} />
        <Route path="profile" element={<Profile {...props} />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

export default App;
