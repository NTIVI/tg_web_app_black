import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Tag, 
  Coins, 
  Layers,
  Zap,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

const NFT_LIST = [
  { id: 'nft1', name: 'NFT #1', price: 4750, displayPrice: '47.50', image: '/nfts/nft1.png' },
  { id: 'nft2', name: 'NFT #2', price: 3210, displayPrice: '32.10', image: '/nfts/nft2.png' },
  { id: 'nft3', name: 'NFT #3', price: 8900, displayPrice: '89.00', image: '/nfts/nft3.png' },
];

const NFTCard = ({ nft, change, isPositive, onBuy, buying, userId, balance }: any) => {
  const canAfford = balance >= nft.price;

  return (
    <div className="glass-panel" style={{ 
      padding: '16px', 
      aspectRatio: '1/1', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
      background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.9), rgba(10, 10, 15, 0.95))'
    }}>
      {/* Background Geometric Lines */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0, 
        opacity: 0.1,
        pointerEvents: 'none',
        background: 'linear-gradient(45deg, transparent 48%, var(--primary-color) 50%, transparent 52%), linear-gradient(-45deg, transparent 48%, var(--primary-color) 50%, transparent 52%)',
        backgroundSize: '30px 30px'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{nft.name}</span>
          <Layers size={14} color="var(--primary-color)" />
        </div>

        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '10px 0',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            width: '80%', 
            height: '80%', 
            background: 'var(--primary-glow)', 
            filter: 'blur(30px)', 
            borderRadius: '50%',
            opacity: 0.3
          }}></div>
          <img 
            src={nft.image} 
            alt={nft.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} 
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '2px' }}>
            ${nft.displayPrice}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {isPositive ? <TrendingUp size={14} color="var(--success-color)" /> : <TrendingDown size={14} color="var(--danger-color)" />}
            <span style={{ fontSize: '13px', fontWeight: '700', color: isPositive ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {change}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            id={`buy-${nft.id}`}
            onClick={() => onBuy(nft)}
            disabled={buying === nft.id || !userId || !canAfford}
            style={{ 
              flex: 1, 
              height: '36px', 
              borderRadius: '10px', 
              background: canAfford ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100,100,100,0.1)', 
              border: `1px solid ${canAfford ? 'var(--success-color)' : 'rgba(100,100,100,0.3)'}`, 
              color: canAfford ? 'var(--success-color)' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {buying === nft.id ? (
              <><div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />ПОКУПКА...</>
            ) : (
              <><ShoppingCart size={14} />Купить</>
            )}
          </button>
          <button style={{ 
            flex: 1, 
            height: '36px', 
            borderRadius: '10px', 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid var(--danger-color)', 
            color: 'var(--danger-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}>
            <Tag size={14} />
            Продать
          </button>
        </div>
      </div>
    </div>
  );
};

const NFC = ({ userId, balance, setBalance }: any) => {
  const [growth, setGrowth] = useState(0);
  const [target, setTarget] = useState(0);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    // Poll NFT manipulation status every 3s
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/nft/status`);
        const data = await res.json();
        setGrowth(data.growth || 0);
        setTarget(data.target || 0);
      } catch { /* silent */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBuy = async (nft: any) => {
    if (!userId) return showToast('error', 'Not logged in');
    if (balance < nft.price) return showToast('error', 'Insufficient balance');
    setBuying(nft.id);
    try {
      const res = await fetch(`${API_URL}/nft/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId, nftId: nft.id, name: nft.name, price: nft.price })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBalance(data.newBalance);
        showToast('success', `${nft.name} purchased! -${nft.price.toLocaleString()} coins`);
      } else {
        showToast('error', data.error || 'Purchase failed');
      }
    } catch {
      showToast('error', 'Network error');
    } finally {
      setBuying(null);
    }
  };

  // Generate dynamic changes based on live manipulation
  const getChange = (index: number) => {
    const base = [5.3, -2.1, 0.8][index];
    if (target === 0) return { val: base.toFixed(1), isPositive: base > 0 };
    const boosted = base + (growth * (index % 2 === 0 ? 1 : 0.5));
    return { val: (boosted > 0 ? '+' : '') + boosted.toFixed(1), isPositive: boosted > 0 };
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
          <h1>NFT Marketplace</h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Digital assets &amp; collectibles</p>
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
        </div>
      </div>

      {/* Market growth indicator */}
      {target > 0 && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--success-color)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <TrendingUp size={18} color="var(--success-color)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Market Manipulation Active</div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (growth / Math.max(target, 1)) * 100)}%`, height: '100%', background: 'var(--success-color)', transition: 'width 1s ease' }} />
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--success-color)' }}>+{growth.toFixed(1)}%</span>
        </div>
      )}

      {/* Balance info */}
      {userId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px', opacity: 0.7 }}>
          <Coins size={14} color="var(--gold-color)" />
          <span>Your balance: <strong style={{ color: 'var(--gold-color)' }}>{(balance || 0).toLocaleString()}</strong> coins</span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '20px',
        paddingBottom: '40px'
      }}>
        {NFT_LIST.map((nft, i) => {
          const ch = getChange(i);
          return (
            <NFTCard 
              key={nft.id} 
              nft={nft}
              change={ch.val}
              isPositive={ch.isPositive}
              onBuy={handleBuy}
              buying={buying}
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
      `}</style>
    </div>
  );
};

export default NFC;
