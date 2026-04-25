import { Outlet, NavLink } from 'react-router-dom'
import { LayoutGrid, MessageCircle, Star, User } from 'lucide-react'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-dark text-text-main pb-20 overflow-x-hidden">
      <main className="max-w-md mx-auto min-h-screen relative">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-white/5 z-50 flex items-center justify-around px-2 max-w-md mx-auto">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-full transition-all ${
              isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
            }`
          }
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] mt-1 font-medium">Лента</span>
        </NavLink>

        <NavLink
          to="/chats"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-full transition-all ${
              isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
            }`
          }
        >
          <MessageCircle size={24} />
          <span className="text-[10px] mt-1 font-medium">Чаты</span>
        </NavLink>

        <NavLink
          to="/news"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-full transition-all ${
              isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
            }`
          }
        >
          <Star size={24} />
          <span className="text-[10px] mt-1 font-medium">Новости</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-full transition-all ${
              isActive ? 'text-primary scale-110' : 'text-text-muted hover:text-white'
            }`
          }
        >
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">Профиль</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default MainLayout
