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
    <div className={`nft-card-premium ${isPositive ? 'trend-up' : 'trend-down'}`}>
      <div className="card-glass-content">
        {/* Trend Indicator Badge */}
        <div className="trend-badge">
          {isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
          <span>{isPositive ? '+' : ''}{changeVal.toFixed(1)}%</span>
        </div>

        {/* Logo Section */}
        <div className="logo-container-wrapper">
          <div className="logo-container">
            <img 
              src={nft.image} 
              alt={nft.name} 
              className="brand-logo-img-premium"
            />
          </div>
          <div className="logo-glow-effect"></div>
        </div>

        {/* Content Section */}
        <div className="card-details">
          <div className="brand-name">{nft.name}</div>
          <div className="asset-id">{nft.id.toUpperCase()}</div>
          <div className="price-tag">
            <span className="currency-symbol">$</span>
            <span className="price-value">{displayCurrentPrice}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-footer">
          <button 
            onClick={() => onBuy({ ...nft, price: currentPrice })}
            disabled={buying === nft.id || !userId || !canAfford}
            className={`btn-buy-premium ${!canAfford ? 'disabled' : ''}`}
          >
            {buying === nft.id ? '...' : <><ShoppingCart size={14} />КУПИТЬ</>}
          </button>
          <button 
            className="btn-sell-minimal"
            onClick={() => onSell({ ...nft, price: currentPrice })} 
            disabled={selling === nft.id}
          >
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
    <div className="page promotions-page">
      {/* Toast */}
      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Market Header */}
      <div className="market-header-premium">
        <div className="header-info">
          <h1>Финансовый Рынок</h1>
          <p>Инвестируйте в акции мировых брендов в реальном времени</p>
        </div>
        <div className="market-status-badge">
          <Zap size={18} />
          <div className="status-text">
            <span className="live-dot"></span>
            <span className="live-label">LIVE MARKET</span>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      {userId && (
        <div className="market-summary-card">
          <div className="summary-item">
            <DollarSign size={20} className="icon-gold" />
            <div className="summary-details">
              <span className="label">Доступно для инвест</span>
              <span className="value">${((balance || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <TrendingUp size={20} className="icon-success" />
            <div className="summary-details">
              <span className="label">Индекс рынка</span>
              <span className="value">{(stockMultiplier * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      <div className="brands-grid-premium">
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
        .promotions-page {
          padding-top: 20px;
          animation: fadeIn 0.8s ease-out;
        }

        .market-header-premium {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .market-header-premium h1 {
          font-size: 28px;
          margin-bottom: 4px;
        }

        .market-header-premium p {
          font-size: 13px;
          opacity: 0.6;
          margin: 0;
        }

        .market-status-badge {
          background: rgba(30, 64, 175, 0.15);
          border: 1px solid rgba(30, 64, 175, 0.3);
          padding: 8px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--primary-color);
        }

        .status-text {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: livePulse 2s infinite;
        }

        .live-label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .market-summary-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin-bottom: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-details {
          display: flex;
          flex-direction: column;
        }

        .summary-details .label {
          font-size: 10px;
          text-transform: uppercase;
          opacity: 0.5;
          letter-spacing: 0.5px;
        }

        .summary-details .value {
          font-size: 16px;
          font-weight: 800;
        }

        .summary-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
        }

        .brands-grid-premium {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding-bottom: 100px;
        }

        /* PREMIUM CARD STYLES */
        .nft-card-premium {
          position: relative;
          background: rgba(30, 30, 38, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 1px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
        }

        .card-glass-content {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border-radius: 27px;
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          z-index: 2;
          position: relative;
        }

        .nft-card-premium::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1.5px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .nft-card-premium.trend-up::after {
          content: "";
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .nft-card-premium.trend-down::after {
          content: "";
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .trend-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 3px;
          z-index: 10;
        }

        .trend-up .trend-badge {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        .trend-down .trend-badge {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .logo-container-wrapper {
          width: 100%;
          padding: 10px 0;
          display: flex;
          justify-content: center;
          position: relative;
          margin-bottom: 12px;
        }

        .logo-container {
          width: 100px;
          height: 100px;
          background: #ffffff;
          border-radius: 22px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          z-index: 2;
          transition: transform 0.4s ease;
        }

        .brand-logo-img-premium {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-glow-effect {
          position: absolute;
          width: 60px;
          height: 60px;
          background: var(--primary-color);
          filter: blur(35px);
          opacity: 0.15;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .card-details {
          text-align: center;
          margin-bottom: 14px;
        }

        .brand-name {
          font-size: 15px;
          font-weight: 800;
          color: white;
          margin-bottom: 2px;
        }

        .asset-id {
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .price-tag {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 2px;
        }

        .currency-symbol {
          font-size: 14px;
          font-weight: 600;
          color: var(--gold-color);
        }

        .price-value {
          font-size: 20px;
          font-weight: 900;
          color: white;
        }

        .action-footer {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .btn-buy-premium {
          flex: 1;
          height: 42px;
          border-radius: 12px;
          background: white;
          color: black;
          border: none;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 6px 15px rgba(255,255,255,0.15);
        }

        .btn-buy-premium:active { transform: scale(0.95); }

        .btn-buy-premium.disabled {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.2);
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-sell-minimal {
          width: 44px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sell-minimal:hover { background: rgba(255,255,255,0.1); }

        /* HOVER STATES */
        .nft-card-premium:hover {
          transform: translateY(-5px);
          background: rgba(35, 35, 45, 0.8);
        }

        .nft-card-premium:hover .logo-container {
          transform: scale(1.05) translateY(-2px);
        }

        /* UTILS */
        .toast-premium {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          min-width: 280px;
        }

        .toast-premium.success {
          background: rgba(34, 197, 94, 0.95);
          color: white;
        }

        .toast-premium.error {
          background: rgba(239, 68, 68, 0.95);
          color: white;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translate(-50%, -30px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .icon-gold { color: var(--gold-color); }
        .icon-success { color: #22c55e; }
      `}</style>
    </div>
  );
};

export default Promotions;
