import { useState, useEffect } from 'react'
import { adminApi, newsApi } from '../api'
import { Shield, UserX, AlertCircle, Trash2, Plus, Users, Newspaper, Coins } from 'lucide-react'

const Admin = ({ user }: any) => {
  const [activeTab, setActiveTab] = useState<'users' | 'news' | 'economy'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // News form state
  const [newsTitle, setNewsTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [newsImageUrl, setNewsImageUrl] = useState('')

  // Economy state
  const [economyData, setEconomyData] = useState<Record<string, { level: number, coins: number }>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, newsRes] = await Promise.all([
        adminApi.getUsers(),
        newsApi.getNews()
      ])
      setUsers(usersRes.data)
      setNews(newsRes.data)
      
      const initialEco: Record<string, { level: number, coins: number }> = {}
      usersRes.data.forEach((u: any) => {
        initialEco[u.id] = { level: u.level, coins: u.coins }
      })
      setEconomyData(initialEco)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreateNews = async () => {
    if (!newsTitle || !newsContent) return alert('Заполните заголовок и текст')
    try {
      await newsApi.createNews({ title: newsTitle, content: newsContent, imageUrl: newsImageUrl })
      setNewsTitle('')
      setNewsContent('')
      setNewsImageUrl('')
      fetchData() // Refresh news
    } catch (error) {
      console.error(error)
      alert('Ошибка при создании новости')
    }
  }

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Удалить новость?')) return
    try {
      await newsApi.deleteNews(id)
      setNews(news.filter(n => n.id !== id))
    } catch (error) {
      console.error(error)
      alert('Ошибка при удалении')
    }
  }

  const handleSaveEconomy = async (id: string) => {
    try {
      const data = economyData[id]
      await adminApi.adjustStats(id, data.level, data.coins)
      alert('Сохранено!')
      setUsers(users.map(u => u.id === id ? { ...u, level: data.level, coins: data.coins } : u))
    } catch (error) {
      console.error(error)
      alert('Ошибка сохранения')
    }
  }

  if (!user?.isAdmin) return <div className="p-10 text-center">Доступ запрещен</div>
  if (loading) return <div className="p-10 text-center text-text-muted animate-pulse">Загрузка данных...</div>

  return (
    <div className="p-4 space-y-6 h-[calc(100vh-64px)] overflow-y-auto pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <Shield size={24} />
        </div>
        <h1 className="text-2xl font-bold">Панель управления</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark/50 p-1 rounded-xl border border-white/5">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white' : 'text-text-muted'}`}
        >
          <Users size={14} /> Пользователи
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'news' ? 'bg-primary text-white' : 'text-text-muted'}`}
        >
          <Newspaper size={14} /> Новости
        </button>
        <button 
          onClick={() => setActiveTab('economy')}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'economy' ? 'bg-primary text-white' : 'text-text-muted'}`}
        >
          <Coins size={14} /> Экономика
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-text-muted ml-2">Все пользователи ({users.length})</h2>
          
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
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Plus size={16} className="text-primary"/> Создать новость</h2>
            <input 
              type="text" 
              placeholder="Заголовок" 
              className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
              value={newsTitle}
              onChange={e => setNewsTitle(e.target.value)}
            />
            <textarea 
              placeholder="Текст новости..." 
              className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors h-24 resize-none text-sm"
              value={newsContent}
              onChange={e => setNewsContent(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Ссылка на картинку (опционально)" 
              className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 outline-none focus:border-primary transition-colors text-sm"
              value={newsImageUrl}
              onChange={e => setNewsImageUrl(e.target.value)}
            />
            <button onClick={handleCreateNews} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors">
              Опубликовать
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-text-muted ml-2">Опубликованные новости ({news.length})</h2>
            {news.map(n => (
              <div key={n.id} className="glass-panel p-4 rounded-2xl border border-white/5 relative">
                <button onClick={() => handleDeleteNews(n.id)} className="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-xl">
                  <Trash2 size={16} />
                </button>
                {n.imageUrl && <img src={n.imageUrl} className="w-full h-32 object-cover rounded-xl mb-3" />}
                <h3 className="font-bold text-lg">{n.title}</h3>
                <p className="text-sm text-text-muted mt-2 whitespace-pre-wrap pr-10">{n.content}</p>
                <div className="text-[10px] text-text-muted mt-3">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Economy Tab */}
      {activeTab === 'economy' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-text-muted ml-2">Экономика пользователей</h2>
          {users.map(u => (
            <div key={u.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={u.photos?.find((p:any) => p.isAvatar)?.url || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold">{u.firstName}</h3>
                  <span className="text-xs text-text-muted">@{u.telegramId}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase font-bold ml-1">Уровень</label>
                  <input 
                    type="number" 
                    value={economyData[u.id]?.level || 0}
                    onChange={(e) => setEconomyData({...economyData, [u.id]: { ...economyData[u.id], level: Number(e.target.value) }})}
                    className="w-full bg-dark/50 border border-white/10 rounded-xl p-2 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-yellow-500 uppercase font-bold ml-1">Монеты</label>
                  <input 
                    type="number" 
                    value={economyData[u.id]?.coins || 0}
                    onChange={(e) => setEconomyData({...economyData, [u.id]: { ...economyData[u.id], coins: Number(e.target.value) }})}
                    className="w-full bg-dark/50 border border-white/10 rounded-xl p-2 text-center text-yellow-500 font-bold"
                  />
                </div>
              </div>
              <button 
                onClick={() => handleSaveEconomy(u.id)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Сохранить изменения
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Admin

