import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet, Info, History } from 'lucide-react';

// Individual Game Components (to be implemented)
import Slots from '../components/games/Slots';
import Roulette from '../components/games/Roulette';
import Blackjack from '../components/games/Blackjack';
import Crash from '../components/games/Crash';
import Plinko from '../components/games/Plinko';
import Mines from '../components/games/Mines';
import Dice from '../components/games/Dice';
import CoinFlip from '../components/games/CoinFlip';
import HiLo from '../components/games/HiLo';
import Wheel from '../components/games/WheelOfFortune';

const GAME_INFO: Record<string, { name: string, color: string }> = {
  slots: { name: 'Слоты', color: '#f59e0b' },
  roulette: { name: 'Рулетка', color: '#ef4444' },
  blackjack: { name: 'Блэкджек', color: '#3b82f6' },
  crash: { name: 'Crash', color: '#10b981' },
  plinko: { name: 'Plinko', color: '#a855f7' },
  mines: { name: 'Mines', color: '#f43f5e' },
  dice: { name: 'Dice', color: '#6366f1' },
  coinflip: { name: 'Coin Flip', color: '#fbbf24' },
  hilo: { name: 'Hi-Lo', color: '#2dd4bf' },
  wheel: { name: 'Wheel', color: '#8b5cf6' },
};

const GamePage = ({ balance, setBalance, tgUser, setTgUser }: any) => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const game = gameId ? GAME_INFO[gameId] : null;

  useEffect(() => {
    if (!game) navigate('/games');
    // Fetch game history here if needed
  }, [gameId, game, navigate]);

  if (!game) return null;

  const renderGame = () => {
    const props = { balance, setBalance, tgUser, setTgUser, gameId };
    switch (gameId) {
      case 'slots': return <Slots {...props} />;
      case 'roulette': return <Roulette {...props} />;
      case 'blackjack': return <Blackjack {...props} />;
      case 'crash': return <Crash {...props} />;
      case 'plinko': return <Plinko {...props} />;
      case 'mines': return <Mines {...props} />;
      case 'dice': return <Dice {...props} />;
      case 'coinflip': return <CoinFlip {...props} />;
      case 'hilo': return <HiLo {...props} />;
      case 'wheel': return <Wheel {...props} />;
      default: return <div style={{ textAlign: 'center', padding: '40px' }}>Game not found</div>;
    }
  };

  return (
    <div className="game-page-container" style={{ 
      minHeight: '100vh', 
      background: '#0a0a0c', 
      color: '#fff',
      paddingBottom: '80px'
    }}>
      {/* Premium Header */}
      <header style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => navigate('/games')}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={24} />
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{game.name}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Wallet size={16} color="var(--gold-color)" />
          <span style={{ fontWeight: '800', color: 'var(--gold-color)' }}>${((balance || 0) / 100).toFixed(2)}</span>
        </div>
      </header>

      {/* Game Area */}
      <main style={{ padding: '20px' }}>
        {renderGame()}
      </main>

      {/* Floating Action Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        zIndex: 50
      }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
        >
          <History size={20} />
        </button>
        <button 
          style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
        >
          <Info size={20} />
        </button>
      </div>

      {/* History Modal (Simple Overlay) */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
                <h3 style={{ marginTop: 0 }}>История раундов</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <p style={{ opacity: 0.5 }}>Функционал истории скоро появится...</p>
                </div>
                <button 
                    onClick={() => setShowHistory(false)}
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '20px' }}
                >
                    Закрыть
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
