import { Outlet, NavLink } from 'react-router-dom'
import { LayoutGrid, MessageCircle, Star, User } from 'lucide-react'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-transparent text-text-main pb-24 overflow-x-hidden">
      <main className="max-w-md mx-auto min-h-screen relative">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <nav className="glass-panel-premium pointer-events-auto h-16 w-full max-w-sm rounded-[2rem] flex items-center justify-around px-2 relative">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 relative ${
                isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutGrid size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''} />
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/chats"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 relative ${
                isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <MessageCircle size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''} />
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/news"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 relative ${
                isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Star size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''} />
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 relative ${
                isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : ''} />
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  )
}

export default MainLayout
