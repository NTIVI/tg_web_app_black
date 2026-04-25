import { useState, useEffect, useRef } from 'react'
import { userApi, chatApi } from '../api'
import { Search, Send, ChevronLeft, MoreVertical } from 'lucide-react'

const Chats = ({ user }: any) => {
  const [chats, setChats] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      userApi.getChats(user.id).then(res => setChats(res.data))
    }
  }, [user])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleOpenChat = (chat: any) => {
    setActiveChat(chat)
    setMessages(chat.messages || [])
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) return
    
    try {
      const res = await chatApi.sendMessage(activeChat.id, user.id, message)
      setMessages([...messages, res.data])
      setMessage('')
    } catch (err) {
      console.error(err)
    }
  }

  if (activeChat) {
    const partner = activeChat.user1Id === user.id ? activeChat.user2 : activeChat.user1
    const avatar = partner.photos?.find((p: any) => p.isAvatar)?.url || 'https://via.placeholder.com/150'

    return (
      <div className="h-screen bg-dark flex flex-col fixed inset-0 z-[100] max-w-md mx-auto">
        <header className="h-16 glass-panel border-b border-white/5 flex items-center px-4 gap-4">
          <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 text-text-muted hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <img src={avatar} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
          <div className="flex-1">
            <h3 className="font-bold leading-tight">{partner.firstName}</h3>
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Печатает...</span>
          </div>
          <button className="text-text-muted">
            <MoreVertical size={20} />
          </button>
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
              onChange={(e) => setMessage(e.target.value)}
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
