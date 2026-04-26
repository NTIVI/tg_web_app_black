import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  partner: any
}

const MatchModal = ({ isOpen, onClose, user, partner }: MatchModalProps) => {
  const navigate = useNavigate()

  if (!partner) return null

  const userAvatar = user.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'
  const partnerAvatar = partner.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
            className="absolute top-6 right-6 p-2 glass-panel rounded-full text-white/50 hover:text-white"
          >
            <X size={24} />
          </motion.button>

          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="space-y-4 mb-12"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
              />
              <Heart size={80} className="text-primary relative fill-primary" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Это взаимно!</h1>
            <p className="text-text-muted">Вы понравились друг другу с {partner.firstName}</p>
          </motion.div>

          <div className="flex items-center gap-4 mb-12 relative">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl rotate-[-5deg]"
            >
              <img src={userAvatar} className="w-full h-full object-cover" />
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="bg-primary p-3 rounded-full z-10 shadow-lg"
            >
              <Heart size={24} className="text-white fill-white" />
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-2xl rotate-[5deg]"
            >
              <img src={partnerAvatar} className="w-full h-full object-cover" />
            </motion.div>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => {
                onClose()
                navigate('/chats')
              }}
              className="w-full p-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              <MessageCircle size={20} />
              Написать сообщение
            </button>
            <button
              onClick={onClose}
              className="w-full p-4 glass-panel text-white rounded-2xl font-bold hover:bg-white/5 transition-all"
            >
              Продолжить поиск
            </button>
          </div>
          
          <div className="mt-8">
            <span className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-500/20">
              +10 МОНЕТОК
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MatchModal
