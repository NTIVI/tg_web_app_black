import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { ChevronLeft, Save } from 'lucide-react'

const EditProfile = ({ user, setUser }: any) => {
  const [formData, setFormData] = useState({
    intent: user?.intent || 'dating',
    city: user?.city || '',
    bio: user?.bio || '',
    gender: user?.gender || 'male',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await userApi.update(user.id, formData)
      setUser({ ...user, ...res.data })
      navigate('/profile')
    } catch (err) {
      console.error(err)
      alert('Ошибка при сохранении')
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
