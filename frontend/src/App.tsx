import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Start from './pages/Start';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Top from './pages/Top';
import Bonuses from './pages/Bonuses';
import Admin from './pages/Admin';
import Promotions from './pages/Promotions';
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
  const [myNfts, setMyNfts] = useState<any[]>(() => {
    const cached = localStorage.getItem('cached_nfts');
    return cached ? JSON.parse(cached) : [];
  });

  const [error, setError] = useState<string | null>(null);
  const [showLuxuryLoader, setShowLuxuryLoader] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboarding_completed'));
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [isBot, setIsBot] = useState(false);
  
  useEffect(() => {
    // Basic Client-Side Bot Check
    if (navigator.webdriver) {
      setIsBot(true);
      console.warn('Bot detected by navigator.webdriver');
    }

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

    // Minimum 3.5s Luxury Loader (only if onboarded)
    const loaderTimer = setTimeout(() => {
        setShowLuxuryLoader(false);
    }, 3500);

    // Initial load: Auth once on mount
    init(true);

    return () => clearTimeout(loaderTimer);
  }, []);

  const location = useLocation();
  useEffect(() => {
    // Refresh data on every navigation transition
    init(false);
  }, [location.pathname]);

  const init = async (isStartup = false) => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user || { id: "12345", username: "MockUser", first_name: "Mock", last_name: "Account" };
    const initData = tg?.initData || "";

    // Optimistically set user from TG if cache is empty
    if (!localStorage.getItem('cached_user')) {
        setTgUser(user);
    }

    // isStartup loading handled by LuxuryLoader logic
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
      
      if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
      }
      
      if (data.user) {
        const updatedUser = { ...user, ...data.user };
        setTgUser(updatedUser);
        setBalance(data.user.balance);
        setPurchases(data.purchases || []);
        setMyNfts(data.nfts || []);
        
        // Cache everything
        localStorage.setItem('cached_user', JSON.stringify(updatedUser));
        localStorage.setItem('cached_balance', data.user.balance.toString());
        localStorage.setItem('cached_purchases', JSON.stringify(data.purchases || []));
        localStorage.setItem('cached_nfts', JSON.stringify(data.nfts || []));
        
        checkDailyBonus(user.id);
      }
    } catch (e: any) {
      console.error('Init error:', e);
      if (isStartup) {
        setError(e.name === 'AbortError' ? 'Сервер не отвечает. Проверьте интернет.' : e.message);
      }
    } finally {
      // isStartup loading handled by LuxuryLoader logic
    }
  };

  const checkDailyBonus = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/bonus/daily-status/${userId}`);
      const data = await res.json();
      if (data.canClaim) {
        setDailyStatus(data);
        setShowDailyModal(true); // Direct show daily if needed, or rely on other logic
      }
    } catch (e) {
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
    } catch (e) {
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
    myNfts,
    setMyNfts,
    dailyStatus,
    handleClaimDaily,
    claimingDaily
  };

  // Luxury Loader Component
  const LuxuryLoader = () => (
    <div className="luxury-loader-wrap">
      <div className="luxury-loader-bg" />
      <div className="luxury-loader-content">
        <div className="luxury-logo-pulse">
           <img src="/logo_main.png" alt="YourTurn Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="luxury-text">Synchronizing</div>
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
              <img src="/logo_main.png" alt="YourTurn Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '40px' }} />
            </div>
            <p className="onboarding-bio">
              Ваш путь в мир цифровых инвестиций и бонусов 🚀. Зарабатывайте бонусы 💰, покупайте акции мировых брендов 📈 и развивайте свой профиль ✨.
            </p>
          </div>
          
          <div className="onboarding-actions">
            <button className="btn-primary" style={{ width: '100%', height: '60px' }} onClick={completeOnboarding}>
              Продолжить
            </button>
            <button className="btn-secondary-luxury" onClick={() => setOnboardingStep(2)}>
              Прочитать про приложение
            </button>
          </div>
        </div>
      ) : (
        <div className="onboarding-card">
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>О приложении</h2>
          <div className="onboarding-info-scroll">
            <h3>Что это за приложение?</h3>
            <p>YourTurn — это инновационная платформа, которая превращает ваше время в реальные бонусы и цифровые активы.</p>
            
            <h3>Как оно работает?</h3>
            <p>Вы выполняете простые действия: смотрите рекламные ролики или посещаете сайты партнеров. За это вы мгновенно получаете виртуальные доллары и XP (опыт).</p>
            
            <h3>В чем смысл?</h3>
            <p>Мы создали простую экономику, где ваше внимание имеет ценность. Чем больше вы активны, тем выше ваш уровень и тем больше возможностей открывается в магазине.</p>
            
            <h3>Основные возможности:</h3>
            <ul>
              <li>Заработок $ на просмотре рекламы — до $0.35 за ролик.</li>
              <li>Сёрфинг сайтов — быстрый заработок и опыт.</li>
              <li>Магазин предметов — покупайте уникальные товары за свой баланс.</li>
              <li>Акции брендов — инвестируйте в доли крупнейших компаний.</li>
              <li>Глобальный рейтинг — соревнуйтесь с другими игроками за топ.</li>
            </ul>
          </div>
          
          <button className="btn-primary" style={{ width: '100%', height: '60px' }} onClick={completeOnboarding}>
            Понятно, начать игру
          </button>
        </div>
      )}
    </div>
  );

  if (showOnboarding) return <Onboarding />;
  if (showLuxuryLoader) return <LuxuryLoader />;

  if (isBot) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}>
      <h2 style={{ color: 'var(--danger-color)' }}>Доступ ограничен</h2>
      <p>Использование ботов и средств автоматизации запрещено. Пожалуйста, используйте официальное приложение Telegram.</p>
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
          <Route path="promotions" element={<Promotions {...props} />} />
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
