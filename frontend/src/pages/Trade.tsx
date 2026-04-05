import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { TrendingUp, TrendingDown, Coins, Clock, BarChart3, Activity, ListFilter, ArrowRightLeft } from 'lucide-react';

const Trade = ({ tgUser, balance, setBalance }: any) => {
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPlacing, setIsPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<any>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const pollInterval = useRef<any>(null);
  const emulatorInterval = useRef<any>(null);

  useEffect(() => {
    fetchTradeStatus(true);
    pollInterval.current = setInterval(() => fetchTradeStatus(false), 10000);
    
    // Emulator logic: simulate order book and trades
    emulatorInterval.current = setInterval(generateEmulatorData, 2000);
    
    return () => {
        clearInterval(pollInterval.current);
        clearInterval(emulatorInterval.current);
    };
  }, []);

  const fetchTradeStatus = async (initial = false) => {
    try {
      const res = await fetch(`${API_URL}/trade/status`);
      const data = await res.json();
      setTradeStatus(data);
      if (initial) {
          setLoading(false);
          // Initial trades
          const initialTrades = Array.from({ length: 10 }).map(() => ({
              id: Math.random().toString(36).substr(2, 9),
              price: data.currentPrice + (Math.random() - 0.5) * 50,
              amount: (Math.random() * 5000).toFixed(0),
              type: Math.random() > 0.5 ? 'buy' : 'sell',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }));
          setRecentTrades(initialTrades);
      }
    } catch (err) {
      console.error("Trade status error:", err);
      if (initial) setLoading(false);
    }
  };

  const generateEmulatorData = () => {
    if (!tradeStatus) return;
    const price = tradeStatus.currentPrice;
    
    // Generate Order Book around current price
    const newBids = Array.from({ length: 5 }).map((_, i) => ({
      price: price - (i + 1) * (Math.random() * 5 + 2),
      amount: (Math.random() * 10000).toFixed(0)
    })).sort((a, b) => b.price - a.price);

    const newAsks = Array.from({ length: 5 }).map((_, i) => ({
      price: price + (i + 1) * (Math.random() * 5 + 2),
      amount: (Math.random() * 10000).toFixed(0)
    })).sort((a, b) => b.price - a.price);

    setOrderBook({ bids: newBids, asks: newAsks });

    // Occasional new trade
    if (Math.random() > 0.6) {
        const newTrade = {
            id: Math.random().toString(36).substr(2, 9),
            price: price + (Math.random() - 0.5) * 10,
            amount: (Math.random() * 2000).toFixed(0),
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setRecentTrades(prev => [newTrade, ...prev.slice(0, 14)]);
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

        setTimeout(() => {
          setActiveBet(null);
          setTimeout(() => initUser(), 2000);
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

  // Custom SVG Area Chart
  const renderEmulatorChart = () => {
    if (!tradeStatus?.history || tradeStatus.history.length === 0) return null;
    const history = tradeStatus.history;
    const min = Math.min(...history) * 0.999;
    const max = Math.max(...history) * 1.001;
    const range = max - min;
    const width = 1000;
    const height = 400;

    const points = history.map((p: number, i: number) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const lastX = width;
    const lastY = height - ((history[history.length - 1] - min) / range) * height;
    
    // Area path
    const areaPoints = `0,${height} ${points} ${lastX},${height}`;

    return (
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', height: '200px', position: 'relative' }}>
         <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M ${areaPoints}`} fill="url(#chartGradient)" />
            <polyline 
                points={points} 
                fill="none" 
                stroke="var(--primary-color)" 
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }}
            />
            {/* Last Point Glow */}
            <circle cx={lastX} cy={lastY} r="6" fill="var(--primary-color)">
                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
         </svg>
         <div style={{ position: 'absolute', top: '10px', right: '10px', pointerEvents: 'none' }}>
            <div style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={10} className="pulse" /> LIVE EMULATOR
            </div>
         </div>
      </div>
    );
  };

  const renderOrderBook = () => (
    <div className="glass-panel" style={{ padding: '12px', fontSize: '10px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ListFilter size={12} /> Стакан ордеров
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {orderBook.asks.map((ask: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                        <span>{ask.price.toFixed(1)}</span>
                        <span style={{ opacity: 0.6 }}>{ask.amount}</span>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {orderBook.bids.map((bid: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                        <span>{bid.price.toFixed(1)}</span>
                        <span style={{ opacity: 0.6 }}>{bid.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderRecentTrades = () => (
    <div className="glass-panel" style={{ padding: '12px', fontSize: '10px', flex: 1, maxHeight: '110px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ArrowRightLeft size={12} /> Сделки Live
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {recentTrades.slice(0, 6).map((trade, i) => (
                <div key={trade.id} style={{ display: 'flex', justifyContent: 'space-between', opacity: 1 - (i * 0.15) }}>
                    <span style={{ color: trade.type === 'buy' ? '#4ade80' : '#f87171' }}>
                        {trade.type === 'buy' ? 'BUY' : 'SELL'}
                    </span>
                    <span>{Number(trade.price).toFixed(1)}</span>
                    <span style={{ opacity: 0.5 }}>{trade.time}</span>
                </div>
            ))}
        </div>
    </div>
  );

  const amounts = [100, 500, 1000, 2500, 5000];
  const durations = [
      { label: '30 сек', value: 30 },
      { label: '1 мин', value: 60 },
      { label: '3 мин', value: 180 }
  ];

  if (loading && !tradeStatus) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
      <div className="spinner"></div>
      <h2 style={{ color: 'var(--primary-color)' }}>Загрузка рынка...</h2>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={32} color="var(--primary-color)" />
          <h1>Биржа</h1>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={16} color="var(--gold-color)" />
          <span style={{ fontWeight: 'bold' }}>{balance.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
           <div>
               <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>ТЕКУЩАЯ ЦЕНА BTC/LUCKY</div>
               <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--secondary-color)', textShadow: '0 0 20px var(--secondary-glow)' }}>
                  {tradeStatus?.currentPrice?.toLocaleString() || '7,000'}
               </div>
           </div>
           <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.5 }}>
                Vol: 2.1M <br />
                24h: +4.2%
           </div>
        </div>
        
        {renderEmulatorChart()}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
         {renderOrderBook()}
         {renderRecentTrades()}
      </div>

      <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>СУММА СДЕЛКИ:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {amounts.map(amt => (
                <button 
                  key={amt} 
                  className={`nav-item ${selectedAmount === amt ? 'active' : ''}`}
                  onClick={() => setSelectedAmount(amt)}
                  style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '14px',
                      background: selectedAmount === amt ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedAmount === amt ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      flexDirection: 'row',
                      height: 'auto'
                  }}
                >
                    {amt}
                </button>
            ))}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>ВРЕМЯ ЭКСПИРАЦИИ:</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {durations.map(d => (
                <button 
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '14px',
                        background: selectedDuration === d.value ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedDuration === d.value ? 'var(--secondary-color)' : 'rgba(255,255,255,0.05)'}`,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Clock size={14} />
                    {d.label}
                </button>
            ))}
          </div>
      </div>

      {activeBet ? (
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--primary-color)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>СДЕЛКА В РАБОТЕ</div>
              <div style={{ fontSize: '14px', color: activeBet.direction === 'up' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                  {activeBet.direction === 'up' ? 'ВЫШЕ ↑' : 'НИЖЕ ↓'} | {activeBet.amount} монет
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', margin: '16px 0', color: 'var(--primary-color)', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.max(0, Math.ceil((activeBet.endTime - Date.now()) / 1000))}с
              </div>
              <p style={{ fontSize: '12px', opacity: 0.5 }}>Ожидайте автоматический расчет...</p>
          </div>
      ) : (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn-primary" 
              style={{ 
                flex: 1, 
                height: '65px', 
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.3)',
                border: 'none',
                borderRadius: '18px',
                fontSize: '20px',
                fontWeight: '900'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('up')}
            >
              ВВЕРХ ↑
            </button>
            <button 
              className="btn-primary" 
              style={{ 
                flex: 1, 
                height: '65px', 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
                border: 'none',
                borderRadius: '18px',
                fontSize: '20px',
                fontWeight: '900'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('down')}
            >
              ВНИЗ ↓
            </button>
          </div>
      )}
    </div>
  );
};

export default Trade;
