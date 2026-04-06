import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Tag, 
  Coins, 
  Layers,
  Zap
} from 'lucide-react';

const NFTCard = ({ name, image, price, change, isPositive }: any) => {
  return (
    <div className="glass-panel" style={{ 
      padding: '16px', 
      aspectRatio: '1/1', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)',
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
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{name}</span>
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
            src={image} 
            alt={name} 
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
            ${price}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {isPositive ? <TrendingUp size={14} color="var(--success-color)" /> : <TrendingDown size={14} color="var(--danger-color)" />}
            <span style={{ fontSize: '13px', fontWeight: '700', color: isPositive ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {change}%
            </span>
            <Coins size={12} color="var(--gold-color)" style={{ marginLeft: '4px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ 
            flex: 1, 
            height: '36px', 
            borderRadius: '10px', 
            background: 'rgba(16, 185, 129, 0.15)', 
            border: '1px solid var(--success-color)', 
            color: 'var(--success-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}>
            <ShoppingCart size={14} />
            BUY
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
            SELL
          </button>
        </div>
      </div>
    </div>
  );
};

const NFC = () => {
  const nfts = [
    { id: 1, name: 'NFC #1', price: '47.50', change: '+5.3', isPositive: true, image: '/nfts/nft1.png' },
    { id: 2, name: 'NFC #2', price: '32.10', change: '-2.1', isPositive: false, image: '/nfts/nft2.png' },
    { id: 3, name: 'NFC #3', price: '89.00', change: '+0.8', isPositive: true, image: '/nfts/nft3.png' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>NFT Marketplace</h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Digital assets & collectibles</p>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '20px',
        paddingBottom: '40px'
      }}>
        {nfts.map(nft => (
          <NFTCard key={nft.id} {...nft} />
        ))}
      </div>
    </div>
  );
};

export default NFC;

