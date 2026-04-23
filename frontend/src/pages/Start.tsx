import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle, Trophy, Sparkles, Gem, Zap, AlertCircle, TrendingUp, Star } from 'lucide-react';
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
    const t = setInterval(() => setCooldownTime((prev: number) => prev <= 1 ? 0 : prev - 1), 1000);
    return () => clearInterval(t);
  }, [cooldownTime]);

  useEffect(() => {
    if (surfCooldownTime <= 0) return;
    const t = setInterval(() => setSurfCooldownTime((prev: number) => prev <= 1 ? 0 : prev - 1), 1000);
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
    } catch {
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
      setSurfCountdown((prev: number) => {
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
    } catch {
      setAdMessage('⚠️ Ошибка сети');
      setAdState('done');
    }
    setTimeout(() => setAdState('idle'), 3000);
  };

  const displayBalance = (balance / 100).toFixed(2);

  return (
    <div className="page" style={{ paddingBottom: '120px', paddingTop: '12px' }}>

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}
      >
        {/* ambient glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px', height: '120px',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.25) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* badge */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(168,85,247,0.12)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: '999px',
            padding: '5px 14px',
            fontSize: '11px', fontWeight: '800',
            color: 'rgba(168,85,247,1)',
            textTransform: 'uppercase', letterSpacing: '2px',
            marginBottom: '14px',
            position: 'relative', zIndex: 1
          }}
        >
          <Star size={11} fill="currentColor" /> Elite Gaming Platform
        </motion.div>

        {/* main title */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '52px',
            fontWeight: '950',
            letterSpacing: '-2px',
            lineHeight: 1,
            margin: '0 0 6px 0',
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Your<span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 60%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Turn</span>
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            marginBottom: 0
          }}>
            Make your move
          </p>
        </div>
      </motion.div>

      {/* ── COMPACT BANK CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          position: 'relative',
          borderRadius: '24px',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
          marginBottom: '20px',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #161625 0%, #0a0a0f 100%)',
          borderRadius: '23px',
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '170px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Subtle Glows */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
          
          {/* Top Row: Mini Chip & Level */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '22px', background: 'linear-gradient(135deg, #d4af37, #f5d76e)', borderRadius: '4px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.1)' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>YourTurn Platinum</span>
            </div>
            
            <div style={{ 
              background: 'rgba(168,85,247,0.1)', 
              padding: '4px 10px', 
              borderRadius: '8px', 
              border: '1px solid rgba(168,85,247,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp size={10} color="#a855f7" />
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#a855f7' }}>LVL {tgUser?.level || 1}</span>
            </div>
          </div>

          {/* Middle: Prominent Balance */}
          <div style={{ zIndex: 2, margin: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--gold-color)', opacity: 0.8 }}>$</span>
              <motion.span
                key={displayBalance}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '40px', fontWeight: '950', color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}
              >
                {displayBalance}
              </motion.span>
            </div>
          </div>

          {/* Bottom: Info Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
            <div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '14px', 
                color: 'rgba(255,255,255,0.4)', 
                letterSpacing: '2px',
                marginBottom: '4px'
              }}>
                **** {(tgUser?.telegram_id || tgUser?.id || '0000').toString().slice(-4)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', opacity: 0.9 }}>
                {tgUser?.first_name || 'USER'}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', opacity: 0.5 }}>
               <div style={{ fontSize: '11px', fontWeight: '900' }}>#{tgUser?.telegram_id || tgUser?.id || '00000'}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── EARN SECTION ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        style={{
          borderRadius: '28px',
          padding: '24px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* background shimmer line */}
        <div style={{
          position: 'absolute', top: 0, left: '-100%', width: '60%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)',
          animation: 'shimmerLine 4s linear infinite'
        }} />

        <AnimatePresence mode="wait">
          {adState === 'idle' ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Zap size={16} color="#a855f7" fill="#a855f7" />
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '900', lineHeight: 1 }}>Бонус за активность</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Пополни банкролл за несколько секунд</div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '18px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Watch Ad button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWatchAd}
                  disabled={cooldownTime > 0}
                  style={{
                    width: '100%', height: '62px', borderRadius: '18px',
                    background: cooldownTime > 0
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    border: cooldownTime > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: '#fff', fontSize: '15px', fontWeight: '900',
                    cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px',
                    boxShadow: cooldownTime > 0 ? 'none' : '0 10px 30px rgba(168,85,247,0.35)',
                    transition: 'all 0.3s ease',
                    opacity: cooldownTime > 0 ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PlayCircle size={20} />
                    <span>{cooldownTime > 0 ? `Подождите ${cooldownTime}с` : 'Смотреть рекламу'}</span>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)', borderRadius: '10px',
                    padding: '4px 10px', fontSize: '13px', fontWeight: '900'
                  }}>
                    +$0.35
                  </div>
                </motion.button>

                {/* Surf button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSurfAd}
                  disabled={surfCooldownTime > 0}
                  style={{
                    width: '100%', height: '62px', borderRadius: '18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: '15px', fontWeight: '900',
                    cursor: surfCooldownTime > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px',
                    opacity: surfCooldownTime > 0 ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🌊</span>
                    <span>{surfCooldownTime > 0 ? `Сёрфинг через ${surfCooldownTime}с` : 'Быстрый сёрфинг'}</span>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.07)', borderRadius: '10px',
                    padding: '4px 10px', fontSize: '13px', fontWeight: '900',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    +$0.10
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : adState === 'loading' ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
            >
              <div style={{
                width: '56px', height: '56px', position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  border: '3px solid rgba(168,85,247,0.15)',
                  borderTop: '3px solid #a855f7',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <div style={{
                  position: 'absolute', inset: '8px',
                  border: '2px solid rgba(99,102,241,0.2)',
                  borderBottom: '2px solid #6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1.2s linear infinite reverse'
                }} />
              </div>
              <p style={{ fontWeight: '800', fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: 0 }}>
                Начисление награды...
              </p>
            </motion.div>
          ) : adState === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: adMessage.includes('⚠️') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `2px solid ${adMessage.includes('⚠️') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {adMessage.includes('⚠️')
                  ? <AlertCircle color="#ef4444" size={34} />
                  : <CheckCircle color="#10b981" size={34} />
                }
              </motion.div>
              <p style={{ fontWeight: '950', fontSize: '17px', textAlign: 'center', marginBottom: 0 }}>{adMessage}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* ── FEATURES ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>
            Почему YourTurn?
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              icon: <Sparkles size={20} />,
              gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              glow: 'rgba(245,158,11,0.15)',
              border: 'rgba(245,158,11,0.15)',
              title: 'Играй и выигрывай',
              desc: 'Слоты, Краш, Рулетка — огромные множители ждут тебя!',
            },
            {
              icon: <Gem size={20} />,
              gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
              glow: 'rgba(168,85,247,0.15)',
              border: 'rgba(168,85,247,0.15)',
              title: 'Реальные призы',
              desc: 'Меняй доллары на iPhone, PS5 и другие гаджеты.',
            },
            {
              icon: <Trophy size={20} />,
              gradient: 'linear-gradient(135deg, #10b981, #34d399)',
              glow: 'rgba(16,185,129,0.15)',
              border: 'rgba(16,185,129,0.15)',
              title: 'Система уровней',
              desc: 'Повышай LVL ставками — выше уровень, круче бонусы!',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: item.glow, border: `1px solid ${item.border}`,
                padding: '16px 18px', borderRadius: '20px',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                background: item.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 8px 20px ${item.glow}`
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '15px', marginBottom: '3px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Surf AD OVERLAY ── */}
      {adState === 'watching' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 99999, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
            padding: '10px 20px', borderRadius: '24px',
            display: 'flex', alignItems: 'center', gap: '12px', zIndex: 100000,
            border: '1px solid rgba(168,85,247,0.3)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '950', color: '#a855f7' }}>
              {surfCountdown > 0 ? surfCountdown : '✓'}
            </div>
            <div style={{ height: '15px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontWeight: '900', fontSize: '13px', color: 'white' }}>
              {surfCountdown > 0 ? 'Генерация награды...' : 'Готово!'}
            </span>
          </div>
          <iframe
            src={`https://11745.xml.4armn.com/direct-link?pubid=1006513&siteid=${userId || ''}`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        </div>
      )}

      <style>{`
        @keyframes shimmerLine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default Start;
