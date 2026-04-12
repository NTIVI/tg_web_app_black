import { useState, useEffect } from 'react';
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

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Магазин YourTurn</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Обменяй свой прогресс на реальные гаджеты.</p>
      </div>

      {message && (
        <div className="glass-panel" style={{ 
          padding: '16px', 
          borderRadius: '16px', 
          marginBottom: '24px', 
          border: '1px solid var(--primary-color)',
          background: 'rgba(56, 189, 248, 0.1)',
          color: 'white',
          textAlign: 'center',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {message}
        </div>
      )}

      {Object.entries(groupedItems).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 4px' }}>
            <div style={{ color: 'var(--primary-color)' }}>
              <CategoryIcon category={category} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{category}</h2>
          </div>

          <div 
            className="horizontal-scroll"
            style={{ 
              display: 'flex', 
              gap: '16px', 
              overflowX: 'auto', 
              paddingBottom: '20px',
              paddingRight: '20px',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {catItems.map(item => (
              <div 
                key={item.id} 
                className="glass-panel shop-item" 
                style={{ 
                  flexShrink: 0, 
                  width: '180px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>
                
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#fff', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '16px' }}>
                    ${(item.price / 100).toFixed(2)}
                  </div>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '12px' }}
                  onClick={() => handleBuy(item)}
                  disabled={balance < item.price}
                >
                  <ShoppingCart size={14} />
                  Купить
                </button>
              </div>
            ))}
          </div>
        </div>
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
        .shop-item:active {
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
