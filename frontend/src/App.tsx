import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
    
    // Initial load: Auth once on mount
    init(true);
  }, []);

  const init = async (showLoading = true) => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user || { id: "12345", username: "MockUser", first_name: "Mock", last_name: "Account" };
    const initData = tg?.initData || "";

    // Optimistically set user data from TG immediately if not already set
    if (!tgUser) {
        setTgUser(user);
    }

    if (showLoading && !tgUser) setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, initDataUnsafe: { user } }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.user) {
        // Merge server data (balance, etc) with TG user data
        setTgUser((prev: any) => ({ ...prev, ...data.user }));
        setBalance(data.user.balance);
      }
    } catch (e: any) {
      console.error('Init error:', e);
      if (showLoading) {
        setError(e.name === 'AbortError' ? 'Сервер долго не отвечает. Проверяйте интернет.' : e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const props = { userId: tgUser?.telegram_id || tgUser?.id, balance, setBalance, tgUser };

  // Only show error or blocking loader if we have NO user data at all (not even from initDataUnsafe)
  if (loading && !tgUser) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
      <div className="spinner"></div>
      <h2 style={{ color: 'var(--primary-color)' }}>Вход...</h2>
      <p>Загрузка данных</p>
    </div>
  );

  if (error && !tgUser) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
      <h2>Ошибка входа</h2>
      <p>{error}</p>
      <button className="btn-primary" onClick={() => init(true)}>Попробовать снова</button>
    </div>
  );

  return (
    <>
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
    </>
  );
}

export default App;
