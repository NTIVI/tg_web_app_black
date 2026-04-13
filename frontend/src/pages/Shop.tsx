import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Smartphone, Watch, Tv, Laptop, Gamepad2, Package } from 'lucide-react';
import { API_URL } from '../config';

interface ShopProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
  setPurchases: (newPurchases: any[]) => void;
}

interface ShopItem {
  id: number;
  category: string;
  name: string;
  price: number;
  image_url: string;
}

const CategoryIcon = ({ category }: { category: string }) => {
  const c = category.toLowerCase();
  if (c.includes('телефон')) return <Smartphone size={20} />;
  if (c.includes('гаджет') || c.includes('час')) return <Watch size={20} />;
  if (c.includes('тв') || c.includes('телевизор')) return <Tv size={20} />;
  if (c.includes('пк') || c.includes('ноутбук') || c.includes('компьютер')) return <Laptop size={20} />;
  if (c.includes('приставк') || c.includes('гейм')) return <Gamepad2 size={20} />;
  return <Package size={20} />;
};

const CategorySection = ({ category, items, balance, onBuy }: { 
  category: string, 
  items: ShopItem[], 
  balance: number,
  onBuy: (item: ShopItem) => void 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const cards = container.getElementsByClassName('shop-item-card');
          const containerWidth = container.offsetWidth;
          const containerCenter = container.scrollLeft + containerWidth / 2;

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(containerCenter - cardCenterX);
            
            // Normalize distance based on container width
            // This makes scaling consistent across different screen sizes
            const scale = Math.max(0.9, 1.15 - (distance / 400));
            const opacity = Math.max(0.6, 1 - (distance / 600));
            
            card.style.transform = `scale(${scale})`;
            card.style.opacity = opacity.toString();
            
            if (distance < card.offsetWidth / 2) {
              card.classList.add('focused-item');
              card.style.zIndex = '10';
            } else {
              card.classList.remove('focused-item');
              card.style.zIndex = '1';
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll);
    // Initial call to set scales
    setTimeout(handleScroll, 100);
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items]);

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '0 20px' }}>
        <div style={{ color: 'var(--primary-color)' }}>
          <CategoryIcon category={category} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{category}</h2>
      </div>

      <div 
        ref={scrollRef}
        className="horizontal-scroll"
        style={{ 
          display: 'flex', 
          gap: '12px', 
          overflowX: 'auto', 
          padding: '24px 20px 40px 20px',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          perspective: '1000px'
        }}
      >
        {/* Padding for center first item */}
        <div style={{ flexShrink: 0, width: 'calc(50% - 80px)' }} />

        {items.map(item => (
          <div 
            key={item.id} 
            className="glass-panel shop-item-card" 
            style={{ 
              flexShrink: 0, 
              width: '160px', 
              padding: '16px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              borderRadius: '28px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              scrollSnapAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              willChange: 'transform, opacity'
            }}
          >
            <div style={{ 
              width: '100%', 
              aspectRatio: '1/1', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              background: 'rgba(255, 255, 255, 0.03)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '0' 
            }}>
              <img 
                src={item.image_url} 
                alt={item.name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                }} 
              />
            </div>
            
            <div style={{ flexGrow: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
              <div style={{ color: 'var(--gold-color)', fontWeight: '900', fontSize: '17px' }}>
                ${(item.price / 100).toFixed(2)}
              </div>
            </div>

            <button 
              className="btn-primary buy-btn" 
              style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '14px', fontWeight: '800' }}
              onClick={() => onBuy(item)}
              disabled={balance < item.price}
            >
              <ShoppingCart size={14} />
              Купить
            </button>
          </div>
        ))}

        {/* Padding for center last item */}
        <div style={{ flexShrink: 0, width: 'calc(50% - 80px)' }} />
      </div>
    </div>
  );
};

const Shop = ({ userId, balance, setBalance, setPurchases }: ShopProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/shop/items`);
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error('Fetch shop error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    if (!userId) return setMessage('Пожалуйста, подождите инициализацию.');
    if (balance < item.price) {
      setMessage(`Недостаточно средств для ${item.name}!`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/buy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ telegramId: userId, itemName: item.name, price: item.price }),
      });
      
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        if (data.purchases) setPurchases(data.purchases);
        setMessage(`Успешно куплено ${item.name}!`);
      } else {
        setMessage(data.error || 'Ошибка при покупке');
      }
    } catch (err) {
      setMessage('Ошибка сети.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const CATEGORY_PRIORITY = ['Телефоны', 'Компьютеры', 'Гаджеты', 'ТВ и Видео', 'Приставки'];

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a);
    const indexB = CATEGORY_PRIORITY.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '120px', paddingLeft: 0, paddingRight: 0 }}>
      <div style={{ marginBottom: '32px', padding: '0 20px' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: '900' }}>Магазин</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Выбирай лучшее за свои достижения.</p>
      </div>

      {message && (
        <div style={{ padding: '0 20px' }}>
            <div className="glass-panel" style={{ 
            padding: '16px', 
            borderRadius: '20px', 
            marginBottom: '24px', 
            border: '1px solid var(--primary-color)',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'white',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '700',
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
            }}>
            {message}
            </div>
        </div>
      )}

      {sortedCategories.map(category => (
        <CategorySection 
          key={category} 
          category={category} 
          items={groupedItems[category]} 
          balance={balance} 
          onBuy={handleBuy} 
        />
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.5 }}>
          <ShoppingCart size={48} style={{ marginBottom: '16px' }} />
          <p>Магазин скоро пополнится новыми товарами!</p>
        </div>
      )}

      <style>{`
        .horizontal-scroll::-webkit-scrollbar {
          display: none;
        }
        .focused-item {
          border-color: var(--primary-color) !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.25) !important;
        }
        .focused-item img {
          transform: scale(1.05);
          transition: transform 0.4s ease;
        }
        .buy-btn:active {
          transform: scale(0.95);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Shop;
