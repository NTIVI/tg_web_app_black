import { Outlet, NavLink } from 'react-router-dom';
import { Play, ShoppingBag, User, ShieldAlert } from 'lucide-react';

const Layout = () => {
  return (
    <div className="app-container">
      <Outlet />
      
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
        
        <NavLink 
          to="/admin" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShieldAlert size={24} />
          <span>Admin</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
