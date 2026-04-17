import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Start from './pages/Start';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Top from './pages/Top';
import Bonuses from './pages/Bonuses';
import News from './pages/News';
import Games from './pages/Games';
import GamePage from './pages/GamePage';
import Admin from './pages/Admin';
import DailyBonusModal from './components/DailyBonusModal';
import { API_URL } from './config';

function App() {
  // Initial state from cache or Telegram
  const tg = (window as any).Telegram?.WebApp;
  const initialUser = tg?.initDataUnsafe?.user || { id: "12345", username: "MockUser", first_name: "Mock", last_name: "Account" };
  
  const [tgUser, setTgUser] = useState<any>(() => {
    const cached = localStorage.getItem('cached_user');
    return cached ? JSON.parse(cached) : initialUser;
  });
  const [balance, setBalance] = useState<number>(() => {
    const cached = localStorage.getItem('cached_balance');
    return cached ? parseInt(cached) : 0;
  });
  const [purchases, setPurchases] = useState<any[]>(() => {
    const cached = localStorage.getItem('cached_purchases');
    return cached ? JSON.parse(cached) : [];
  });
  const [quests, setQuests] = useState<any[]>(() => {
    const cached = localStorage.getItem('cached_quests');
    return cached ? JSON.parse(cached) : [];
  });

  const [error, setError] = useState<string | null>(null);
  const [showLuxuryLoader, setShowLuxuryLoader] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboarding_completed'));
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  
  const [initFinished, setInitFinished] = useState(false);
  const [tokenReceived, setTokenReceived] = useState(false);
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Minimum delay for eye candy branding, then hide if data is ready
    const minTime = 1200;
    const startTime = Date.now();

    const startApp = async () => {
      await init(true);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);
      setTimeout(() => setShowLuxuryLoader(false), remaining);
    };

    startApp();
  }, []);

  const init = async (isStartup = false) => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user || { id: "12345", username: "MockUser", first_name: "Mock", last_name: "Account" };
    const initData = tg?.initData || "";

    if (!localStorage.getItem('cached_user')) {
        setTgUser(user);
    }

    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Step 1: Authentication (Primary)
      const authRes = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, tgUser: user }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!authRes.ok) {
          const errorData = await authRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${authRes.status}`);
      }
      
      const data = await authRes.json();
      
      if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
        setTokenReceived(true);
      } else {
        throw new Error('Не удалось получить токен доступа');
      }
      
      if (data.user) {
        const updatedUser = { ...user, ...data.user };
        setTgUser(updatedUser);
        setBalance(data.user.balance);
        setPurchases(data.purchases || []);
        setQuests(data.quests || []);
        
        // Cache
        localStorage.setItem('cached_user', JSON.stringify(updatedUser));
        localStorage.setItem('cached_balance', data.user.balance.toString());
        localStorage.setItem('cached_purchases', JSON.stringify(data.purchases || []));
        localStorage.setItem('cached_quests', JSON.stringify(data.quests || []));
        
        // Step 2: Parallel background fetches after auth is successful
        checkDailyBonus(user.id);
      }
      setInitFinished(true);
    } catch (e: any) {
      console.error('Init error:', e);
      setInitFinished(true); // Still finish to hide loader
      setTokenReceived(false);
      if (isStartup) {
        setError(e.name === 'AbortError' ? 'Сервер не отвечает.' : e.message);
      }
    }
  };

  const checkDailyBonus = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/bonus/daily-check/${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      const data = await res.json();
      if (data.canClaim) {
        setDailyStatus(data);
        setShowDailyModal(true); // Direct show daily if needed, or rely on other logic
      }
    } catch (e: any) {
      console.error('Check daily error:', e);
    }
  };

  const handleClaimDaily = async () => {
    if (!tgUser) return;
    setClaimingDaily(true);
    try {
      const res = await fetch(`${API_URL}/bonus/daily-claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: tgUser.telegram_id || tgUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setBalance((prev: number) => {
          const newVal = prev + data.reward;
          localStorage.setItem('cached_balance', newVal.toString());
          return newVal;
        });
        setShowDailyModal(false);
      }
    } catch (e: any) {
      console.error('Claim daily error:', e);
    } finally {
      setClaimingDaily(false);
    }
  };

  const updateBalance = (newVal: number | ((prev: number) => number)) => {
    setBalance(prev => {
      const updated = typeof newVal === 'function' ? newVal(prev) : newVal;
      localStorage.setItem('cached_balance', updated.toString());
      return updated;
    });
  };

  const updateTgUser = (newVal: any | ((prev: any) => any)) => {
    setTgUser((prev: any) => {
      const updated = typeof newVal === 'function' ? newVal(prev) : newVal;
      localStorage.setItem('cached_user', JSON.stringify(updated));
      return updated;
    });
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const props = { 
    userId: tgUser?.telegram_id || tgUser?.id, 
    balance, 
    setBalance: updateBalance, 
    tgUser,
    setTgUser: updateTgUser,
    purchases,
    setPurchases,
    quests,
    setQuests,
    dailyStatus,
    handleClaimDaily,
    claimingDaily
  };

  // Luxury Loader Component
  const LuxuryLoader = () => (
    <div className="luxury-loader-wrap">
      <div className="luxury-loader-bg" />
      <div className="luxury-loader-content">
        <div className="luxury-core">
           <div className="luxury-core-orbit" />
           <div className="luxury-core-inner" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="luxury-text">Синхронизация</div>
          <div className="luxury-progress-bar">
            <div className="luxury-progress-fill" />
          </div>
        </div>
      </div>
    </div>
  );

  // Onboarding Component
  const Onboarding = () => (
    <div className="onboarding-overlay">
      <div className="onboarding-bg" />
      
      {onboardingStep === 1 ? (
        <div className="onboarding-card">
          <div className="onboarding-logo-wrap">
            <div className="onboarding-logo">
              <div className="logo-text-gradient">YourTurn</div>
            </div>
            <p className="onboarding-bio">
              Ваш путь в мир элитного азарта и крупных выигрышей 🎰. Зарабатывайте банкролл 💰, играйте в захватывающие игры 🃏 и обменивайте выигрыши на реальные призы ✨.
            </p>
          </div>
          
          <div className="onboarding-actions">
            <button className="btn-primary" style={{ width: '100%', height: '60px' }} onClick={completeOnboarding}>
              Начать игру
            </button>
            <button className="btn-secondary-luxury" onClick={() => setOnboardingStep(2)}>
              О нашем казино
            </button>
          </div>
        </div>
      ) : (
        <div className="onboarding-card">
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>Элитная Платформа YourTurn</h2>
          <div className="onboarding-info-scroll">
            <h3>Что это за приложение?</h3>
            <p>YourTurn — это инновационная игровая платформа, превращающая вашу удачу и активность в реальные гаджеты и призы.</p>
            
            <h3>Как оно работает?</h3>
            <p>Вы пополняете свой банкролл: смотрите рекламу или посещаете сайты партнеров. За это вы мгновенно получаете виртуальные доллары и статус (XP).</p>
            
            <h3>В чем уникальность?</h3>
            <p>Заработанные средства можно потратить в нашем VIP-магазине на <b>реальные товары и гаджеты</b>. Выберите iPhone 15 Pro, PlayStation 5 или другие призы, и мы организуем доставку!</p>
            
            <h3>Основные возможности:</h3>
            <ul>
              <li>Пополнение счета на просмотре рекламы — до $0.35 за ролик.</li>
              <li>Сёрфинг сайтов — быстрые монеты и повышение LVL.</li>
              <li><b>VIP-Магазин</b> — покупайте реальные вещи за свой выигрыш.</li>
              <li><b>10 Премиум-Игр</b> — Слоты, Краш, Блэкджек и многое другое для вашего азарта.</li>
              <li>Ежедневные квесты — выполняйте задания и получайте бонусы.</li>
              <li>Мировой рейтинг — станьте Хайроллером №1 в казино.</li>
            </ul>
          </div>
          
          <button className="btn-primary" style={{ width: '100%', height: '60px' }} onClick={completeOnboarding}>
            Вход в Казино
          </button>
        </div>
      )}
    </div>
  );

  if (showOnboarding) return <Onboarding />;
  if (showLuxuryLoader) return <LuxuryLoader />;


  if ((error && !tgUser) && initFinished) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '0 40px' }}>
      <h2 style={{ marginBottom: '8px' }}>Ошибка входа</h2>
      <p style={{ opacity: 0.7, marginBottom: '16px' }}>{error}</p>
      <button className="btn-primary" style={{ width: '200px' }} onClick={() => { setInitFinished(false); setShowLuxuryLoader(true); init(true); }}>
        Попробовать снова
      </button>
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
          <Route path="games" element={<Games {...props} />} />
          <Route path="games/:gameId" element={<GamePage {...props} />} />
          <Route path="news" element={<News />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>

      <DailyBonusModal 
        isOpen={showDailyModal}
        onClaim={handleClaimDaily}
        streak={dailyStatus?.currentStreak || 0}
        reward={dailyStatus?.nextReward || 0}
        loading={claimingDaily}
      />
    </>
  );
}

export default App;
