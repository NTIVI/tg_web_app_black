import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Play, ShoppingBag, User, Trophy, Gift, Smartphone } from 'lucide-react';
const Layout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet key={location.pathname} />
      </div>
      
      <nav className="bottom-nav">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Play size={24} />
          <span>Старт</span>
        </NavLink>

        <NavLink 
          to="/nfc" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Smartphone size={24} />
          <span>Акции</span>
        </NavLink>
        
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={24} />
          <span>Магазин</span>
        </NavLink>

        <NavLink 
          to="/top" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Trophy size={24} />
          <span>Топ</span>
        </NavLink>

        <NavLink 
          to="/bonuses" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Gift size={24} />
          <span>Бонусы</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={24} />
          <span>Профиль</span>
        </NavLink>
        
      </nav>
    </div>
  );
};

export default Layout;
