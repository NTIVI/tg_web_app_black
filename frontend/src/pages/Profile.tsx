import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Coins, Award, LogOut, User, ChevronRight, X, Trash2, Info, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api'

const Profile = ({ user }: any) => {
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'menu' | 'account' | 'info'>('menu')
  
  if (!user) return null

  const avatar = user.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

  const handleDeleteAccount = async () => {
    if (window.confirm('ВНИМАНИЕ: Это действие навсегда удалит ваш аккаунт, все фотографии и переписки. Вы уверены?')) {
      try {
        await adminApi.deleteUser(user.id)
        localStorage.clear()
        window.location.reload()
      } catch (error) {
        console.error(error)
        alert('Ошибка при удалении аккаунта')
      }
    }
  }

  const renderSettingsContent = () => {
    if (activeSettingsTab === 'account') {
      return (
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveSettingsTab('menu')} className="p-2 glass-panel rounded-full hover:bg-white/10">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <h2 className="text-xl font-bold">Аккаунт</h2>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4 text-sm">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-text-muted">Telegram ID</span>
              <span className="font-bold">{user.telegramId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-text-muted">Имя Фамилия</span>
              <span className="font-bold">{user.firstName} {user.lastName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-text-muted">Пол</span>
              <span className="font-bold capitalize">{user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : 'Не указан'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-text-muted">Дата рождения</span>
              <span className="font-bold">{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'Не указана'}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-text-muted">Город</span>
              <span className="font-bold">{user.city || 'Не указан'}</span>
            </div>
          </div>

          <button 
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={20} />
            Удалить аккаунт навсегда
          </button>
        </motion.div>
      )
    }

    if (activeSettingsTab === 'info') {
      return (
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveSettingsTab('menu')} className="p-2 glass-panel rounded-full hover:bg-white/10">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <h2 className="text-xl font-bold">Информация</h2>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-primary/20 space-y-4">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Award size={24} />
              <h3 className="font-bold text-lg">Как работают уровни?</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Ваш уровень показывает вашу активность в приложении. Чем больше вы общаетесь, получаете лайки и заходите в приложение, тем выше ваш уровень. Высокий уровень повышает вашу видимость в ленте!
            </p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-yellow-500/20 space-y-4">
            <div className="flex items-center gap-3 text-yellow-500 mb-2">
              <Coins size={24} />
              <h3 className="font-bold text-lg">Зачем нужны монеты?</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Монеты — это внутренняя валюта. Вы получаете их за ежедневный вход (Ежедневный бонус) и за взаимные симпатии. В будущем за монеты можно будет покупать супер-лайки, подарки и премиум-статус.
            </p>
          </div>
        </motion.div>
      )
    }

    // Default menu
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <h2 className="text-xl font-bold mb-6">Настройки приложения</h2>
        
        <button 
          onClick={() => setActiveSettingsTab('account')}
          className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UserCircle size={20} />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold">Мой Аккаунт</p>
            <p className="text-[10px] text-text-muted uppercase">Данные и удаление профиля</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>

        <button 
          onClick={() => setActiveSettingsTab('info')}
          className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Info size={20} />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold">Информация</p>
            <p className="text-[10px] text-text-muted uppercase">Уровни и монеты</p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="p-6 space-y-8 h-[calc(100vh-64px)] overflow-y-auto pb-24 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мой Профиль</h1>
        <button 
          onClick={() => {
            setActiveSettingsTab('menu')
            setIsSettingsOpen(true)
          }}
          className="p-2 glass-panel rounded-full text-text-muted hover:text-white transition-colors"
        >
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

      {user.photos && user.photos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase text-text-muted ml-2">Мои фотографии</h3>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar px-2">
            {[...user.photos].sort((a: any, b: any) => a.order - b.order).map((photo: any) => (
              <div key={photo.id || photo.order} className="min-w-[140px] w-[140px] h-[180px] rounded-2xl overflow-hidden snap-center relative border border-white/10 shrink-0 shadow-lg">
                <img src={photo.url} className="w-full h-full object-cover" />
                {photo.isAvatar && (
                  <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    Аватар
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-text-muted ml-2">Настройки</h3>
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/edit-profile')}
            className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors"
          >
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
      
      { (user.isAdmin || user.telegramId === '6444802382' || user.telegramId === '12345678' || user.telegramId === '5966820526') && (
        <button 
          onClick={() => navigate('/admin')}
          className="w-full p-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-bold"
        >
          Панель администратора
        </button>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-dark/95 backdrop-blur-xl"
          >
            <div className="flex justify-end p-4">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-20">
              {renderSettingsContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Profile
