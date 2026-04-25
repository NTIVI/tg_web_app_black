import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import Onboarding from './pages/Onboarding'
import MainLayout from './components/MainLayout'
import Feed from './pages/Feed'
import Chats from './pages/Chats'
import News from './pages/News'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import { authApi } from './api'

function AppContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()

    const initData = WebApp.initDataUnsafe
    const tgUser = initData.user

    if (tgUser) {
      authApi.login(tgUser.id.toString(), tgUser.first_name, tgUser.last_name)
        .then(res => {
          setUser(res.data)
          if (!res.data.intent || !res.data.city || res.data.photos.length === 0) {
            navigate('/onboarding')
          } else {
            navigate('/feed')
          }
        })
        .catch(err => {
          console.error('Login failed', err)
        })
        .finally(() => setLoading(false)) // Set to false when done
    } else {
      // For local testing
      authApi.login('12345678', 'Test', 'User')
        .then(res => {
          setUser(res.data)
          if (!res.data.intent || !res.data.city || res.data.photos.length === 0) {
            navigate('/onboarding')
          } else {
            navigate('/feed')
          }
        })
        .finally(() => setLoading(false))
    }
  }, [])

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding user={user} setUser={setUser} />} />
      <Route element={<MainLayout user={user} />}>
        <Route path="/feed" element={<Feed user={user} />} />
        <Route path="/chats" element={<Chats user={user} />} />
        <Route path="/news" element={<News user={user} />} />
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
