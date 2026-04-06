import React from 'react';
import { Gift, DollarSign } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClaim: () => void;
  streak: number;
  reward: number;
  loading: boolean;
}

const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ 
  isOpen, 
  onClaim, 
  streak, 
  reward,
  loading 
}) => {
  if (!isOpen) return null;

  const steps = [10, 20, 50, 100, 150, 200, 500];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '360px',
        padding: '32px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(157, 80, 187, 0.4)',
        background: 'linear-gradient(180deg, rgba(30, 20, 45, 0.95) 0%, rgba(15, 10, 25, 0.98) 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(157, 80, 187, 0.2)'
      }}>
        {/* Decorative Light */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'var(--primary-glow)',
          filter: 'blur(60px)',
          opacity: 0.3,
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 10px 20px rgba(157, 80, 187, 0.4)'
          }}>
            <Gift size={40} color="white" />
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Daily Bonus!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
            Come back every day to increase your streak and rewards.
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: '20px', 
            padding: '20px', 
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <DollarSign size={32} color="var(--gold-color)" />
              <span style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>+${(reward / 100).toFixed(2)}</span>
            </div>
            
            {/* Streak Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
              {steps.map((_, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    borderRadius: '3px',
                    background: i < streak ? 'var(--primary-color)' : (i === streak ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)')
                  }} />
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '700', 
                    color: i < streak ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase'
                  }}>
                    Day {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={onClaim}
            disabled={loading}
            style={{ 
              width: '100%', 
              height: '60px', 
              fontSize: '18px', 
              fontWeight: '800', 
              borderRadius: '20px',
              boxShadow: '0 10px 25px rgba(157, 80, 187, 0.3)'
            }}
          >
            {loading ? <div className="spinner" style={{ width: '24px', height: '24px' }}></div> : 'Claim Reward'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyBonusModal;
