import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { ChevronLeft, Save, Camera } from 'lucide-react'

const EditProfile = ({ user, setUser }: any) => {
  const [formData, setFormData] = useState({
    intent: user?.intent || 'dating',
    city: user?.city || '',
    bio: user?.bio || '',
    gender: user?.gender || 'male',
  })
  const [avatar, setAvatar] = useState(user?.photos?.find((p: any) => p.isAvatar)?.url || '')
  const [photos, setPhotos] = useState(() => {
    const existingPhotos = user?.photos?.filter((p: any) => !p.isAvatar).sort((a: any, b: any) => a.order - b.order) || []
    return [
      existingPhotos[0]?.url || '',
      existingPhotos[1]?.url || '',
      existingPhotos[2]?.url || ''
    ]
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'photo', index?: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxSize = 800

        if (width > height && width > maxSize) {
          height *= maxSize / width
          width = maxSize
        } else if (height > maxSize) {
          width *= maxSize / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)

        if (type === 'avatar') {
          setAvatar(compressedBase64)
        } else if (type === 'photo' && index !== undefined) {
          const newPhotos = [...photos]
          newPhotos[index] = compressedBase64
          setPhotos(newPhotos)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await userApi.update(user.id, formData)
      
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
        setUser({ ...user, ...res.data, photos: finalPhotos })
      } else {
        setUser({ ...user, ...res.data })
      }
      
      navigate('/profile')
    } catch (err: any) {
      console.error(err)
      alert('Ошибка при сохранении: ' + (err?.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8 h-[calc(100vh-64px)] overflow-y-auto pb-24">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 glass-panel rounded-full text-text-muted hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Редактировать</h1>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-[#888]" />
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleImageUpload(e, 'avatar')} 
            className="block w-full max-w-xs text-sm text-[#888] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
          />
        </div>

        <div className="space-y-4">
          <p className="text-sm font-bold text-center uppercase tracking-widest text-text-muted">Дополнительные фото</p>
          <div className="grid grid-cols-1 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-24 h-32 rounded-xl bg-black/20 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center">
                  {photos[i] ? (
                    <img src={photos[i]} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} className="text-[#888]" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'photo', i)} 
                  className="block w-full text-xs text-[#888] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">Моя цель</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dating', label: 'Свидания' },
              { id: 'friendship', label: 'Дружба' },
              { id: 'flirting', label: 'Флирт' },
              { id: 'chatting', label: 'Общение' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFormData({ ...formData, intent: item.id })}
                className={`p-4 rounded-2xl border transition-all text-sm font-bold ${
                  formData.intent === item.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/5 bg-white/5 text-text-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">Город</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 focus:border-primary outline-none transition-colors"
            placeholder="Ваш город"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold uppercase text-text-muted ml-2 tracking-widest">О себе</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 focus:border-primary outline-none h-32 resize-none transition-colors"
            placeholder="Расскажите о себе..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full p-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {loading ? 'Сохранение...' : (
            <>
              <Save size={20} />
              Сохранить изменения
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default EditProfile
