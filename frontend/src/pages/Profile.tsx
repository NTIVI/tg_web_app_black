import React from 'react'
import { motion } from 'framer-motion'
import { Settings, Coins, Award, LogOut, User, ChevronRight } from 'lucide-react'

const Profile = ({ user }: any) => {
  if (!user) return null

  const avatar = user.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

  return (
    <div className="p-6 space-y-8 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мой Профиль</h1>
        <button className="p-2 glass-panel rounded-full text-text-muted hover:text-white transition-colors">
          <Settings size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-primary p-1">
            <img src={avatar} className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            LVL {user.level}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
          <p className="text-text-muted">{user.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-6 glass-panel rounded-3xl flex flex-col items-center justify-center space-y-2 border border-yellow-500/10"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
            <Coins size={24} />
          </div>
          <span className="text-2xl font-bold">{user.coins}</span>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Монетки</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="p-6 glass-panel rounded-3xl flex flex-col items-center justify-center space-y-2 border border-primary/10"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Award size={24} />
          </div>
          <span className="text-2xl font-bold">{user.level}</span>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Уровень</span>
        </motion.div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-text-muted ml-2">Настройки</h3>
        <div className="space-y-2">
          <button className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted">
              <User size={20} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold">Редактировать анкету</p>
              <p className="text-xs text-text-muted">Изменить фото, город или био</p>
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-red-500">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="font-bold">Выйти</span>
          </button>
        </div>
      </div>
      
      {user.isAdmin && (
        <button 
          onClick={() => window.location.href = '/admin'}
          className="w-full p-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-bold"
        >
          Панель администратора
        </button>
      )}
    </div>
  )
}



export default Profile
