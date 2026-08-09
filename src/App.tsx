import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Feed from './pages/Feed'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import PostDetail from './pages/PostDetail'
import Categories, { CategoryView } from './pages/Categories'
import Trending from './pages/Trending'
import Search from './pages/Search'
import Favorites from './pages/Favorites'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import AdminDashboard from './pages/AdminDashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import type { ReactNode } from 'react'

// Redirect component for /posts/:id to /post/:id
function PostsRedirect() {
  const { id } = useParams()
  return <Navigate to={`/post/${id}`} replace />
}

function ProtectedRoute({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="text-center p-5"><div className="spinner-border text-fh-primary" /></div>
  if (!profile) return <SignIn />
  if (adminOnly && profile.role !== 'admin') return <NotFound />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/posts/:id" element={<PostsRedirect />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryView />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/search" element={<Search />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute adminOnly><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}