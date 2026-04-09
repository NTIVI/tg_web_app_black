import { useState, useEffect } from 'react';
import { DollarSign, PlayCircle, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

interface StartProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
  tgUser: any;
  setTgUser: (newUser: any) => void;
}

const Start = ({ userId, balance, setBalance, tgUser, setTgUser }: StartProps) => {
  const [adState, setAdState] = useState<'idle' | 'loading' | 'watching' | 'done'>('idle');
  const [adMessage, setAdMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [surfCooldownTime, setSurfCooldownTime] = useState(0);
  const [surfCountdown, setSurfCountdown] = useState(0);

  // Restore cooldown from user data on mount/update
  useEffect(() => {
    if (tgUser?.last_ad_watch) {
      const lastWatch = new Date(tgUser.last_ad_watch + (tgUser.last_ad_watch.endsWith('Z') ? '' : 'Z')).getTime();
      const diff = 30 - Math.floor((Date.now() - lastWatch) / 1000);
      if (diff > 0) setCooldownTime(diff);
    }
    if (tgUser?.last_surf_watch) {
      const lastSurf = new Date(tgUser.last_surf_watch + (tgUser.last_surf_watch.endsWith('Z') ? '' : 'Z')).getTime();
      const diff = 5 - Math.floor((Date.now() - lastSurf) / 1000);
      if (diff > 0) setSurfCooldownTime(diff);
    }
  }, [tgUser]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownTime <= 0) return;
    const t = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownTime]);

  useEffect(() => {
    if (surfCooldownTime <= 0) return;
    const t = setInterval(() => {
      setSurfCooldownTime(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [surfCooldownTime]);

  // Load zone ID from settings (kept for admin reference, Adsgram uses hardcoded block ID)
  useEffect(() => {
    fetch(`${API_URL}/settings/ads`).catch(() => {});
  }, []);

  const handleWatchAd = async () => {
    if (!userId) { setAdMessage('Пожалуйста, войдите в систему.'); return; }
    if (cooldownTime > 0) return;

    setAdState('loading');
    try {
      const res = await fetch(`${API_URL}/watch-ad`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: userId }),
      });
      const data = await res.json();
      if (data.newBalance !== undefined) {
        setBalance(data.newBalance);
        if (setTgUser) {
          setTgUser((prev: any) => ({ ...prev, ...data }));
        }
        setAdMessage('✅ Награда получена! +$0.50');
        setCooldownTime(30);
        setAdState('done');
      } else {
        setAdMessage(data.error?.includes('Cooldown') ? '⏰ Подождите перед следующим просмотром.' : '❌ Ошибка начисления.');
        setAdState('done');
      }
    } catch {
      setAdMessage('❌ Ошибка сети.');
      setAdState('done');
    }
    setTimeout(() => setAdState('idle'), 3000);
  };


  const handleSurfAd = async () => {
    if (!userId) { setAdMessage('Пожалуйста, войдите в систему.'); return; }
    if (surfCooldownTime > 0) return;

    setAdState('watching');
    setSurfCountdown(5);

    const t = setInterval(() => {
      setSurfCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          finishSurf();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishSurf = async () => {
    setAdState('loading');
    try {
      const res = await fetch(`${API_URL}/surf-ad`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        if (setTgUser) {
          setTgUser((prev: any) => ({ ...prev, ...data }));
        }
        setAdMessage('✅ Сёрфинг пройден! +$0.10');
        setSurfCooldownTime(5);
        setAdState('done');
      } else {
        setAdMessage(data.error?.includes('Cooldown') ? '⏰ Подождите перед следующим сёрфингом.' : '❌ Ошибка начисления.');
        setAdState('done');
      }
    } catch {
      setAdMessage('❌ Ошибка сети.');
      setAdState('done');
    }
    setTimeout(() => setAdState('idle'), 3000);
  };

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Добро пожаловать</h1>

      <div className="balance-card" style={{
        background: 'linear-gradient(145deg, #1e40af, #a855f7)',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)',
        border: 'none',
        borderRadius: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '16px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Ваш баланс</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Заработано всего</p>
        </div>
        <div className="balance-amount" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)', color: '#fff' }}>
          <DollarSign size={28} />
          <span>{((balance || 0) / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="glass-panel" style={{
        textAlign: 'center',
        padding: '32px 24px',
        background: 'linear-gradient(180deg, rgba(30, 64, 175, 0.1) 0%, rgba(30, 30, 35, 0.05) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'var(--primary-glow)', filter: 'blur(40px)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* LOADING STATE */}
          {adState === 'loading' && (
            <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div className="spinner" style={{ width: '48px', height: '48px' }} />
              <p style={{ fontSize: '15px', fontWeight: '700' }}>Подготовка награды...</p>
            </div>
          )}

          {/* DONE STATE */}
          {adState === 'done' && (
            <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <CheckCircle style={{ color: 'var(--success-color)' }} size={64} />
              <p style={{ fontSize: '17px', fontWeight: '800', color: adMessage.includes('❌') ? 'var(--danger-color)' : 'var(--success-color)' }}>
                {adMessage}
              </p>
            </div>
          )}

          {/* IDLE STATE */}
          {adState === 'idle' && (
            <div>
              <div style={{
                width: '72px', height: '72px', borderRadius: '24px',
                background: 'linear-gradient(135deg, #1e40af, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 8px 16px rgba(157, 80, 187, 0.4)'
              }}>
                <PlayCircle size={36} color="white" />
              </div>

              <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: '800' }}>Смотреть рекламу</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Посмотри короткое видео и получи <span style={{ color: 'var(--gold-color)', fontWeight: '700' }}>$0.50</span> моментально.
              </p>

              {adMessage && (
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '12px', borderRadius: '16px', marginBottom: '20px',
                  color: adMessage.includes('❌') || adMessage.includes('⚠️') ? '#ff4b4b' : 'var(--success-color)',
                  fontSize: '14px', fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {adMessage}
                </div>
              )}

              <button
                className="btn-primary"
                style={{
                  width: '100%', height: '56px', fontSize: '17px', fontWeight: '700',
                  borderRadius: '18px',
                  boxShadow: '0 10px 25px rgba(157, 80, 187, 0.3)',
                  marginBottom: '16px'
                }}
                onClick={handleWatchAd}
              >
                Смотреть рекламу ($0.50)
              </button>

              <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: '800', marginTop: '24px' }}>Сёрфинг</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Посети сайт спонсора на 5 секунд и получи <span style={{ color: 'var(--gold-color)', fontWeight: '700' }}>$0.10</span> моментально. Опыт также начисляется!
              </p>

              <button
                className="btn-primary"
                disabled={surfCooldownTime > 0}
                style={{
                  width: '100%', height: '56px', fontSize: '17px', fontWeight: '700',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #1e40af, #a855f7)',
                  boxShadow: surfCooldownTime > 0 ? 'none' : '0 10px 25px rgba(157, 80, 187, 0.3)'
                }}
                onClick={handleSurfAd}
              >
                {surfCooldownTime > 0
                  ? `Сёрфинг ${Math.floor(surfCooldownTime / 60)}:${(surfCooldownTime % 60).toString().padStart(2, '0')}`
                  : 'Начать Сёрфинг ($0.10)'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary-color)' }}>Как это работает?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(30, 64, 175, 0.2)', border: '1px solid var(--primary-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>1</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Смотрите рекламу или сёрфите сайты спонсоров.</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(30, 64, 175, 0.2)', border: '1px solid var(--primary-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>2</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Зарабатывайте доллары и получайте очки опыта (XP).</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(30, 64, 175, 0.2)', border: '1px solid var(--primary-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>3</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Тратьте баланс в Магазине и на Акции брендов!</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 14px var(--primary-glow); }
          50% { transform: scale(1.08); box-shadow: 0 0 24px var(--primary-glow); }
        }
      `}</style>
      
      {/* WATCHING STATE — Fullscreen Iframe Ad with Floating Timer */}
      {adState === 'watching' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000',
          zIndex: 99999,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Top Bar with Timer */}
          <div style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            padding: '8px 16px', borderRadius: '20px',
            display: 'flex', alignItems: 'center', gap: '8px', zIndex: 100000,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: '2px solid var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)'
            }}>
              {surfCountdown > 0 ? surfCountdown : '✓'}
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'white' }}>
              {surfCountdown > 0 ? 'Ждите...' : 'Награда получена!'}
            </span>
          </div>
          
          {/* Embedded Ad */}
          <iframe 
            src={`https://11745.xml.4armn.com/direct-link?pubid=1006513&siteid=${userId || ''}`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
          />
        </div>
      )}      
    </div>
  );
};

export default Start;
