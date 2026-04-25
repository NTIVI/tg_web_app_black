import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import MainLayout from './components/MainLayout'
import Feed from './pages/Feed'
import Chats from './pages/Chats'
import News from './pages/News'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { authApi, userApi } from './api'
import { AlertCircle } from 'lucide-react'

// Access Telegram WebApp safely from global window
const getTelegram = () => (window as any).Telegram?.WebApp;

function AppContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleError = (e: any) => {
      console.error('Unhandled Error:', e);
      setError(`Критическая ошибка: ${e.message || e}`);
      setLoading(false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    const init = async () => {
      try {
        const tg = getTelegram();
        
        if (tg) {
          tg.ready();
          tg.expand();
        } else {
          console.warn('Telegram WebApp is not available in window');
        }

        const initData = tg?.initDataUnsafe || {};
        const tgUser = initData.user;

        const performLogin = async (id: string, fName: string, lName: string) => {
          try {
            const res = await authApi.login(id, fName, lName)
            setUser(res.data)
            
            // Initial navigation based on profile completion
            const isComplete = res.data.intent && res.data.city && res.data.photos && res.data.photos.length > 0;
            if (!isComplete) {
              navigate('/onboarding')
            } else {
              navigate('/feed')
            }
          } catch (err: any) {
            console.error('Login failed', err)
            setError(err.response?.data?.error || 'Сервер временно недоступен. Проверьте соединение.')
          } finally {
            setLoading(false)
          }
        }

        if (tgUser) {
          await performLogin(tgUser.id.toString(), tgUser.first_name, tgUser.last_name || '')
        } else {
          // For local testing outside Telegram
          console.log('No Telegram user found, using test user');
          await performLogin('12345678', 'Test', 'User')
        }
      } catch (e: any) {
        handleError(e);
      }
    }

    init();

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Heartbeat to update timeSpent and online status
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      userApi.update(user.id, { timeSpent: (user.timeSpent || 0) + 60 })
        .catch(err => console.warn('Heartbeat failed', err))
    }, 60000)
    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0b10] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-[#888] text-sm font-medium animate-pulse">NTIVI STUDIO Загрузка...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0b10] p-10 text-center space-y-6 text-white">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Упс! Ошибка при входе</h2>
          <p className="text-[#888] text-sm">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-white rounded-2xl font-bold"
        >
          Обновить
        </button>
      </div>
    )
  }

  if (!user) return <div className="h-screen bg-[#0a0b10] flex items-center justify-center text-[#888]">Авторизация...</div>;

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
