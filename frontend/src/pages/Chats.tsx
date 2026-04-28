import { useState, useEffect, useRef } from 'react'
import { userApi, chatApi, reportApi } from '../api'
import { Search, Send, ChevronLeft, MoreVertical, Ban, Trash2, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Chats = ({ user }: any) => {
  const [chats, setChats] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastTypingSent = useRef<number>(0)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')

  useEffect(() => {
    const fetchChats = () => {
      if (user?.id) {
        userApi.getChats(user.id).then(res => setChats(res.data))
      }
    }
    fetchChats()
    const interval = setInterval(fetchChats, 10000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    let interval: any
    if (activeChat && user?.id) {
      const fetchMessages = async () => {
        try {
          const res = await chatApi.getMessages(activeChat.id, user.id)
          if (res.data.messages.length !== messages.length || res.data.isPartnerTyping !== isPartnerTyping) {
            setMessages(res.data.messages)
            setIsPartnerTyping(res.data.isPartnerTyping)
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }
      
      fetchMessages()
      interval = setInterval(fetchMessages, 3000)
    }
    return () => clearInterval(interval)
  }, [activeChat, user, messages.length, isPartnerTyping])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleOpenChat = (chat: any) => {
    setActiveChat(chat)
    setMessages([])
    setIsPartnerTyping(false)
    setIsMenuOpen(false)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) return
    
    const text = message
    setMessage('')
    try {
      const res = await chatApi.sendMessage(activeChat.id, user.id, text)
      setMessages([...messages, res.data])
    } catch (err) {
      console.error(err)
      setMessage(text)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    const now = Date.now()
    if (now - lastTypingSent.current > 3000 && activeChat && user?.id) {
      lastTypingSent.current = now
      chatApi.setTyping(activeChat.id, user.id).catch(() => {})
    }
  }

  const handleBlockUser = async (targetUserId: string) => {
    if (!window.confirm('Вы уверены, что хотите заблокировать этого пользователя? Вы больше не сможете переписываться.')) return
    try {
      await userApi.blockUser(user.id, targetUserId)
      setChats(chats.filter(c => c.id !== activeChat.id))
      setActiveChat(null)
    } catch (err) {
      console.error(err)
      alert('Ошибка при блокировке')
    }
  }

  const handleDeleteChat = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот чат полностью? История переписки удалится у обоих.')) return
    try {
      await chatApi.deleteChat(activeChat.id)
      setChats(chats.filter(c => c.id !== activeChat.id))
      setActiveChat(null)
    } catch (err) {
      console.error(err)
      alert('Ошибка при удалении чата')
    }
  }

  const handleReport = async (targetUserId: string) => {
    if (!reportReason.trim()) return alert('Пожалуйста, укажите причину жалобы.')
    try {
      await reportApi.createReport({
        reporterId: user.id,
        reportedUserId: targetUserId,
        reason: reportReason
      })
      alert('Жалоба успешно отправлена администрации.')
      setIsReportModalOpen(false)
      setReportReason('')
      setIsMenuOpen(false)
    } catch (error) {
      console.error(error)
      alert('Ошибка при отправке жалобы')
    }
  }

  if (activeChat) {
    const partner = activeChat.user1Id === user.id ? activeChat.user2 : activeChat.user1
    const avatar = partner.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

    return (
      <div className="h-screen bg-dark flex flex-col fixed inset-0 z-[100] max-w-md mx-auto">
        <header className="h-16 glass-panel border-b border-white/5 flex items-center px-4 gap-4 relative">
          <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 text-text-muted hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <img src={avatar} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
          <div className="flex-1">
            <h3 className="font-bold leading-tight">{partner.firstName}</h3>
            {isPartnerTyping ? (
              <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider animate-pulse">Печатает...</span>
            ) : (
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {partner.isOnline ? 'Онлайн' : 'Оффлайн'}
              </span>
            )}
          </div>
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -mr-2 text-text-muted hover:text-white relative">
            <MoreVertical size={24} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-14 right-4 z-50 bg-[#1A1A1A] border border-white/10 rounded-2xl p-2 w-56 shadow-2xl flex flex-col gap-1"
                >
                  <button 
                    onClick={() => { setIsMenuOpen(false); handleBlockUser(partner.id) }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <Ban size={16} className="text-red-500" />
                    Заблокировать
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); handleDeleteChat() }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} className="text-red-500" />
                    Удалить чат
                  </button>
                  <div className="h-[1px] bg-white/10 my-1 mx-2" />
                  <button 
                    onClick={() => { setIsMenuOpen(false); setIsReportModalOpen(true) }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    <AlertTriangle size={16} className="text-yellow-500" />
                    Пожаловаться
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.senderId === user.id 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'glass-panel rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-[10px] opacity-50 block mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 glass-panel border-t border-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Написать сообщение..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleSendMessage}
              className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Report Modal */}
        <AnimatePresence>
          {isReportModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 relative shadow-2xl"
              >
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                  <AlertTriangle size={28} />
                  <h2 className="text-xl font-bold text-white">Жалоба</h2>
                </div>
                <p className="text-sm text-text-muted mb-4">Опишите причину вашей жалобы на пользователя <span className="font-bold text-white">{partner.firstName}</span>. Модераторы проверят эту информацию.</p>
                
                <textarea 
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Оскорбление, спам, фейк..."
                  className="w-full bg-dark/50 border border-white/10 rounded-2xl p-4 h-32 resize-none outline-none focus:border-primary transition-colors text-sm mb-4"
                />
                
                <button 
                  onClick={() => handleReport(partner.id)}
                  className="w-full bg-primary py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors"
                >
                  Отправить жалобу
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Чаты</h1>
        <button className="p-2 glass-panel rounded-full text-text-muted">
          <Search size={24} />
        </button>
      </div>

      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p>У вас пока нет активных чатов.</p>
            <p className="text-sm">Лайкайте людей, чтобы начать общение! ❤️</p>
          </div>
        ) : (
          chats.map((chat) => {
            const partner = chat.user1Id === user.id ? chat.user2 : chat.user1
            const avatar = partner.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'
            const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null

            return (
              <button
                key={chat.id}
                onClick={() => handleOpenChat(chat)}
                className="w-full flex items-center gap-4 p-4 glass-panel rounded-3xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group"
              >
                <div className="relative">
                  <img src={avatar} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" />
                  {partner.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-dark rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold">{partner.firstName}</h3>
                    <span className="text-[10px] text-text-muted uppercase font-bold">
                      {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-1">
                    {lastMsg ? lastMsg.text : 'Новый чат! Скажите "Привет" 👋'}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Chats
