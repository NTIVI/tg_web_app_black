import { motion } from 'framer-motion'
import { Gift, Zap, Bell, Sparkles } from 'lucide-react'
import { userApi, newsApi } from '../api'
import { useState, useEffect } from 'react'

const News = ({ user, setUser }: any) => {
  const [claiming, setClaiming] = useState(false)
  const [newsList, setNewsList] = useState<any[]>([])
  
  const isClaimedToday = user?.lastBonusClaim && 
    new Date(user.lastBonusClaim).toDateString() === new Date().toDateString();

  const bonuses = [
    { 
      id: 'daily',
      title: 'Ежедневный бонус', 
      desc: 'Заходите каждый день и получайте 5 монеток!', 
      icon: <Gift className="text-yellow-500" />, 
      active: !isClaimedToday,
      btnText: isClaimedToday ? 'Получено' : 'Забрать'
    },
    { title: 'Супер-Лайк', desc: 'Удвойте шансы на взаимность!', icon: <Zap className="text-blue-400" />, active: false, btnText: 'Скоро' },
    { title: 'Режим Невидимки', desc: 'Скройте свой онлайн-статус на 24 часа.', icon: <Sparkles className="text-purple-400" />, active: false, btnText: 'Скоро' },
  ]

  useEffect(() => {
    newsApi.getNews()
      .then(res => setNewsList(res.data))
      .catch(err => console.error('Failed to fetch news', err))
  }, [])

  const handleClaim = async (id: string) => {
    if (id !== 'daily' || isClaimedToday || claiming) return
    
    setClaiming(true)
    try {
      const res = await userApi.claimDailyBonus(user.id)
      if (res.data.success) {
        setUser({ ...user, coins: res.data.coins, lastBonusClaim: new Date().toISOString() })
        alert('Поздравляем! Вы получили 5 монеток. 🪙')
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка при получении бонуса')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="p-6 space-y-8 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Новости и Бонусы</h1>
        <button className="p-2 glass-panel rounded-full text-text-muted">
          <Bell size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">Акции для вас</h3>
        {bonuses.map((b, i) => (
          <motion.div
            key={i}
            whileHover={b.active ? { scale: 1.02 } : {}}
            className={`p-5 glass-panel rounded-3xl flex items-center gap-5 border border-white/5 ${!b.active && 'opacity-60'}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
              {b.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{b.title}</h4>
              <p className="text-xs text-text-muted">{b.desc}</p>
            </div>
            <button 
              disabled={!b.active || claiming}
              onClick={() => b.id && handleClaim(b.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                b.active 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' 
                  : 'bg-white/10 text-text-muted'
              }`}
            >
              {claiming && b.id === 'daily' ? '...' : b.btnText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">Новости проекта</h3>
        
        {newsList.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">Пока нет новостей</div>
        ) : (
          newsList.map(n => (
            <div key={n.id} className="rounded-3xl overflow-hidden glass-panel mb-4 border border-white/5">
              {n.imageUrl && (
                <img src={n.imageUrl} className="w-full h-40 object-cover" />
              )}
              <div className="p-5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Обновление</span>
                  <span className="text-[10px] text-text-muted uppercase">
                    {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h4 className="text-xl font-bold">{n.title}</h4>
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                  {n.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default News
