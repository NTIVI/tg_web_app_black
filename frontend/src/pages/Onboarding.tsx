import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { Camera, ChevronRight, Check } from 'lucide-react'

const intents = [
  { id: 'dating', label: 'Знакомство', icon: '❤️' },
  { id: 'chatting', label: 'Просто общение', icon: '💬' },
  { id: 'friendship', label: 'Дружба', icon: '🤝' },
  { id: 'flirting', label: 'Флирт', icon: '🔥' },
]

const Onboarding = ({ user, setUser }: any) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    intent: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthDate: '',
    city: '',
    bio: '',
    gender: 'male',
  })
  const [avatar] = useState('')
  const navigate = useNavigate()

  const nextStep = () => setStep(step + 1)
  
  const handleComplete = async () => {
    if (!user) return
    try {
      const updatedUser = await userApi.update(user.id, formData)
      
      // For demo, we just use random high-quality URLs from internet if none provided
      // In real app, these would be uploaded files
      const demoPhotos = [
        { url: avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400', isAvatar: true, order: 0 },
        { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=600', isAvatar: false, order: 1 },
        { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=600', isAvatar: false, order: 2 },
        { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=600', isAvatar: false, order: 3 },
      ]
      
      await userApi.uploadPhotos(user.id, demoPhotos)
      setUser({ ...updatedUser.data, photos: demoPhotos })
      navigate('/feed')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-dark text-text-main p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">NTIVI STUDIO</h1>
              <p className="text-text-muted">Зачем вы здесь?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {intents.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    setFormData({ ...formData, intent: it.id })
                    nextStep()
                  }}
                  className={`p-6 rounded-2xl glass-panel transition-all duration-300 flex flex-col items-center justify-center space-y-3 hover:scale-105 active:scale-95 ${
                    formData.intent === it.id ? 'border-primary border-2' : ''
                  }`}
                >
                  <span className="text-4xl">{it.icon}</span>
                  <span className="font-medium">{it.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Расскажите о себе</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-text-muted ml-1">Имя</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-4 rounded-xl glass-panel focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Имя"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-text-muted ml-1">Фамилия</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-4 rounded-xl glass-panel focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Фамилия"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm text-text-muted ml-1">Дата рождения</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full p-4 rounded-xl glass-panel focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-text-muted ml-1">Город</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-4 rounded-xl glass-panel focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ваш город"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-text-muted ml-1">Ваш пол</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`flex-1 p-3 rounded-xl glass-panel border ${formData.gender === 'male' ? 'border-primary bg-primary/20' : 'border-transparent'}`}
                  >
                    Мужчина
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`flex-1 p-3 rounded-xl glass-panel border ${formData.gender === 'female' ? 'border-primary bg-primary/20' : 'border-transparent'}`}
                  >
                    Женщина
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-text-muted ml-1">О себе</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-4 rounded-xl glass-panel focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  placeholder="Напишите коротко о себе..."
                />
              </div>

              <button
                onClick={nextStep}
                disabled={!formData.firstName || !formData.birthDate || !formData.city}
                className="w-full p-4 bg-primary rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Продолжить <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Фотографии профиля</h2>
              <p className="text-text-muted">Загрузите аватар и 3 дополнительных фото</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full glass-panel flex items-center justify-center overflow-hidden border-2 border-dashed border-text-muted hover:border-primary transition-colors cursor-pointer group">
                  <Camera size={32} className="text-text-muted group-hover:text-primary" />
                  <span className="absolute bottom-2 text-[10px] uppercase font-bold text-text-muted">Avatar</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl glass-panel flex items-center justify-center border-2 border-dashed border-text-muted hover:border-primary transition-colors cursor-pointer group relative">
                    <Camera size={24} className="text-text-muted group-hover:text-primary" />
                    <span className="absolute bottom-2 text-[10px] uppercase font-bold text-text-muted">Photo {i}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                className="w-full p-4 bg-primary rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Начать пользоваться <Check size={20} />
              </button>
              
              <p className="text-center text-[12px] text-text-muted">
                Нажимая кнопку, вы подтверждаете, что вам есть 16 лет.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Onboarding
