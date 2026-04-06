import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Tag, 
  DollarSign, 
  Layers,
  Zap,
  Check,
  X
} from 'lucide-react';

const NFT_LIST = [
  { id: 'nft1', name: 'Neon Genesis', price: 4750, image: '/nfts/nft1.png' },
  { id: 'nft2', name: 'Cyber Core', price: 3210, image: '/nfts/nft2.png' },
  { id: 'nft3', name: 'Aether Matrix', price: 8900, image: '/nfts/nft3.png' },
  { id: 'nft4', name: 'Zenith Fragment', price: 1500, image: '/nfts/nft4.png' },
  { id: 'nft5', name: 'Quantum Singularity', price: 5500, image: '/nfts/nft5.png' },
  { id: 'nft6', name: 'Holo Entity', price: 12400, image: '/nfts/nft6.png' },
];

const NFTCard = ({ nft, changeVal, isPositive, onBuy, buying, userId, balance }: any) => {
  const currentPrice = Math.round(nft.price * (1 + changeVal / 100));
  const displayCurrentPrice = (currentPrice / 100).toFixed(2);
  const canAfford = balance >= currentPrice;

  return (
    <div className="glass-panel" style={{ 
      padding: '12px', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '20px',
      border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
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
        backgroundSize: '20px 20px'
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
          margin: '4px 0',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            width: '80%', 
            height: '80%', 
            background: 'var(--primary-glow)', 
            filter: 'blur(20px)', 
            borderRadius: '50%',
            opacity: 0.3
          }}></div>
          <img 
            src={nft.image} 
            alt={nft.name} 
            style={{ 
              width: '100%', 
              maxHeight: '70px', 
              objectFit: 'contain', 
              borderRadius: '8px',
              zIndex: 1
            }} 
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '2px', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
            ${displayCurrentPrice}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {isPositive ? <TrendingUp size={12} color="var(--success-color)" /> : <TrendingDown size={12} color="var(--danger-color)" />}
            <span style={{ fontSize: '12px', fontWeight: '700', color: isPositive ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {isPositive ? '+' : ''}{changeVal.toFixed(1)}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            id={`buy-${nft.id}`}
            onClick={() => onBuy({ ...nft, price: currentPrice })}
            disabled={buying === nft.id || !userId || !canAfford}
            style={{ 
              flex: 1, 
              height: '32px', 
              borderRadius: '8px', 
              background: canAfford ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100,100,100,0.1)', 
              border: `1px solid ${canAfford ? 'var(--success-color)' : 'rgba(100,100,100,0.3)'}`, 
              color: canAfford ? 'var(--success-color)' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {buying === nft.id ? '...' : <><ShoppingCart size={12} />КУПИТЬ</>}
          </button>
          <button style={{ 
            flex: 1, 
            height: '32px', 
            borderRadius: '8px', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid var(--danger-color)', 
            color: 'var(--danger-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer'
          }}>
            <Tag size={12} />ПРОДАТЬ
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
        showToast('success', `${nft.name} purchased! -$${(nft.price / 100).toFixed(2)}`);
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
    const base = [5.3, -2.1, 0.8, -1.5, 4.2, -0.5][index % 6];
    if (target === 0) return { val: base, isPositive: base > 0 };
    const boosted = base + (growth * (index % 2 === 0 ? 1 : 0.5));
    return { val: boosted, isPositive: boosted > 0 };
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px', fontWeight: '800' }}>
          <DollarSign size={14} color="var(--gold-color)" />
          <span>Your balance: <strong style={{ color: 'var(--gold-color)' }}>${((balance || 0) / 100).toFixed(2)}</strong></span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        paddingBottom: '40px'
      }}>
        {NFT_LIST.map((nft, i) => {
          const ch = getChange(i);
          return (
            <NFTCard 
              key={nft.id} 
              nft={nft}
              changeVal={ch.val}
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
