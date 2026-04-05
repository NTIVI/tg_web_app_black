import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { TrendingUp, TrendingDown, Coins, Clock, BarChart3, Activity, ArrowRightLeft } from 'lucide-react';

const Trade = ({ tgUser, balance, setBalance }: any) => {
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPlacing, setIsPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [priceOffset, setPriceOffset] = useState<number>(0);
  const pollInterval = useRef<any>(null);
  const emulatorInterval = useRef<any>(null);

  useEffect(() => {
    fetchTradeStatus(true);
    pollInterval.current = setInterval(() => fetchTradeStatus(false), 10000);
    
    // Emulator logic: simulate user orders and trades with faster tick
    emulatorInterval.current = setInterval(generateEmulatorData, 1000);
    
    // Micro-tick for live price movement
    const microTick = setInterval(() => {
        setPriceOffset((Math.random() - 0.5) * 4);
    }, 150);
    
    return () => {
        clearInterval(pollInterval.current);
        clearInterval(emulatorInterval.current);
        clearInterval(microTick);
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

  // Custom SVG Candlestick Chart
  const renderEmulatorChart = () => {
    if (!tradeStatus?.history) return null;
    const history = tradeStatus.history.length > 1 ? tradeStatus.history : [tradeStatus.history[0] || 7000, tradeStatus.history[0] || 7000];
    const min = Math.min(...history) * 0.998;
    const max = Math.max(...history) * 1.002;
    const range = (max - min) || 1;
    const width = 1000;
    const height = 400;

    const candleWidth = (width / history.length) * 0.8;

    return (
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', height: '200px', position: 'relative' }}>
         <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            {history.map((p: number, i: number) => {
                if (i === 0) return null;
                const prevP = history[i - 1];
                const x = (i / (history.length - 1)) * width;
                
                const open = prevP;
                const close = p;
                const isUp = close >= open;
                const color = isUp ? '#4ade80' : '#f87171';
                
                // Simulate High/Low for visual effect
                const diff = Math.abs(close - open) || 5;
                const high = Math.max(open, close) + diff * 0.3;
                const low = Math.min(open, close) - diff * 0.3;

                const getY = (val: number) => height - ((val - min) / range) * height;

                const yOpen = getY(open);
                const yClose = getY(close);
                const yHigh = getY(high);
                const yLow = getY(low);

                return (
                    <g key={i}>
                        <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="2" />
                        <rect 
                            x={x - candleWidth / 2} 
                            y={Math.min(yOpen, yClose)} 
                            width={candleWidth} 
                            height={Math.max(1, Math.abs(yOpen - yClose))} 
                            fill={color} 
                            rx="1"
                        />
                    </g>
                );
            })}
            
            <line 
                x1="0" 
                y1={height - ((history[history.length - 1] - min) / range) * height} 
                x2={width} 
                y2={height - ((history[history.length - 1] - min) / range) * height} 
                stroke="var(--secondary-color)" 
                strokeWidth="1" 
                strokeDasharray="5,5" 
                opacity="0.3"
            />
         </svg>
         <div style={{ position: 'absolute', top: '10px', right: '10px', pointerEvents: 'none' }}>
            <div style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={10} className="pulse" /> LIVE CANDLES
            </div>
         </div>
      </div>
    );
  };

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
        <div className="glass-panel" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ 
                   width: '45px', 
                   height: '45px', 
                   background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', 
                   borderRadius: '50%', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   color: 'white',
                   fontWeight: '900',
                   fontSize: '16px',
                   boxShadow: '0 0 20px var(--secondary-glow)',
                   border: '2px solid rgba(255, 255, 255, 0.3)',
                   textShadow: '0 2px 4px rgba(0,0,0,0.3)'
               }}>
                   YT
               </div>
               <div>
                   <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '2px', fontWeight: 'bold' }}>ТЕКУЩАЯ ЦЕНА YT/AMD</div>
                   <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--secondary-color)', textShadow: '0 0 20px var(--secondary-glow)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {((tradeStatus?.currentPrice || 7000) + priceOffset).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                   </div>
               </div>
           </div>
           <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.5, fontWeight: 'bold', color: '#4ade80' }}>
                Vol: 2.1M <br />
                24h: +4.2%
           </div>
        </div>
        
        {renderEmulatorChart()}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('up')}
            >
              <TrendingUp size={24} style={{ marginRight: '8px' }} /> ВВЕРХ ↑
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
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={isPlacing || balance < selectedAmount}
              onClick={() => handlePlaceBet('down')}
            >
              <TrendingDown size={24} style={{ marginRight: '8px' }} /> ВНИЗ ↓
            </button>
          </div>
      )}
    </div>
  );
};

export default Trade;
