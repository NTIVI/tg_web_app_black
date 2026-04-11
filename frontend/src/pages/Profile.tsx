import { useEffect } from 'react';
import { Wallet, Trophy, Package, Calendar, ShieldCheck, Layers } from 'lucide-react';

const BRAND_DATA: Record<string, { name: string, img: string }> = {
  brand1: { name: 'Apple', img: '/brands/apple.png?v=3' },
  brand2: { name: 'Nvidia', img: '/brands/nvidia.png?v=3' },
  brand3: { name: 'Samsung', img: '/brands/samsung.png?v=3' },
  brand4: { name: 'Xiaomi', img: '/brands/xiaomi.png?v=3' },
  brand5: { name: 'Netflix', img: '/brands/netflix.png?v=3' },
  brand6: { name: 'Epic Games', img: '/brands/epicgames.png?v=3' },
  brand7: { name: 'Steam', img: '/brands/steam.png?v=3' },
  brand8: { name: 'Xbox', img: '/brands/xbox.png?v=3' },
};

const Profile = ({ balance, tgUser, purchases, myNfts }: any) => {
  // Group raw NFTs by nft_id
  const groupedNfts = (myNfts || []).reduce((acc: any, curr: any) => {
    const brand = BRAND_DATA[curr.nft_id];
    if (!brand) return acc;
    
    if (!acc[curr.nft_id]) {
      acc[curr.nft_id] = {
        name: brand.name,
        img: brand.img,
        qty: 0,
        totalInvested: 0
      };
    }
    acc[curr.nft_id].qty += 1;
    acc[curr.nft_id].totalInvested += Number(curr.purchase_price || 0);
    return acc;
  }, {});

  const nftsToDisplay = Object.values(groupedNfts);

  useEffect(() => {
    // Synchronized via global App.tsx init
  }, [tgUser?.telegram_id]);

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
                width: `${((tgUser?.xp || 0) % 1000) / 10}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, #1e40af, #a855f7)',
                borderRadius: '10px',
                boxShadow: '0 0 8px var(--primary-glow)'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Прогресс</span>
              <span style={{ fontSize: '10px', color: 'var(--success-color)', fontWeight: '800' }}>{(tgUser?.xp || 0) % 1000} / 1000 XP</span>
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
          {nftsToDisplay.length > 0 ? nftsToDisplay.map((nft: any, i: number) => (
            <div key={i} style={{ 
              minWidth: '100px', 
              background: 'rgba(0,0,0,0.3)', 
              padding: '8px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center'
            }}>
              <img src={nft.img} style={{ width: '40px', height: '40px', borderRadius: '8px', marginBottom: '4px' }} alt="NFT" />
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gold-color)' }}>{nft.name}</div>
              <div style={{ fontSize: '9px', opacity: 0.5 }}>x{nft.qty} шт</div>
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
          <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-color)' }}>Всего: {myNfts.reduce((acc: number, n: any) => acc + n.qty, 0)} шт</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Package size={20} color="var(--primary-color)" />
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Мои покупки</h3>
      </div>

      <div className="glass-panel" style={{ padding: '0 20px' }}>
        {purchases.length > 0 ? (
          purchases.map((p: any, i: number) => (
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
