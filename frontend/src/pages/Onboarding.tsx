import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { Camera, ChevronRight, Check } from 'lucide-react'

const Onboarding = ({ user, setUser }: any) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    intent: 'dating', // Default intent
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthDate: '',
    city: '',
    bio: '',
    gender: 'male',
  })
  const [avatar, setAvatar] = useState('')
  const [photos, setPhotos] = useState(['', '', ''])
  const navigate = useNavigate()

  const nextStep = () => setStep(step + 1)
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'photo', index?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      if (type === 'avatar') {
        setAvatar(base64String)
      } else if (type === 'photo' && index !== undefined) {
        const newPhotos = [...photos]
        newPhotos[index] = base64String
        setPhotos(newPhotos)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleComplete = async () => {
    if (!user) return
    try {
      const updatedUser = await userApi.update(user.id, formData)
      
      const finalPhotos: any[] = []
      if (avatar) {
        finalPhotos.push({ url: avatar, isAvatar: true, order: 0 })
      }
      photos.forEach((photoStr, i) => {
        if (photoStr) {
          finalPhotos.push({ url: photoStr, isAvatar: false, order: i + 1 })
        }
      })
      
      if (finalPhotos.length > 0) {
        await userApi.uploadPhotos(user.id, finalPhotos)
        setUser({ ...updatedUser.data, photos: finalPhotos })
      } else {
        setUser({ ...updatedUser.data })
      }
      navigate('/feed')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary opacity-10 blur-[100px] rounded-full" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">NTIVI STUDIO</h1>
              <p className="text-[#888]">Расскажите о себе</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-[#888] ml-1">Имя</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Имя"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-[#888] ml-1">Фамилия</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Фамилия"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm text-[#888] ml-1">Дата рождения</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-[#888] ml-1">Город</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ваш город"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-[#888] ml-1">Ваш пол</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`flex-1 p-3 rounded-xl border ${formData.gender === 'male' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'}`}
                  >
                    Мужчина
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`flex-1 p-3 rounded-xl border ${formData.gender === 'female' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'}`}
                  >
                    Женщина
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-[#888] ml-1">О себе</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  placeholder="Напишите коротко о себе..."
                />
              </div>

              <button
                onClick={nextStep}
                disabled={!formData.firstName || !formData.birthDate || !formData.city}
                className="w-full p-4 bg-primary rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Продолжить <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Фотографии профиля</h2>
              <p className="text-[#888]">Загрузите аватар и 3 дополнительных фото</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, 'avatar')} 
                    style={{ opacity: 0.01, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, cursor: 'pointer' }}
                  />
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={32} className="text-[#888] group-hover:text-primary" />
                      <span className="absolute bottom-2 text-[10px] uppercase font-bold text-[#888]">Avatar</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors group relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'photo', i)} 
                      style={{ opacity: 0.01, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, cursor: 'pointer' }}
                    />
                    {photos[i] ? (
                      <img src={photos[i]} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={24} className="text-[#888] group-hover:text-primary" />
                        <span className="absolute bottom-2 text-[10px] uppercase font-bold text-[#888]">Photo {i + 1}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleComplete}
                className="w-full p-4 bg-primary rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Начать пользоваться <Check size={20} />
              </button>
              
              <p className="text-center text-[12px] text-[#888]">
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
