import { useState, useEffect } from 'react'
import { adminApi } from '../api'
import { Shield, UserX, AlertCircle, Trash2 } from 'lucide-react'

const Admin = ({ user }: any) => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getUsers()
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await adminApi.blockUser(id, isBlocked)
      setUsers(users.map(u => u.id === id ? { ...u, isBlocked } : u))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('ВНИМАНИЕ: Это полностью удалит пользователя и все его данные (фото, чаты). Продолжить?')) return
    try {
      await adminApi.deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      console.error(err)
      alert('Ошибка при удалении')
    }
  }

  const handleDeletePhoto = async (userId: string, photoId: string) => {
    if (!window.confirm('Удалить эту фотографию?')) return
    try {
      await adminApi.deletePhoto(photoId)
      setUsers(users.map(u => u.id === userId ? { ...u, photos: u.photos.filter((p: any) => p.id !== photoId) } : u))
    } catch (err) {
      console.error(err)
    }
  }

  if (!user?.isAdmin) return <div className="p-10 text-center">Доступ запрещен</div>
  if (loading) return <div className="p-10 text-center text-text-muted animate-pulse">Загрузка данных...</div>

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-64px)] overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold">Панель управления</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase text-text-muted ml-2">Пользователи ({users.length})</h2>
        
        {users.map((u) => (
          <div key={u.id} className="p-4 glass-panel rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={u.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/50'} 
                  className="w-12 h-12 rounded-full object-cover border border-white/10" 
                />
                {u.isBlocked && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-dark">
                    <UserX size={10} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{u.firstName} {u.lastName}</h3>
                  <span className="text-[10px] text-text-muted">@{u.telegramId}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-primary">LVL {u.level}</span>
                  <span className="text-yellow-500">{u.coins} COINS</span>
                </div>
              </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBlock(u.id, !u.isBlocked)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      u.isBlocked 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                    }`}
                  >
                    {u.isBlocked ? 'Разблок.' : 'Блок.'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            {u.photos && u.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {u.photos.map((p: any, idx: number) => (
                  <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden glass-panel flex-shrink-0 group">
                    <img src={p.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <button 
                      onClick={() => handleDeletePhoto(u.id, p.id)}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserX size={8} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!u.intent && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
                <AlertCircle size={16} className="text-yellow-500" />
                <span className="text-[10px] text-yellow-500 font-bold">Анкета не заполнена</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin
