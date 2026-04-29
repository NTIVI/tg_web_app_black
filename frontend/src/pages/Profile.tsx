import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Award, LogOut, ChevronRight, X, Trash2, Info, UserCircle, Settings2, Unlock, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi, userApi } from '../api'

const Profile = ({ user }: any) => {
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'menu' | 'account' | 'info' | 'blocked'>('menu')
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  
  if (!user) return null

  const avatar = user.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

  useEffect(() => {
    if (activeSettingsTab === 'blocked') {
      setLoadingBlocked(true)
      userApi.getBlockedUsers(user.id)
        .then(res => setBlockedUsers(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoadingBlocked(false))
    }
  }, [activeSettingsTab, user.id])

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

  const handleUnblock = async (targetId: string) => {
    try {
      await userApi.unblockUser(user.id, targetId)
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId))
    } catch (error) {
      console.error('Failed to unblock', error)
      alert('Ошибка при разблокировке')
    }
  }

  const renderSettingsContent = () => {
    if (activeSettingsTab === 'blocked') {
      return (
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveSettingsTab('menu')} className="p-2 glass-panel rounded-full hover:bg-white/10">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <h2 className="text-xl font-bold">Заблокированные</h2>
          </div>

          <div className="space-y-3">
            {loadingBlocked ? (
              <p className="text-text-muted text-center py-10">Загрузка...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                  <ShieldAlert size={32} />
                </div>
                <p className="text-text-muted">У вас нет заблокированных пользователей.</p>
              </div>
            ) : (
              blockedUsers.map(blockedUser => {
                const blockedAvatar = blockedUser.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'
                return (
                  <div key={blockedUser.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                    <img src={blockedAvatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    <div className="flex-1">
                      <h3 className="font-bold">{blockedUser.firstName}</h3>
                      <p className="text-xs text-text-muted">{blockedUser.city || 'Нет города'}</p>
                    </div>
                    <button 
                      onClick={() => handleUnblock(blockedUser.id)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Unlock size={14} />
                      Разблок.
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      )
    }

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
          onClick={() => setActiveSettingsTab('blocked')}
          className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <ShieldAlert size={20} />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold">Заблокированные</p>
            <p className="text-[10px] text-text-muted uppercase">Управление ЧС</p>
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

        { (user.isAdmin || user.telegramId === '6444802382' || user.telegramId === '12345678' || user.telegramId === '5966820526') && (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full p-4 mt-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl font-bold hover:bg-primary/20 transition-colors"
          >
            Панель администратора
          </button>
        )}

        <button 
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="w-full p-4 glass-panel rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-red-500 mt-4"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="font-bold">Выйти</span>
        </button>
      </motion.div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto pb-24 relative bg-dark">
      
      {/* Top Header Section - Instagram Style */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
        
        {/* Left: Avatar with Note Badge */}
        <div className="relative shrink-0">
          <div className="absolute -top-4 -right-2 bg-dark-lighter px-3 py-1.5 rounded-2xl rounded-bl-sm z-10 shadow-xl border border-white/5 pointer-events-none">
            <span className="text-[10px] font-medium text-text-muted">Заметка...</span>
            <div className="absolute -bottom-1 left-2 w-2 h-2 bg-dark-lighter rounded-full"></div>
            <div className="absolute -bottom-2 left-3 w-1 h-1 bg-dark-lighter rounded-full"></div>
          </div>
          <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-dark-lighter to-dark-light">
            <div className="w-full h-full rounded-full border-2 border-dark overflow-hidden">
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Right: Info & Stats */}
        <div className="flex-1 ml-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold truncate max-w-[150px]">
              {user.firstName} {user.lastName}
            </h2>
            {user.level > 10 && <Award size={16} className="text-primary" />}
          </div>
          <p className="text-xs text-text-muted mb-3 font-medium">NTIVI STUDIO {user.city ? `• ${user.city}` : ''}</p>
          
          <div className="flex gap-4">
            <div className="text-center">
              <div className="font-extrabold text-sm">{user.level}</div>
              <div className="text-[10px] text-text-muted">Уровень</div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-sm">{user.coins}</div>
              <div className="text-[10px] text-text-muted">Монеток</div>
            </div>
            <div className="text-center">
              <div className="font-extrabold text-sm">{user.photos?.length || 0}</div>
              <div className="text-[10px] text-text-muted">Фото</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="px-4 py-4 space-y-1 text-sm border-b border-white/5">
        <h3 className="text-xs uppercase text-text-muted font-bold tracking-wider mb-2">О себе</h3>
        {user.bio ? (
          <p className="whitespace-pre-wrap text-text-main/90 leading-relaxed text-[13px]">
            {user.bio}
          </p>
        ) : (
          <p className="text-text-muted text-xs italic">Информация о себе не заполнена</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-4 flex gap-2">
        <button 
          onClick={() => navigate('/edit-profile')}
          className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-2 rounded-xl text-sm transition-colors"
        >
          Редактировать профиль
        </button>
        <button 
          onClick={() => {
            setActiveSettingsTab('menu')
            setIsSettingsOpen(true)
          }}
          className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Settings2 size={16} />
          Настройки
        </button>
      </div>

      {/* Photo Grid (3 Columns) */}
      <div className="px-1 mt-2">
        <div className="grid grid-cols-3 gap-1">
          {user.photos && user.photos.length > 0 ? (
            [...user.photos].sort((a: any, b: any) => a.order - b.order).map((photo: any) => (
              <div key={photo.id || photo.order} className="aspect-square relative group overflow-hidden bg-dark-lighter">
                <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {photo.isAvatar && (
                  <div className="absolute top-1 right-1">
                    <UserCircle size={16} className="text-white drop-shadow-md" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 text-text-muted text-sm">
              Нет загруженных фотографий
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-dark/95 backdrop-blur-2xl"
          >
            <div className="flex justify-end p-4 border-b border-white/5">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-text-muted hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {renderSettingsContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Profile
