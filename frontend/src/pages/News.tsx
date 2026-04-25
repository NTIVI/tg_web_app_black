import React from 'react'
import { motion } from 'framer-motion'
import { Gift, Zap, Bell, Sparkles } from 'lucide-react'

const News = ({ user }: any) => {
  const bonuses = [
    { title: 'Ежедневный бонус', desc: 'Заходите каждый день и получайте 5 монеток!', icon: <Gift className="text-yellow-500" />, active: true },
    { title: 'Супер-Лайк', desc: 'Удвойте шансы на взаимность!', icon: <Zap className="text-blue-400" />, active: false },
    { title: 'Режим Невидимки', desc: 'Скройте свой онлайн-статус на 24 часа.', icon: <Sparkles className="text-purple-400" />, active: false },
  ]

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
            whileHover={{ scale: 1.02 }}
            className="p-5 glass-panel rounded-3xl flex items-center gap-5 border border-white/5"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
              {b.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{b.title}</h4>
              <p className="text-xs text-text-muted">{b.desc}</p>
            </div>
            <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
              b.active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/10 text-text-muted'
            }`}>
              {b.active ? 'Забрать' : 'Скоро'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">Новости проекта</h3>
        <div className="rounded-3xl overflow-hidden glass-panel">
          <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" className="w-full h-40 object-cover" />
          <div className="p-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Обновление</span>
              <span className="text-[10px] text-text-muted uppercase">26 Апр</span>
            </div>
            <h4 className="text-xl font-bold">NTIVI STUDIO запущена!</h4>
            <p className="text-sm text-text-muted leading-relaxed">
              Мы рады представить наше новое приложение для знакомств. Теперь общение стало еще более стильным и взрослым.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default News
