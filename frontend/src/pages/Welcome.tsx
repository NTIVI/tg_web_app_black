import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, Info, HeartHandshake, ShieldCheck, Zap } from 'lucide-react'

interface WelcomeProps {
  onContinue: () => void;
}

const Welcome = ({ onContinue }: WelcomeProps) => {
  const [view, setView] = useState<'main' | 'details'>('main')

  const handleContinue = () => {
    localStorage.setItem('hasSeenWelcomeScreen', 'true')
    onContinue()
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {view === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md flex flex-col items-center text-center space-y-8 z-10"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-purple-600 p-[2px] shadow-[0_0_30px_rgba(244,63,94,0.3)]">
              <div className="w-full h-full bg-dark rounded-full flex items-center justify-center">
                <Sparkles size={40} className="text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Добро пожаловать в NTIVI STUDIO
              </h1>
              <p className="text-text-muted text-base leading-relaxed max-w-[280px] mx-auto">
                Новое слово в мире знакомств. Стильное, безопасное и взрослое общение начинается здесь.
              </p>
            </div>

            <div className="w-full space-y-3 pt-8">
              <button 
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-bold text-lg shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                Продолжить <ChevronRight size={20} />
              </button>
              
              <button 
                onClick={() => setView('details')}
                className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Info size={18} className="text-text-muted" />
                Подробнее об приложении
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md flex flex-col z-10"
          >
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">О приложении</h2>
                  <p className="text-xs text-text-muted">Для чего создано NTIVI STUDIO</p>
                </div>
              </div>

              <div className="space-y-5 text-sm">
                <div className="flex gap-4">
                  <HeartHandshake className="text-purple-400 shrink-0" />
                  <p className="text-text-main/90 leading-relaxed">
                    <strong className="text-white block mb-1">Осознанные знакомства</strong>
                    Мы создали пространство для тех, кто ценит свое время и ищет качественное общение. Будь то дружба, флирт или серьезные отношения.
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <ShieldCheck className="text-green-400 shrink-0" />
                  <p className="text-text-main/90 leading-relaxed">
                    <strong className="text-white block mb-1">Безопасность и Приватность</strong>
                    Строгая модерация, возможность блокировать нежелательных собеседников и никаких фейков. Ваша безопасность — наш приоритет.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Zap className="text-yellow-400 shrink-0" />
                  <p className="text-text-main/90 leading-relaxed">
                    <strong className="text-white block mb-1">Система Уровней и Монет</strong>
                    Будьте активны, повышайте свой уровень и получайте монеты. Чем выше уровень, тем больше внимания вы привлекаете!
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={() => setView('main')}
                  className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/15 transition-colors"
                >
                  Назад
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Welcome
