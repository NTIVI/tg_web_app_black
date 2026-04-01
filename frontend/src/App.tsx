import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Start from './pages/Start';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { API_URL } from './config';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  
  // In a real Telegram Mini App, we would get initDataUnsafe. 
  // For the sake of testing locally, we'll mock it if it's missing.
  useEffect(() => {
    // Attempt to authenticate
    const attemptAuth = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        let telegramId = "user_123"; 
        let username = "Guest";

        tg?.expand?.();
        tg?.ready?.();

        const res = await fetch(`${API_URL}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            initDataUnsafe: { user: { id: telegramId, username } } 
          })
        });
        
        const data = await res.json();
        if (data.user) {
          setUserId(telegramId);
          setBalance(data.user.balance);
        }
      } catch (error) {
        console.error("Auth failed", error);
      }
    };
    attemptAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Start userId={userId} balance={balance} setBalance={setBalance} />} />
          <Route path="shop" element={<Shop userId={userId} balance={balance} setBalance={setBalance} />} />
          <Route path="profile" element={<Profile userId={userId} balance={balance} />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
