import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, PlayCircle, CheckCircle, Trophy, Sparkles, Gem, Zap, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const t = setInterval(() => setCooldownTime(prev => prev <= 1 ? 0 : prev - 1), 1000);
    return () => clearInterval(t);
  }, [cooldownTime]);

  useEffect(() => {
    if (surfCooldownTime <= 0) return;
    const t = setInterval(() => setSurfCooldownTime(prev => prev <= 1 ? 0 : prev - 1), 1000);
    return () => clearInterval(t);
  }, [surfCooldownTime]);

  const handleWatchAd = async () => {
    if (!userId) { setAdMessage('⚠️ Пожалуйста, войдите в систему.'); return; }
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
      if (data.success || data.balance !== undefined) {
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setAdMessage('💎 Награда +$0.35 получена!');
        setCooldownTime(30);
        setAdState('done');
      } else {
        setAdMessage('⚠️ ' + (data.error || 'Ошибка начисления'));
        setAdState('done');
      }
    } catch (e: any) {
      setAdMessage('⚠️ Ошибка сети');
      setAdState('done');
    }
    setTimeout(() => setAdState('idle'), 3000);
  };

  const handleSurfAd = async () => {
    if (!userId) { setAdMessage('⚠️ Пожалуйста, войдите в систему.'); return; }
    if (surfCooldownTime > 0) return;
    setAdState('watching');
    setSurfCountdown(5);
    const t = setInterval(() => {
      setSurfCountdown(prev => {
        if (prev <= 1) { clearInterval(t); finishSurf(); return 0; }
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
        setBalance(data.balance !== undefined ? data.balance : data.newBalance);
        if (setTgUser) setTgUser((prev: any) => ({ ...prev, ...data }));
        setAdMessage('🚀 Сёрфинг пройден! +$0.10');
        setSurfCooldownTime(5);
        setAdState('done');
      } else {
        setAdMessage('⚠️ Ошибка начисления');
        setAdState('done');
      }
    } catch (e: any) {
      setAdMessage('⚠️ Ошибка сети');
      setAdState('done');
    }
    setTimeout(() => setAdState('idle'), 3000);
  };

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      
      {/* Premium Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '20px' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ position: 'relative', display: 'inline-block' }}
          >
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', background: 'var(--gold-glow)', filter: 'blur(50px)', opacity: 0.2, zIndex: 0 }} />
              <h1 style={{ fontSize: '42px', fontWeight: '950', letterSpacing: '-1px', margin: 0, position: 'relative', zIndex: 1, background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  RINGO <span style={{ color: 'var(--gold-color)', WebkitTextFillColor: 'var(--gold-color)' }}>CASINO</span>
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--gold-color)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px', marginTop: '-4px' }}>Elite Gaming Experience</p>
          </motion.div>
      </div>

      <div className="balance-card" style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #a855f7 100%)',
        boxShadow: '0 15px 35px rgba(168, 85, 247, 0.25), inset 0 0 20px rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '28px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', marginBottom: '4px' }}>Ваш капитал</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '950', color: '#fff' }}>${(balance / 100).toFixed(2)}</span>
              </div>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={28} color="#fff" />
            </div>
        </div>
      </div>

      {/* Main Action Panel */}
      <div className="glass-panel" style={{
        marginTop: '24px',
        padding: '30px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <AnimatePresence mode="wait">
          {adState === 'idle' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                      <Zap size={20} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase' }}>Уровень</div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>{tgUser?.level || 1} LVL</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                      <Trophy size={20} color="var(--gold-color)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase' }}>Побед</div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>{tgUser?.total_bets_count || 0}</div>
                  </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Бонус за активность</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Смотри видео и посещай сайты для пополнения банкролла.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    className="btn-primary"
                    disabled={cooldownTime > 0}
                    onClick={handleWatchAd}
                    style={{ height: '64px', borderRadius: '20px', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <PlayCircle size={20} />
                    {cooldownTime > 0 ? `Подождите ${cooldownTime}с` : 'Смотреть рекламу (+$0.35)'}
                  </button>

                  <button
                    onClick={handleSurfAd}
                    disabled={surfCooldownTime > 0}
                    style={{ 
                        height: '64px', borderRadius: '20px', fontSize: '16px', fontWeight: '900',
                        background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                    }}
                  >
                    {surfCooldownTime > 0 ? `Сёрфинг через ${surfCooldownTime}с` : 'Быстрый сёрфинг (+$0.10)'}
                  </button>
              </div>
            </motion.div>
          ) : adState === 'loading' ? (
              <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px' }} />
                  <p style={{ fontWeight: '800' }}>Начисление награды...</p>
              </div>
          ) : adState === 'done' ? (
              <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: adMessage.includes('⚠️') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {adMessage.includes('⚠️') ? <AlertCircle color="#ef4444" size={32} /> : <CheckCircle color="#10b981" size={32} />}
                  </div>
                  <p style={{ fontWeight: '950', fontSize: '18px', textAlign: 'center' }}>{adMessage}</p>
              </div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Rewards Info Section */}
      <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '2px', height: '20px', background: 'var(--gold-color)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1px' }}>Твой путь к Джекпоту</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: <Sparkles size={18} color="var(--gold-color)" />, title: 'Играй и выигрывай', desc: 'Проверь свою удачу в Слотах, Краше или Картах. Огромные множители ждут тебя!' },
                { icon: <Gem size={18} color="var(--primary-color)" />, title: 'Реальные призы', desc: 'Обменивай выигранные доллары на iPhone 15 Pro, PS5 и другие гаджеты в Магазине.' },
                { icon: <Trophy size={18} color="var(--success-color)" />, title: 'Система уровней', desc: 'Повышай LVL делая ставки. Чем выше уровень, тем круче ежедневные бонусы!' }
              ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                      <div>
                          <div style={{ fontWeight: '900', fontSize: '15px', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>{item.desc}</div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Fullscreen Surfing Ad Overlay */}
      {adState === 'watching' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000',
          zIndex: 99999,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)',
            padding: '10px 20px', borderRadius: '24px',
            display: 'flex', alignItems: 'center', gap: '12px', zIndex: 100000,
            border: '1px solid var(--gold-glow)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '950', color: 'var(--gold-color)' }}>
              {surfCountdown > 0 ? surfCountdown : '✓'}
            </div>
            <div style={{ height: '15px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontWeight: '900', fontSize: '13px', color: 'white' }}>{surfCountdown > 0 ? 'Генерация награды...' : 'Готово!'}</span>
          </div>
          <iframe 
            src={`https://11745.xml.4armn.com/direct-link?pubid=1006513&siteid=${userId || ''}`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      )}      
    </div>
  );
};

export default Start;
