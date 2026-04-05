import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { TrendingUp, TrendingDown, Coins, Clock, BarChart3 } from 'lucide-react';
import { createChart, ColorType } from 'lightweight-charts';
import type { ISeriesApi } from 'lightweight-charts';

const Trade = ({ tgUser, balance, setBalance }: any) => {
  const [tradeStatus, setTradeStatus] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPlacing, setIsPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBet, setActiveBet] = useState<any>(null);
  const pollInterval = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    fetchTradeStatus(true);
    pollInterval.current = setInterval(() => fetchTradeStatus(false), 10000); // 10s
    return () => clearInterval(pollInterval.current);
  }, []);

  const fetchTradeStatus = async (initial = false) => {
    try {
      const res = await fetch(`${API_URL}/trade/status`);
      const data = await res.json();
      setTradeStatus(data);
      if (data.history) updateChartData(data.history);
      if (initial) setLoading(false);
    } catch (err) {
      console.error("Trade status error:", err);
      if (initial) setLoading(false);
    }
  };

  const updateChartData = (history: number[]) => {
    if (!candleSeriesRef.current || !Array.isArray(history) || history.length < 1) return;
    
    // We need at least 2 points for a real candle open/close, 
    // but lightweight-charts can handle 1 point if necessary.
    const candleData = history.map((price, index) => {
      const prevPrice = history[index - 1] || price;
      const baseTime = Math.floor(Date.now() / 1000) - (history.length - index) * 300;
      
      const open = prevPrice;
      const close = price;
      const diff = Math.abs(close - open) || 10;
      const high = Math.max(open, close) + (diff * 0.2);
      const low = Math.min(open, close) - (diff * 0.2);
      
      return { time: baseTime as any, open, high, low, close };
    });
    
    try {
        candleSeriesRef.current.setData(candleData);
    } catch(e) {
        console.error("setData error:", e);
    }
  };

  // Initialize chart only once when container is ready
  useEffect(() => {
    if (loading || !chartContainerRef.current || chartInstanceRef.current) return;
    
    const width = chartContainerRef.current.clientWidth;
    if (width === 0) return;

    try {
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#94a3b8',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
          },
          width: width,
          height: 200,
          timeScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            timeVisible: true,
          },
        });

        const candleSeries = (chart as any).addCandlestickSeries({
          upColor: '#4ade80',
          downColor: '#f87171',
          borderVisible: false,
          wickUpColor: '#4ade80',
          wickDownColor: '#f87171',
        });

        chartInstanceRef.current = chart;
        candleSeriesRef.current = candleSeries;
        
        // Initial update
        if (tradeStatus?.history) {
            updateChartData(tradeStatus.history);
        }
        
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          chart.remove();
          chartInstanceRef.current = null;
          candleSeriesRef.current = null;
        };
    } catch (e) {
        console.error("Chart init error:", e);
    }
  }, [loading]); // Only trigger when loading finishes

  // Handle data updates separately
  useEffect(() => {
    if (candleSeriesRef.current && tradeStatus?.history) {
      updateChartData(tradeStatus.history);
    }
  }, [tradeStatus]);

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
    return (
      <div 
        ref={chartContainerRef} 
        style={{ 
            width: '100%', 
            height: '200px', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)'
        }} 
      />
    );
  };

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
            Следующий тик через ~{tradeStatus?.nextTickTime ? Math.max(0, Math.floor((tradeStatus.nextTickTime - Date.now()) / 1000)) : '...'} сек
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
