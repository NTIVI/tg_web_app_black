import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

interface ShopProps {
  userId: string | null;
  balance: number;
  setBalance: (newBalance: number) => void;
}

const items = [
  { id: 1, name: 'PlayStation 5 Pro', price: 5000, img: 'https://images.unsplash.com/photo-1606144042876-0bfdc6463990?w=300&q=80' },
  { id: 2, name: 'iPhone 17 Pro Max', price: 10000, img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&q=80' },
  { id: 3, name: 'Premium Headphones', price: 1500, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' },
  { id: 4, name: '4K Smart TV', price: 7500, img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80' },
  { id: 5, name: 'Gaming Laptop', price: 12000, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&q=80' },
  { id: 6, name: 'Smart Watch', price: 800, img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80' },
];

const Shop = ({ userId, balance, setBalance }: ShopProps) => {
  const [message, setMessage] = useState('');

  const handleBuy = async (item: typeof items[0]) => {
    if (!userId) return setMessage('Please wait for init.');
    if (balance < item.price) {
      setMessage(`Not enough coins for ${item.name}!`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId, itemName: item.name, price: item.price }),
      });
      
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        setMessage(`Successfully bought ${item.name}!`);
      } else {
        setMessage(data.error || 'Failed to buy');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="page">
      <h1>Premium Shop</h1>
      <p>Spend your game coins on amazing prizes.</p>

      {message && (
        <div style={{ backgroundColor: 'var(--surface-color-light)', padding: '12px', borderRadius: '8px', margin: '16px 0', border: '1px solid var(--primary-color)' }}>
          {message}
        </div>
      )}

      <div className="shop-grid" style={{ marginTop: '24px' }}>
        {items.map(item => (
          <div key={item.id} className="shop-item">
            <img src={item.img} alt={item.name} className="shop-item-image" />
            <div className="shop-item-title">{item.name}</div>
            <div className="shop-item-price">{item.price} Coins</div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '10px' }}
              onClick={() => handleBuy(item)}
              disabled={balance < item.price}
            >
              <ShoppingCart size={18} />
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
