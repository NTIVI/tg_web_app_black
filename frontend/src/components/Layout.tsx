import { Outlet, NavLink } from 'react-router-dom';
import { Play, ShoppingBag, User } from 'lucide-react';
import AdBanner from './AdBanner';

const Layout = () => {
  return (
    <div className="app-container">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
      <AdBanner />
      
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
          to="/shop" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={24} />
          <span>Shop</span>
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
