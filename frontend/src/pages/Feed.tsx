import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { userApi, likeApi } from '../api'
import { Heart, X, MapPin, Info } from 'lucide-react'
import MatchModal from '../components/MatchModal'

const Feed = ({ user, setUser }: any) => {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [matchData, setMatchData] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      userApi.getFeed(user.id)
        .then(res => {
          setProfiles(res.data)
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleLike = async (toUserId: string) => {
    try {
      const res = await likeApi.like(user.id, toUserId)
      if (res.data.mutual) {
        setMatchData(profiles[currentIndex])
        setUser({ ...user, coins: user.coins + 10 })
      }
      setCurrentIndex(currentIndex + 1)
      setActivePhotoIndex(0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDislike = () => {
    setCurrentIndex(currentIndex + 1)
    setActivePhotoIndex(0)
  }

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex >= profiles.length) return
    const photos = profiles[currentIndex].photos || []
    if (activePhotoIndex < photos.length - 1) {
      setActivePhotoIndex(activePhotoIndex + 1)
    }
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePhotoIndex > 0) {
      setActivePhotoIndex(activePhotoIndex - 1)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-[80vh]">Загрузка ленты...</div>
  if (currentIndex >= profiles.length) return <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center">
    <h2 className="text-xl font-bold mb-2">Люди закончились 🌍</h2>
    <p className="text-text-muted">Попробуйте зайти позже или изменить настройки поиска.</p>
  </div>

  const currentProfile = profiles[currentIndex]
  const avatar = currentProfile.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

  return (
    <div className="h-[calc(100vh-64px)] p-4 flex flex-col relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProfile.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="relative flex-1 rounded-[2.5rem] overflow-hidden glass-panel-premium shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group"
        >
          {/* Photos Carousel */}
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentProfile.photos?.[activePhotoIndex]?.url || avatar}
                src={currentProfile.photos?.[activePhotoIndex]?.url || avatar}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Carousel Tap Areas */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full cursor-pointer" onClick={prevPhoto} />
            <div className="w-1/2 h-full cursor-pointer" onClick={nextPhoto} />
          </div>

          {/* Carousel Indicators */}
          {currentProfile.photos && currentProfile.photos.length > 1 && (
            <div className="absolute top-2 left-4 right-4 flex gap-1 z-20">
              {currentProfile.photos.map((_: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx === activePhotoIndex ? 'bg-primary' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Avatar and Info Toggle */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <button
              onClick={() => setSelectedProfile(currentProfile)}
              className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden hover:scale-110 transition-transform shadow-lg"
            >
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            </button>
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentProfile.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {currentProfile.isOnline ? 'Онлайн' : 'Оффлайн'}
              </span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {currentProfile.firstName}, {new Date().getFullYear() - new Date(currentProfile.birthDate).getFullYear()}
                </h3>
                <div className="flex items-center gap-1 text-text-muted text-sm">
                  <MapPin size={14} />
                  <span>{currentProfile.city}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfile(currentProfile)}
                className="w-12 h-12 rounded-full glass-panel-premium flex items-center justify-center text-white hover:text-primary transition-colors shadow-lg"
              >
                <Info size={24} />
              </button>
            </div>
            <p className="text-sm line-clamp-2 text-text-main/80">{currentProfile.bio}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-center gap-8 py-8 items-center">
        <button
          onClick={handleDislike}
          className="w-16 h-16 rounded-full glass-panel-premium flex items-center justify-center text-text-muted hover:text-white transition-all hover:scale-110 active:scale-95 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <X size={32} />
        </button>
        <button
          onClick={() => handleLike(currentProfile.id)}
          className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-[0_10px_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] border-[3px] border-dark-light"
        >
          <Heart size={40} fill="currentColor" />
        </button>
      </div>

      <MatchModal
        isOpen={!!matchData}
        onClose={() => setMatchData(null)}
        user={user}
        partner={matchData}
      />

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-dark/95 p-6 overflow-y-auto pb-24"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Профиль</h2>
              <button onClick={() => setSelectedProfile(null)} className="p-2 glass-panel rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="aspect-square rounded-3xl overflow-hidden glass-panel">
                <img src={avatar} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold">{selectedProfile.firstName} {selectedProfile.lastName}</h3>
                <p className="text-text-muted flex items-center gap-2">
                  <MapPin size={18} /> {selectedProfile.city}
                </p>
                <div className="flex gap-2">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
                    {selectedProfile.intent === 'dating' ? 'Ищу пару' : 'Ищу общение'}
                  </span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold">
                    LVL {selectedProfile.level}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-panel space-y-2">
                <h4 className="font-bold text-sm uppercase text-text-muted">О себе</h4>
                <p>{selectedProfile.bio}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {selectedProfile.photos?.map((p: any, idx: number) => (
                  <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden glass-panel-premium shadow-lg">
                    <img src={p.url} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>

              <div className="text-center text-text-muted text-sm pt-4">
                Проведено в приложении: {Math.floor(selectedProfile.timeSpent / 60)} мин
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Feed
