import { Outlet, NavLink } from 'react-router-dom';
import { Play, ShoppingBag, User, Trophy, Gift, TrendingUp } from 'lucide-react';
const Layout = () => {
  return (
    <div className="app-container">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Play size={24} />
          <span>Start</span>
        </NavLink>

        <NavLink 
          to="/trade" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <TrendingUp size={24} />
          <span>Трейд</span>
        </NavLink>
        
        <NavLink 
          to="/shop" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={24} />
          <span>Shop</span>
        </NavLink>

        <NavLink 
          to="/top" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Trophy size={24} />
          <span>Top</span>
        </NavLink>

        <NavLink 
          to="/bonuses" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Gift size={24} />
          <span>Bonus</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={24} />
          <span>Profile</span>
        </NavLink>
        
      </nav>
    </div>
  );
};

export default Layout;
