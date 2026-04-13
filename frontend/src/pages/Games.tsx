import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dices, 
  CircleDot, 
  Clubs, 
  TrendingUp, 
  ArrowDownCircle, 
  Bomb, 
  Coins, 
  ArrowUpDown, 
  Zap,
  Gamepad2,
  Trophy,
  History,
  Star
} from 'lucide-react';

const GAME_LIST = [
  { id: 'slots', name: 'Слоты', icon: <Gamepad2 size={32} />, color: '#f59e0b', desc: 'Классические игровые автоматы' },
  { id: 'roulette', name: 'Рулетка', icon: <CircleDot size={32} />, color: '#ef4444', desc: 'Европейская рулетка' },
  { id: 'blackjack', name: 'Блэкджек', icon: <Clubs size={32} />, color: '#3b82f6', desc: 'Набери 21 и обыграй дилера' },
  { id: 'crash', name: 'Crash', icon: <TrendingUp size={32} />, color: '#10b981', desc: 'Успей забрать до взрыва' },
  { id: 'plinko', name: 'Plinko', icon: <ArrowDownCircle size={32} />, color: '#a855f7', desc: 'Падение шарика за множителем' },
  { id: 'mines', name: 'Mines', icon: <Bomb size={32} />, color: '#f43f5e', desc: 'Найди алмазы, обходи мины' },
  { id: 'dice', name: 'Dice', icon: <Dices size={32} />, color: '#6366f1', desc: 'Угадай число на костях' },
  { id: 'coinflip', name: 'Coin Flip', icon: <Coins size={32} />, color: '#fbbf24', desc: 'Орел или Решка?' },
  { id: 'hilo', name: 'Hi-Lo', icon: <ArrowUpDown size={32} />, color: '#2dd4bf', desc: 'Больше или меньше следующая?' },
  { id: 'wheel', name: 'Wheel', icon: <Zap size={32} />, color: '#8b5cf6', desc: 'Колесо фортуны' },
];

const Games: React.FC<any> = ({ balance }) => {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <header style={{ 
        marginBottom: '32px', 
        textAlign: 'center',
        position: 'relative' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '200px', 
          height: '60px', 
          background: 'var(--primary-glow)', 
          filter: 'blur(40px)', 
          opacity: 0.3,
          zIndex: 0 
        }} />
        
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '900', 
          margin: '0', 
          background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          position: 'relative',
          zIndex: 1
        }}>Игровой Зал</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>Испытай свою удачу и приумножь капитал!</p>
      </header>

      {/* Stats Mini Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <Trophy size={18} color="var(--gold-color)" />
          <div>
            <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800' }}>Ваш Баланс</div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--gold-color)' }}>${((balance || 0) / 100).toFixed(2)}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
          <History size={18} color="var(--primary-color)" />
          <div>
            <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800' }}>Всего Игр</div>
            <div style={{ fontSize: '16px', fontWeight: '900' }}>248</div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px' 
      }}>
        {GAME_LIST.map((game) => (
          <div 
            key={game.id}
            onClick={() => navigate(`/games/${game.id}`)}
            className="game-card"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '24px',
              padding: '24px 16px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Hover Glow */}
            <div className="game-card-glow" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              width: '100px', 
              height: '100px', 
              background: game.color, 
              filter: 'blur(40px)', 
              opacity: 0, 
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.3s'
            }} />

            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '18px', 
              background: `linear-gradient(135deg, ${game.color}22, ${game.color}44)`, 
              border: `1px solid ${game.color}44`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: game.color,
              boxShadow: `0 8px 16px ${game.color}11`,
              position: 'relative',
              zIndex: 1
            }}>
              {game.icon}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: '800', fontSize: '17px', color: '#fff', marginBottom: '4px' }}>{game.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', lineHeight: '1.4' }}>{game.desc}</div>
            </div>

            <div style={{ 
              marginTop: '8px',
              padding: '6px 16px', 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.05)', 
              fontSize: '12px', 
              fontWeight: '800',
              color: game.color,
              border: `1px solid ${game.color}22`
            }}>
              ИГРАТЬ
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .game-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }
        .game-card:hover .game-card-glow {
          opacity: 0.15;
        }
        .game-card:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
};

export default Games;
