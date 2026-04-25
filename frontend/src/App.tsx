import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import * as WebAppModule from '@twa-dev/sdk'
const WebApp = (WebAppModule as any).default || WebAppModule;
import Onboarding from './pages/Onboarding'
import MainLayout from './components/MainLayout'
import Feed from './pages/Feed'
import Chats from './pages/Chats'
import News from './pages/News'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { authApi, userApi } from './api'
import { AlertCircle } from 'lucide-react'

function AppContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setError(`Критическая ошибка: ${e.message}`);
      setLoading(false);
    };

    window.addEventListener('error', handleError);

    try {
      // Use window.Telegram.WebApp if available, otherwise fallback to the imported SDK
      const tg = (window as any).Telegram?.WebApp || WebApp;
      
      if (tg && typeof tg.ready === 'function') {
        tg.ready();
        tg.expand();
      }

      const initData = tg?.initDataUnsafe || {};
      const tgUser = initData.user;

      const performLogin = async (id: string, fName: string, lName: string) => {
        try {
          const res = await authApi.login(id, fName, lName)
          setUser(res.data)
          if (!res.data.intent || !res.data.city || !res.data.photos || res.data.photos.length === 0) {
            navigate('/onboarding')
          } else {
            navigate('/feed')
          }
        } catch (err: any) {
          console.error('Login failed', err)
          setError(err.response?.data?.error || 'Ошибка подключения к серверу. Пожалуйста, убедитесь, что сервер запущен.')
        } finally {
          setLoading(false)
        }
      }

      if (tgUser) {
        performLogin(tgUser.id.toString(), tgUser.first_name, tgUser.last_name || '')
      } else {
        // For local testing
        performLogin('12345678', 'Test', 'User')
      }
    } catch (e: any) {
      setError('Ошибка инициализации Telegram SDK: ' + e.message)
      setLoading(false)
    }

    return () => window.removeEventListener('error', handleError);
  }, [])

  // Heartbeat to update timeSpent and online status
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      userApi.update(user.id, { timeSpent: user.timeSpent + 60 })
        .catch(err => console.warn('Heartbeat failed', err))
    }, 60000) // every minute

    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-muted text-sm font-medium animate-pulse">NTIVI STUDIO Загрузка...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-dark p-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Упс! Что-то пошло не так</h2>
          <p className="text-text-muted text-sm">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (!user) return null;

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding user={user} setUser={setUser} />} />
      <Route element={<MainLayout />}>
        <Route path="/feed" element={<Feed user={user} />} />
        <Route path="/chats" element={<Chats user={user} />} />
        <Route path="/news" element={<News />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/admin" element={<Admin user={user} />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
