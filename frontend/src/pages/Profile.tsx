import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Wallet, Trophy, Package, Calendar, ShieldCheck, Layers } from 'lucide-react';

const BRAND_IMAGES: Record<string, string> = {
  'brand1': '/brands/apple.png?v=2',
  'brand2': '/brands/nvidia.png?v=2',
  'brand3': '/brands/samsung.png?v=2',
  'brand4': '/brands/xiaomi.png?v=2',
  'brand5': '/brands/netflix.png?v=2',
  'brand6': '/brands/epicgames.png?v=2',
  'brand7': '/brands/steam.png?v=2',
  'brand8': '/brands/xbox.png?v=2',
  'nft1': '/nfts/nft1.png',
  'nft2': '/nfts/nft2.png',
  'nft3': '/nfts/nft3.png',
  'nft4': '/nfts/nft4.png',
  'nft5': '/nfts/nft5.png',
  'nft6': '/nfts/nft6.png',
};

const Profile = ({ userId, tgUser, balance }: any) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [myNfts, setMyNfts] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const headers = {
      'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
    };
    
    fetch(`${API_URL}/admin/purchases`, { headers }).then(r => r.json()).then(data => {
      setPurchases(data.purchases?.filter((p: any) => p.telegram_id === userId) || []);
    });
    fetch(`${API_URL}/nft/my/${userId}`, { headers }).then(r => r.json()).then(data => {
      const aggregated: Record<string, any> = {};
      (data.nfts || []).forEach((n: any) => {
        if (!aggregated[n.nft_id]) aggregated[n.nft_id] = { id: n.nft_id, qty: 0, price: n.purchase_price, img: BRAND_IMAGES[n.nft_id] || `/nfts/${n.nft_id}.png` };
        aggregated[n.nft_id].qty += n.quantity;
      });
      setMyNfts(Object.values(aggregated));
    });
  }, [userId]);

  return (
    <div className="page" style={{ background: 'var(--background-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Профиль</h1>
        <div className="glass-panel" style={{ padding: '8px 16px', margin: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--primary-color)' }}>
          <Trophy size={16} color="var(--gold-color)" />
          <span style={{ fontWeight: '800', color: 'var(--gold-color)', fontSize: '14px' }}>УР {tgUser?.level || 1}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '40px 24px' }}>
        <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'var(--primary-glow)', filter: 'blur(60px)', borderRadius: '50%', zIndex: 0, opacity: 0.5 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
            <img 
              src={tgUser?.photo_url || ''} 
              style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--primary-color)', padding: '4px', background: 'rgba(0,0,0,0.3)', objectFit: 'cover' }} 
              alt="Avatar"
            />
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--success-color)', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--background-color)' }}></div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{tgUser?.first_name}</h2>
            <span style={{ color: 'var(--primary-color)', fontSize: '15px', fontWeight: '600', opacity: 0.8 }}>@{tgUser?.username || 'user'}</span>
          </div>

          <div style={{ maxWidth: '240px', margin: '0 auto 24px auto' }}>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ 
                width: `${((tgUser?.xp || balance || 0) % 1000) / 10}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, #1e40af, #a855f7)',
                borderRadius: '10px',
                boxShadow: '0 0 8px var(--primary-glow)'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Прогресс</span>
              <span style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: '800' }}>{(tgUser?.xp || balance || 0) % 1000} / 1000 XP</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px', justifyContent: 'center' }}>
                <Wallet size={12} />
                <span>Баланс</span>
              </div>
              <div style={{ color: 'var(--gold-color)', fontSize: '18px', fontWeight: '800' }}>${((balance || 0) / 100).toFixed(2)}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px', justifyContent: 'center' }}>
                <ShieldCheck size={12} />
                <span>Статус</span>
              </div>
              <div style={{ color: 'var(--primary-color)', fontSize: '18px', fontWeight: '800' }}>Активен</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Layers size={20} color="var(--primary-color)" />
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Мои акции</h3>
      </div>

      <div className="glass-panel" style={{ 
        padding: '16px', 
        marginBottom: '24px', 
        background: 'linear-gradient(90deg, rgba(30, 64, 175, 0.1), rgba(168, 85, 247, 0.1))',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        aspectRatio: '3/1'
      }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {myNfts.length > 0 ? myNfts.map((nft, i) => (
            <div key={i} style={{ 
              minWidth: '100px', 
              background: 'rgba(0,0,0,0.3)', 
              padding: '8px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center'
            }}>
              <img src={nft.img} style={{ width: '40px', height: '40px', borderRadius: '8px', marginBottom: '4px' }} alt="NFT" />
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gold-color)' }}>${(nft.price / 100).toFixed(2)}</div>
              <div style={{ fontSize: '9px', opacity: 0.5 }}>x{nft.qty}</div>
            </div>
          )) : (
            <div style={{ fontSize: '13px', opacity: 0.5, padding: '10px' }}>У вас пока нет акций</div>
          )}
        </div>
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          paddingTop: '8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: '600' }}>Статус коллекции</span>
          <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-color)' }}>Всего: {myNfts.reduce((acc, n) => acc + n.qty, 0)} шт</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Package size={20} color="var(--primary-color)" />
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Мои покупки</h3>
      </div>

      <div className="glass-panel" style={{ padding: '0 20px' }}>
        {purchases.length > 0 ? (
          purchases.map((p, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: i === purchases.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--surface-color-light), #1a1a1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
                <img src={p.photo_url || tgUser?.photo_url || ''} style={{ width: '100%', height: '100%', borderRadius: '14px', opacity: 0.8, objectFit: 'cover' }} alt="User" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{p.item_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                  <Calendar size={12} />
                  <span>{new Date(p.purchased_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ color: 'var(--gold-color)', fontWeight: '800', fontSize: '14px' }}>-${((p.price || 0) / 100).toFixed(2)}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Выполнено</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Package size={32} style={{ opacity: 0.2 }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>Вы еще не совершали покупок.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
