import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Tag, 
  DollarSign, 
  Zap,
  Check,
  X
} from 'lucide-react';

const BRAND_LIST = [
  { id: 'brand4', name: 'Xiaomi', price: 1500, image: '/brands/xiaomi.png?v=3' },
  { id: 'brand8', name: 'Xbox', price: 4200, image: '/brands/xbox.png?v=3' },
  { id: 'brand3', name: 'Samsung', price: 5800, image: '/brands/samsung.png?v=3' },
  { id: 'brand6', name: 'Epic Games', price: 7900, image: '/brands/epicgames.png?v=3' },
  { id: 'brand5', name: 'Netflix', price: 9800, image: '/brands/netflix.png?v=3' },
  { id: 'brand7', name: 'Steam', price: 12400, image: '/brands/steam.png?v=3' },
  { id: 'brand2', name: 'Nvidia', price: 14200, image: '/brands/nvidia.png?v=3' },
  { id: 'brand1', name: 'Apple', price: 16500, image: '/brands/apple.png?v=3' },
];

const NFTCard = ({ nft, changeVal, isPositive, onBuy, onSell, buying, selling, userId, balance }: any) => {
  const currentPrice = Math.round(nft.price * (1 + changeVal / 100));
  const displayCurrentPrice = (currentPrice / 100).toFixed(2);
  const canAfford = balance >= currentPrice;

  return (
    <div className="glass-panel" style={{ 
      padding: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '24px',
      border: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
      background: 'rgba(15, 15, 20, 0.8)',
      backdropFilter: 'blur(10px)',
      boxShadow: isPositive ? '0 10px 30px rgba(34, 197, 94, 0.05)' : '0 10px 30px rgba(239, 68, 68, 0.05)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{nft.id}</span>
          <div style={{ 
            background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            padding: '4px 8px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
             {isPositive ? <TrendingUp size={10} color="#22c55e" /> : <TrendingDown size={10} color="#ef4444" />}
             <span style={{ fontSize: '10px', fontWeight: '900', color: isPositive ? '#22c55e' : '#ef4444' }}>
               {isPositive ? '+' : ''}{changeVal.toFixed(1)}%
             </span>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '8px 0 20px 0',
          position: 'relative'
        }}>
          {/* PREMIUM WHITE LOGO CONTAINER */}
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: '#ffffff', 
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
            zIndex: 1,
            position: 'relative'
          }}>
            <img 
              src={nft.image} 
              alt={nft.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }} 
            />
          </div>
          <div style={{ 
            position: 'absolute', 
            width: '80px', 
            height: '80px', 
            background: isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)', 
            filter: 'blur(40px)', 
            borderRadius: '50%',
            bottom: '0',
            zIndex: 0
          }}></div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>{nft.name}</div>
          <div 
            style={{ 
              fontSize: '22px', 
              fontWeight: '900', 
              color: 'white', 
              textShadow: '0 0 15px rgba(255,255,255,0.1)'
            }}
          >
            ${displayCurrentPrice}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button 
            id={`buy-${nft.id}`}
            onClick={() => onBuy({ ...nft, price: currentPrice })}
            disabled={buying === nft.id || !userId || !canAfford}
            style={{ 
              flex: 1, 
              height: '38px', 
              borderRadius: '12px', 
              background: canAfford ? 'white' : 'rgba(255,255,255,0.05)', 
              border: 'none',
              color: canAfford ? 'black' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '900',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: canAfford ? '0 4px 12px rgba(255,255,255,0.2)' : 'none'
            }}
          >
            {buying === nft.id ? '...' : <><ShoppingCart size={13} />КУПИТЬ</>}
          </button>
          <button style={{ 
            width: '44px',
            height: '38px', 
            borderRadius: '12px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: selling === nft.id ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }} onClick={() => onSell({ ...nft, price: currentPrice })} disabled={selling === nft.id}>
            {selling === nft.id ? '...' : <Tag size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const Promotions = ({ userId, balance, setBalance }: any) => {
  const [stockMultiplier, setStockMultiplier] = useState(1.0);
  const [variance, setVariance] = useState<Record<string, number>>({});

  const [buying, setBuying] = useState<string | null>(null);
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    // Initial random variance
    setVariance({
        brand1: (Math.random() - 0.5) * 2,
        brand2: (Math.random() - 0.5) * 2,
        brand3: (Math.random() - 0.5) * 2,
        brand4: (Math.random() - 0.5) * 2,
        brand5: (Math.random() - 0.5) * 2,
        brand6: (Math.random() - 0.5) * 2,
        brand7: (Math.random() - 0.5) * 2,
        brand8: (Math.random() - 0.5) * 2,
    });

    const fetchStatus = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_URL}/user/stocks`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
          }
        });
        const data = await res.json();
        if (data.multiplier !== undefined) {
          setStockMultiplier(data.multiplier);
        }
      } catch { /* silent */ }
    };
    fetchStatus();
    
    // Fast interval for organic live market fluctuation
    const interval = setInterval(() => {
      setVariance(prev => {
        const next: Record<string, number> = {};
        BRAND_LIST.forEach(nft => {
          const oldVar = prev[nft.id] || 0;
          let delta = (Math.random() - 0.5) * 0.8; // subtle changes
          let newVal = oldVar + delta;
          if (newVal > 2.0) newVal = 2.0;
          if (newVal < -2.0) newVal = -2.0;
          next[nft.id] = newVal;
        });
        return next;
      });
    }, 2000);

    // Slower interval (15s) to sync overall multiplier with backend 
    const backendInterval = setInterval(() => fetchStatus(), 15000);

    return () => {
      clearInterval(interval);
      clearInterval(backendInterval);
    };
  }, [userId]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBuy = async (nft: any) => {
    if (!userId) return showToast('error', 'Войдите в систему');
    if (balance < nft.price) return showToast('error', 'Недостаточно средств');
    setBuying(nft.id);
    try {
      const res = await fetch(`${API_URL}/nft/buy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: userId, nftId: nft.id, name: nft.name, price: nft.price })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBalance(data.newBalance);
        showToast('success', `${nft.name} куплено! -$${(nft.price / 100).toFixed(2)}`);
      } else {
        showToast('error', data.error || 'Ошибка при покупке');
      }
    } catch {
      showToast('error', 'Ошибка сети');
    } finally {
      setBuying(null);
    }
  };

  const handleSell = async (nft: any) => {
    if (!userId) return showToast('error', 'Войдите в систему');
    setSelling(nft.id);
    try {
      const res = await fetch(`${API_URL}/nft/sell`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: userId, nftId: nft.id, price: nft.price })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBalance(data.newBalance);
        showToast('success', `${nft.name} продано! +$${(nft.price / 100).toFixed(2)}`);
      } else {
        showToast('error', data.error || 'Ошибка при продаже');
      }
    } catch {
      showToast('error', 'Ошибка сети');
    } finally {
      setSelling(null);
    }
  };

  const getChange = (index: number) => {
    const nftId = `brand${index + 1}`;
    const baseVal = (stockMultiplier - 1.0) * 100;
    const val = baseVal + (variance[nftId] || 0);
    return { val, isPositive: val >= 0 };
  };

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white', padding: '12px 20px', borderRadius: '14px', fontSize: '13px',
          fontWeight: '700', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '320px',
          animation: 'slideDown 0.3s ease'
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Акции</h1>
        </div>
        <div style={{ 
          background: 'var(--primary-glow)', 
          padding: '10px', 
          borderRadius: '15px', 
          border: '1px solid var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={18} color="var(--primary-color)" />
          <span style={{ fontWeight: '900', fontSize: '14px' }}>LIVE</span>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', 
            background: 'var(--success-color)',
            boxShadow: '0 0 8px var(--success-color)',
            animation: 'livePulse 1.2s ease-in-out infinite'
          }} />
        </div>
      </div>



      {/* Balance info */}
      {userId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px', fontWeight: '800' }}>
          <DollarSign size={14} color="var(--gold-color)" />
          <span>Ваш баланс: <strong style={{ color: 'var(--gold-color)' }}>${((balance || 0) / 100).toFixed(2)}</strong></span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        paddingBottom: '40px'
      }}>
        {BRAND_LIST.map((nft, i) => {
          const ch = getChange(i);
          return (
            <NFTCard 
              key={nft.id} 
              nft={nft}
              changeVal={ch.val}
              isPositive={ch.isPositive}
              onBuy={handleBuy}
              onSell={handleSell}
              buying={buying}
              selling={selling}
              userId={userId}
              balance={balance}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .price-flash {
          animation: priceFlash 0.6s ease;
        }
        .pct-flash-green {
          animation: pctFlashGreen 0.6s ease;
        }
        .pct-flash-red {
          animation: pctFlashRed 0.6s ease;
        }
        @keyframes priceFlash {
          0% { color: white; }
          30% { color: #facc15; text-shadow: 0 0 14px #facc15; }
          100% { color: white; }
        }
        @keyframes pctFlashGreen {
          0% { opacity: 1; }
          30% { opacity: 0.4; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pctFlashRed {
          0% { opacity: 1; }
          30% { opacity: 0.4; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Promotions;
