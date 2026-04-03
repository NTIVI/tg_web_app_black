import { useState, useEffect, useCallback } from 'react';
import { Gift, X, Sparkles, Coins, Clock } from 'lucide-react';
import { API_URL } from '../config';

interface DailyBonusModalProps {
  userId: string;
  onClaim: (reward: number) => void;
  onClose: () => void;
}

const DailyBonusModal = ({ userId, onClaim, onClose }: DailyBonusModalProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/bonus/daily/${userId}`);
      const statusData = await res.json();
      setData(statusData);
      // If it's already claimed and we're just checking, don't show the modal if not canClaim
      if (statusData && !statusData.canClaim) {
          onClose(); // Auto-close if not claimable (safeguard)
      }
    } catch (e) {
      console.error(e);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [userId, onClose]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClaim = async () => {
    if (!data?.canClaim || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`${API_URL}/bonus/daily/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: userId })
      });
      const resData = await res.json();
      if (resData.success) {
        onClaim(resData.reward);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !data?.canClaim) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)'
    }}>
      <div 
        className="glass-panel"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.4)',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.2)',
          textAlign: 'center',
          position: 'relative',
          animation: 'modalFadeIn 0.4s ease-out'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(255, 165, 0, 0.3)',
          animation: 'bounce 2s infinite'
        }}>
          <Gift size={40} color="white" />
        </div>

        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '900', 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Ежедневный Бонус!
        </h1>
        
        <p style={{ 
          marginBottom: '24px', 
          opacity: 0.8, 
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Заходи каждый день в 12:00 и 00:00 (UTC), чтобы забирать бесплатные монеты!
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <Coins size={32} color="#FFD700" />
          <span style={{ fontSize: '32px', fontWeight: '900', color: '#FFD700' }}>+250</span>
        </div>

        <button
          className="btn-primary"
          onClick={handleClaim}
          disabled={claiming}
          style={{
            width: '100%',
            height: '56px',
            fontSize: '18px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            color: 'black',
            boxShadow: '0 6px 15px rgba(255, 165, 0, 0.3)'
          }}
        >
          {claiming ? <div className="spinner" style={{ borderTopColor: 'black' }}></div> : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              Забрать монеты
            </div>
          )}
        </button>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default DailyBonusModal;
