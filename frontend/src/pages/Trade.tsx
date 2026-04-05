import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { TrendingUp, TrendingDown, Coins, Activity, Zap, ShieldCheck, Globe } from 'lucide-react';

const Trade = ({ tgUser, balance, setBalance }: any) => {
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPlacing, setIsPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<any>(null);
  const [priceOffset, setPriceOffset] = useState<number>(0);
  const [sentiment, setSentiment] = useState<number>(65); // 0-100 (Bullish %)
  const pollInterval = useRef<any>(null);

  useEffect(() => {
    fetchTradeStatus(true);
    pollInterval.current = setInterval(() => fetchTradeStatus(false), 10000);
    
    // Micro-tick for live price movement
    const microTick = setInterval(() => {
        setPriceOffset((Math.random() - 0.5) * 4);
        if (Math.random() > 0.8) setSentiment(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 5)));
    }, 150);
    
    return () => {
        clearInterval(pollInterval.current);
        clearInterval(microTick);
    };
  }, []);

  const fetchTradeStatus = async (initial = false) => {
    try {
      const res = await fetch(`${API_URL}/trade/status`);
      const data = await res.json();
      setTradeStatus(data);
      if (initial) setLoading(false);
    } catch (err) {
      console.error("Trade status error:", err);
      if (initial) setLoading(false);
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
        body: JSON.stringify({ telegramId: tid, amount: selectedAmount, direction, duration: selectedDuration })
      });
      if (res.ok) {
        const data = await res.json();
        setBalance((prev: number) => prev - selectedAmount);
        setActiveBet({ direction, amount: selectedAmount, duration: selectedDuration, startPrice: data.startPrice, endTime: Date.now() + (selectedDuration * 1000) });
        setTimeout(() => { setActiveBet(null); setTimeout(() => initUser(), 2000); }, selectedDuration * 1000);
      }
    } catch (err) { console.error("Bet error:", err); } finally { setIsPlacing(false); }
  };

  const initUser = async () => {
    const tid = tgUser?.telegram_id || tgUser?.id;
    if (!tid) return;
    try {
        const res = await fetch(`${API_URL}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initDataUnsafe: { user: { id: tid } } }) });
        const data = await res.json();
        if (data.user) setBalance(data.user.balance);
    } catch(e) {}
  };

  // Professional SVG Chart with Indicators & Volume
  const renderProfessionalChart = () => {
    if (!tradeStatus?.history) return null;
    const history = tradeStatus.history.length > 1 ? tradeStatus.history : [tradeStatus.history[0] || 7000, tradeStatus.history[0] || 7000];
    const min = Math.min(...history) * 0.998;
    const max = Math.max(...history) * 1.002;
    const range = (max - min) || 1;
    const width = 1000;
    const height = 500;
    const chartHeight = height * 0.75;
    const volumeHeight = height * 0.2;
    const candleWidth = (width / history.length) * 0.35;

    const getY = (val: number) => chartHeight - ((val - min) / range) * chartHeight;

    // Moving Average (7 periods)
    const maPoints = history.map((_: number, i: number) => {
        if (i < 6) return null;
        const slice = history.slice(i - 6, i + 1);
        const avg = slice.reduce((a: number, b: number) => a + b, 0) / 7;
        return `${(i / (history.length - 1)) * width},${getY(avg)}`;
    }).filter((p: any) => p).join(' ');

    return (
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', height: '280px', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
         <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            {/* Grid Lines */}
            {[0.2, 0.4, 0.6, 0.8].map((p: number) => (
                <line key={p} x1="0" y1={chartHeight * p} x2={width} y2={chartHeight * p} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            
            {/* Volume Bars */}
            {history.map((p: number, i: number) => {
                const isUp = i > 0 ? p >= history[i-1] : true;
                const vHeight = (0.2 + Math.random() * 0.8) * volumeHeight; // Simulated volatility
                const x = (i / (history.length - 1)) * width;
                return (
                    <rect key={`v-${i}`} x={x - candleWidth/2} y={height - vHeight} width={candleWidth} height={vHeight} fill={isUp ? '#4ade8022' : '#f8717122'} rx="1" />
                );
            })}

            {/* Candlesticks */}
            {history.map((p: number, i: number) => {
                if (i === 0) return null;
                const prevP = history[i - 1];
                const x = (i / (history.length - 1)) * width;
                const open = prevP, close = p, isUp = close >= open, color = isUp ? '#4ade80' : '#f87171';
                const diff = Math.abs(close - open) || 5;
                const high = Math.max(open, close) + diff * 0.3, low = Math.min(open, close) - diff * 0.3;
                const yOpen = getY(open), yClose = getY(close), yHigh = getY(high), yLow = getY(low);
                return (
                    <g key={i}>
                        <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
                        <rect x={x - candleWidth / 2} y={Math.min(yOpen, yClose)} width={candleWidth} height={Math.max(2, Math.abs(yOpen - yClose))} fill={color} rx="1" style={{ filter: `drop-shadow(0 0 6px ${color}44)` }} />
                    </g>
                );
            })}
            
            {/* Moving Average Line */}
            <polyline points={maPoints} fill="none" stroke="var(--gold-color)" strokeWidth="2" strokeDasharray="4,2" opacity="0.6" style={{ filter: 'drop-shadow(0 0 4px var(--gold-color))' }} />

            {/* Current Price Tracker */}
            <g transform={`translate(0, ${getY(history[history.length - 1])})`}>
                <line x1="0" y1="0" x2={width} y2="0" stroke="var(--secondary-color)" strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
                <rect x={width - 60} y="-10" width="60" height="20" fill="var(--secondary-color)" rx="4" />
                <text x={width - 30} y="4" fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">{(history[history.length-1] + priceOffset).toFixed(1)}</text>
            </g>
         </svg>
         
         <div style={{ position: 'absolute', top: '12px', left: '12px', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Market Live • YT/AMD</div>
            </div>
         </div>
      </div>
    );
  };

  const renderMarketInsights = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {/* Sentiment Bar */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', opacity: 0.7 }}>
                <span>BULLISH</span>
                <span>BEARISH</span>
            </div>
            <div style={{ height: '8px', background: '#f87171', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${sentiment}%`, background: '#4ade80', height: '100%', transition: 'width 1s ease', boxShadow: '0 0 10px #4ade8044' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900', marginTop: '6px' }}>
                <span style={{ color: '#4ade80' }}>{sentiment}%</span>
                <span style={{ color: '#f87171' }}>{100 - sentiment}%</span>
            </div>
        </div>
        {/* Quick Stats */}
        <div className="glass-panel" style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '2px' }}>24H CHANGE</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>+4.28%</div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '6px 0' }}></div>
            <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '2px' }}>INDEX</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>EXTREME GREED</div>
        </div>
    </div>
  );

  const amounts = [100, 500, 1000, 2500, 5000];
  const durations = [{ label: '30S', value: 30 }, { label: '1M', value: 60 }, { label: '3M', value: 180 }];

  if (loading && !tradeStatus) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div className="spinner" style={{ width: '50px', height: '50px', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: 'var(--secondary-color)' }}></div>
      <div style={{ fontWeight: 'bold', color: 'var(--secondary-color)', letterSpacing: '2px' }}>SYNCING TERMINAL...</div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '110px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                  <TrendingUp size={20} color="white" />
              </div>
              <div>
                  <h1 style={{ fontSize: '20px', margin: 0, lineHeight: 1 }}>YT Terminal</h1>
                  <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 'bold' }}>VERSION 2.0 • PRO</span>
              </div>
          </div>
          <div className="glass-panel" style={{ padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
             <Coins size={14} color="var(--gold-color)" />
             <span style={{ fontWeight: '900', fontSize: '14px' }}>{balance.toLocaleString()}</span>
          </div>
      </div>

      {/* Ticker News */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '20px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', opacity: 0.6 }}>
            <span style={{ color: 'var(--primary-color)' }}>[ALERT] YT TOKEN SURGES +15% IN PRE-MARKET TRADING</span>
            <span>WHALE MOVEMENT DETECTED ON AMD PAIR</span>
            <span style={{ color: '#4ade80' }}>NETWORK STATUS: OPTIMAL</span>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--secondary-glow)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontWeight: '900', color: 'white' }}>YT</span>
              </div>
              <div>
                  <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: 'bold', marginBottom: '2px' }}>EXCHANGE RATE YT/AMD</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', textShadow: '0 0 30px var(--secondary-glow)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                     {((tradeStatus?.currentPrice || 7000) + priceOffset).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
              </div>
          </div>
          <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', opacity: 0.5 }}>STATUS</div>
              <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={10} /> VOLATILE
              </div>
          </div>
      </div>

      {/* Trading Chart */}
      {renderProfessionalChart()}

      {/* Sentiment & Insights */}
      <div style={{ marginTop: '20px' }}>
          {renderMarketInsights()}
      </div>

      {/* Control Panel */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="var(--gold-color)" fill="var(--gold-color)" /> AMOUNT
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }}>MAX: {balance}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
            {amounts.map(amt => (
                <button 
                  key={amt} 
                  className={`nav-item ${selectedAmount === amt ? 'active' : ''}`}
                  onClick={() => setSelectedAmount(amt)}
                  style={{ 
                      flex: 1, padding: '14px', borderRadius: '16px', background: selectedAmount === amt ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedAmount === amt ? 'var(--secondary-color)' : 'rgba(255,255,255,0.08)'}`,
                      fontSize: '14px', fontWeight: '900', transition: 'all 0.2s ease', height: 'auto', minWidth: '65px'
                  }}
                >
                    {amt}
                </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.5, marginBottom: '8px' }}>DURATION</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {durations.map(d => (
                            <button 
                                key={d.value} onClick={() => setSelectedDuration(d.value)}
                                style={{ 
                                    flex: 1, padding: '10px 0', borderRadius: '12px', background: selectedDuration === d.value ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selectedDuration === d.value ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                                    fontSize: '11px', fontWeight: 'bold'
                                }}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>
          </div>

          {activeBet ? (
              <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '20px', border: '1px solid var(--primary-color)', position: 'relative' }}>
                  <div style={{ fontSize: '12px', opacity: 0.6, letterSpacing: '2px', marginBottom: '4px' }}>ORDER EXECUTING</div>
                  <div style={{ fontSize: '16px', color: activeBet.direction === 'up' ? '#4ade80' : '#f87171', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {activeBet.direction === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />} 
                      {activeBet.direction === 'up' ? 'CALL' : 'PUT'} • {activeBet.amount} YT
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: '900', margin: '14px 0', color: 'var(--primary-color)', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px var(--primary-glow)' }}>
                      {Math.max(0, Math.ceil((activeBet.endTime - Date.now()) / 1000))}s
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', width: `${((activeBet.endTime - Date.now()) / (selectedDuration * 1000)) * 100}%` }}></div>
                  </div>
              </div>
          ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-primary" style={{ flex: 1, height: '70px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)', border: 'none', borderRadius: '20px', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  disabled={isPlacing || balance < selectedAmount} onClick={() => handlePlaceBet('up')} >
                  <TrendingUp size={26} /> CALL
                </button>
                <button className="btn-primary" style={{ flex: 1, height: '70px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', boxShadow: '0 10px 30px rgba(244, 63, 94, 0.3)', border: 'none', borderRadius: '20px', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  disabled={isPlacing || balance < selectedAmount} onClick={() => handlePlaceBet('down')} >
                  <TrendingDown size={26} /> PUT
                </button>
              </div>
          )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> SECURE TRADING
          </div>
          <div style={{ fontSize: '10px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={12} /> GLOBAL LIQUIDITY
          </div>
      </div>
    </div>
  );
};

export default Trade;
