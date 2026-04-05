import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { TrendingUp, TrendingDown, Coins, Clock, BarChart3 } from 'lucide-react';

const Trade = ({ tgUser, balance, setBalance }: any) => {
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeBet, setActiveBet] = useState<any>(null);
  const pollInterval = useRef<any>(null);

  useEffect(() => {
    fetchTradeStatus();
    pollInterval.current = setInterval(fetchTradeStatus, 5000);
    return () => clearInterval(pollInterval.current);
  }, []);

  const fetchTradeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/trade/status`);
      const data = await res.json();
      setTradeStatus(data);
    } catch (err) {
      console.error("Trade status error:", err);
    }
  };

  const handlePlaceBet = async (direction: 'up' | 'down') => {
    if (!tgUser || isPlacing || balance < selectedAmount) return;
    
    setIsPlacing(true);
    const tid = tgUser.telegram_id || tgUser.id;

    try {
      const res = await fetch(`${API_URL}/trade/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tid,
          amount: selectedAmount,
          direction,
          duration: selectedDuration
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBalance((prev: number) => prev - selectedAmount);
        setActiveBet({
          direction,
          amount: selectedAmount,
          duration: selectedDuration,
          startPrice: data.startPrice,
          endTime: Date.now() + (selectedDuration * 1000)
        });

        // Set timeout to clear bet and show "waiting for bot message" or refresh
        setTimeout(() => {
          setActiveBet(null);
          // Refresh balance after expected payout
          setTimeout(() => {
             initUser(); 
          }, 2000);
        }, selectedDuration * 1000);
      }
    } catch (err) {
      console.error("Bet error:", err);
    } finally {
      setIsPlacing(false);
    }
  };

  const initUser = async () => {
    const tid = tgUser?.telegram_id || tgUser?.id;
    if (!tid) return;
    try {
        const res = await fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initDataUnsafe: { user: { id: tid } } })
        });
        const data = await res.json();
        if (data.user) setBalance(data.user.balance);
    } catch(e) {}
  };

  const renderChart = () => {
    if (!tradeStatus?.history) return null;
    const history = tradeStatus.history;
    
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        background: 'rgba(0,0,0,0.3)', 
        padding: '16px', 
        borderRadius: '16px',
        fontSize: '14px',
        lineHeight: '1.6',
        maxHeight: '200px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse'
      }}>
        {history.map((price: number, i: number) => {
          const prevPrice = history[i - 1] || price;
          const isUp = price > prevPrice;
          const isSame = price === prevPrice;
          const emoji = isUp ? '🟩' : (isSame ? '⬜' : '🟥');
          const color = isUp ? '#4ade80' : (isSame ? '#94a3b8' : '#f87171');
          
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color }}>
              <span>{emoji}</span>
              <span style={{ fontWeight: 'bold' }}>{price.toLocaleString()}</span>
              {i > 0 && (
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>
                    {isUp ? '↑' : (isSame ? '→' : '↓')} {Math.abs(((price - prevPrice) / prevPrice) * 100).toFixed(1)}%
                  </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const amounts = [100, 500, 1000, 2500, 5000];
  const durations = [
      { label: '30 сек', value: 30 },
      { label: '1 мин', value: 60 },
      { label: '3 мин', value: 180 }
  ];

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={32} color="var(--primary-color)" />
          <h1>Трейд</h1>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={16} color="var(--gold-color)" />
          <span style={{ fontWeight: 'bold' }}>{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ opacity: 0.6 }}>Текущая цена:</span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary-color)' }}>
             {tradeStatus?.currentPrice?.toLocaleString() || '7,000'}
          </span>
        </div>
        {renderChart()}
        <div style={{ marginTop: '12px', fontSize: '12px', textAlign: 'center', opacity: 0.5 }}>
            Следующий тик через ~{Math.max(0, Math.floor((tradeStatus?.nextTickTime - Date.now()) / 1000))} сек
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Сумма сделки:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {amounts.map(amt => (
                <button 
                  key={amt} 
                  className={`glass-panel ${selectedAmount === amt ? 'active' : ''}`}
                  onClick={() => setSelectedAmount(amt)}
                  style={{ 
                      flex: 1, 
                      padding: '10px', 
                      borderRadius: '12px',
                      border: selectedAmount === amt ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)',
                      background: selectedAmount === amt ? 'rgba(30, 64, 175, 0.2)' : 'rgba(255,255,255,0.02)',
                      fontSize: '13px',
                      fontWeight: '700'
                  }}
                >
                    {amt}
                </button>
            ))}
            <button 
                className="glass-panel"
                onClick={() => setSelectedAmount(balance)}
                style={{ flex: 1, padding: '10px', borderRadius: '12px' }}
            >
                MAX
            </button>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Время:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {durations.map(d => (
                <button 
                    key={d.value}
                    className={`glass-panel ${selectedDuration === d.value ? 'active' : ''}`}
                    onClick={() => setSelectedDuration(d.value)}
                    style={{ 
                        flex: 1, 
                        padding: '10px', 
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: selectedDuration === d.value ? '2px solid var(--secondary-color)' : '1px solid rgba(255,255,255,0.05)',
                        background: selectedDuration === d.value ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.02)',
                        fontSize: '13px'
                    }}
                >
                    <Clock size={14} />
                    {d.label}
                </button>
            ))}
          </div>
      </div>

      {activeBet ? (
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--primary-color)' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Сделка активна</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>
                  {activeBet.direction === 'up' ? 'КУПИТЬ ↑' : 'ПРОДАТЬ ↓'} | {activeBet.amount} монет
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', margin: '16px 0', color: 'var(--primary-color)' }}>
                  {Math.max(0, Math.ceil((activeBet.endTime - Date.now()) / 1000))}с
              </div>
              <p style={{ fontSize: '12px', opacity: 0.5 }}>Результат будет отправлен ботом</p>
          </div>
      ) : (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn-primary" 
              style={{ 
                flex: 1, 
                height: '60px', 
                background: '#4ade80', 
                boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)',
                fontSize: '18px',
                fontWeight: '900'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('up')}
            >
              <TrendingUp size={24} /> КУПИТЬ ↑
            </button>
            <button 
              className="btn-primary" 
              style={{ 
                flex: 1, 
                height: '60px', 
                background: '#f87171', 
                boxShadow: '0 0 20px rgba(248, 113, 113, 0.4)',
                fontSize: '18px',
                fontWeight: '900'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('down')}
            >
              <TrendingDown size={24} /> ПРОДАТЬ ↓
            </button>
          </div>
      )}
    </div>
  );
};

export default Trade;
