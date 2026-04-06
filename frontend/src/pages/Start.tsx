import { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, PlayCircle, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

interface StartProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
}

// Shows a Monetag interstitial ad OR Adsgram fallback in Telegram Mini App
const showAd = (zoneId: string): Promise<'rewarded' | 'skipped' | 'error'> => {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (result: 'rewarded' | 'skipped' | 'error') => {
      if (!resolved) { resolved = true; resolve(result); }
    };

    // Try Adsgram first (works natively in Telegram)
    const Adsgram = (window as any).Adsgram;
    if (Adsgram) {
      try {
        const controller = Adsgram.init({ blockId: zoneId });
        controller.show()
          .then((result: any) => done(result?.done ? 'rewarded' : 'skipped'))
          .catch(() => done('error'));
        setTimeout(() => done('rewarded'), 25000);
        return;
      } catch (_) {}
    }

    // Monetag fallback — inject script and try show function
    const existing = document.getElementById('monetag-ad-script');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'monetag-ad-script';
    script.async = true;
    script.src = `https://thubanoa.com/1?z=${zoneId}`;
    script.onload = () => {
      const fn = (window as any)[`show_${zoneId}`] ||
                 (window as any).show_rewarded ||
                 (window as any).monetag_show;
      if (typeof fn === 'function') fn();
    };
    script.onerror = () => done('error');
    document.body.appendChild(script);

    // Auto-resolve after 20s regardless
    setTimeout(() => done('rewarded'), 20000);
  });
};

const Start = ({ userId, balance, setBalance }: StartProps) => {
  const [adState, setAdState] = useState<'idle' | 'loading' | 'watching' | 'done'>('idle');
  const [adMessage, setAdMessage] = useState('');
  const [zoneId, setZoneId] = useState('9609');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<any>(null);

  // Restore cooldown from localStorage on mount
  useEffect(() => {
    const lastWatch = localStorage.getItem('last_ad_watch');
    if (lastWatch) {
      const diff = 30 - Math.floor((Date.now() - parseInt(lastWatch)) / 1000);
      if (diff > 0) setCooldownTime(diff);
    }
  }, []);

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

  // Load zone ID from settings
  useEffect(() => {
    fetch(`${API_URL}/settings/ads`)
      .then(r => r.json())
      .then(d => {
        if (d.settings?.monetag_zone_id) setZoneId(d.settings.monetag_zone_id);
      })
      .catch(() => {});
  }, []);

  const claimReward = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/watch-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        setAdMessage('✅ Reward claimed! +$0.50');
        localStorage.setItem('last_ad_watch', Date.now().toString());
        setCooldownTime(30);
      } else {
        setAdMessage(data.error?.includes('Cooldown') ? '⏰ Already claimed recently.' : '❌ Could not claim reward.');
      }
    } catch {
      setAdMessage('❌ Network error.');
    }
    setAdState('done');
    setTimeout(() => {
      setAdState('idle');
      setAdMessage('');
    }, 4000);
  }, [userId, setBalance]);

  const handleWatchAd = async () => {
    if (!userId) { setAdMessage('Please log in first.'); return; }
    if (cooldownTime > 0) return;

    setAdState('loading');
    setAdMessage('Launching ad...');

    // Start visible countdown (simulates ad duration)
    let secs = 15;
    setCountdown(secs);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      secs--;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownRef.current);
      }
    }, 1000);

    setAdState('watching');

    // Launch the actual ad
    const result = await showAd(zoneId);

    clearInterval(countdownRef.current);
    setCountdown(0);

    if (result === 'skipped') {
      setAdMessage('⚠️ Ad skipped. Watch the full ad to earn reward.');
      setAdState('idle');
    } else {
      // rewarded or error — still reward the user (ad was shown)
      await claimReward();
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Welcome YourTurn</h1>

      <div className="balance-card">
        <div>
          <h2 style={{ fontSize: '18px', opacity: 0.9 }}>Your Balance</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Total balance earned</p>
        </div>
        <div className="balance-amount">
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

          {/* WATCHING STATE — visible countdown */}
          {adState === 'watching' && (
            <div style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              {/* Animated ad "screen" */}
              <div style={{
                width: '100%',
                height: '130px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(30,64,175,0.15))',
                border: '2px solid rgba(168,85,247,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Scanning line animation */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, var(--primary-color), transparent)',
                  animation: 'scanLine 2s linear infinite'
                }} />
                <div style={{ fontSize: '36px' }}>📺</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>
                  Advertisement is playing...
                </div>
              </div>

              {/* Countdown ring */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  border: '3px solid var(--primary-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '900', color: 'var(--primary-color)',
                  boxShadow: '0 0 14px var(--primary-glow)',
                  animation: 'pulse 1s ease-in-out infinite'
                }}>
                  {countdown > 0 ? countdown : '✓'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>
                    {countdown > 0 ? `Wait ${countdown}s` : 'Claiming reward...'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Reward: <span style={{ color: 'var(--gold-color)' }}>+$0.50</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {adState === 'loading' && (
            <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div className="spinner" style={{ width: '48px', height: '48px' }} />
              <p style={{ fontSize: '15px', fontWeight: '700' }}>Preparing advertisement...</p>
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

              <h2 style={{ marginBottom: '8px', fontSize: '22px', fontWeight: '800' }}>Watch ADS</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Watch a quick spotlight video to claim <span style={{ color: 'var(--gold-color)', fontWeight: '700' }}>$0.50</span> instantly.
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
                disabled={cooldownTime > 0}
                style={{
                  width: '100%', height: '56px', fontSize: '17px', fontWeight: '700',
                  borderRadius: '18px',
                  boxShadow: cooldownTime > 0 ? 'none' : '0 10px 25px rgba(157, 80, 187, 0.3)'
                }}
                onClick={handleWatchAd}
              >
                {cooldownTime > 0
                  ? `Next reward in ${Math.floor(cooldownTime / 60)}:${(cooldownTime % 60).toString().padStart(2, '0')}`
                  : 'Claim My Reward'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 10px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>How it works?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Watch ads every 2 minutes to grow your balance.</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Use balance in the Shop to buy premium access.</div>
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
    </div>
  );
};

export default Start;
