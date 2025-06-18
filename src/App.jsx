import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import BookList from './components/BookList'
import AddBook from './components/AddBook'
import EditBook from './components/EditBook'
import BookDetail from './components/BookDetail'
import Profile from './components/Profile'
import LoanList from './components/LoanList'
import NewLoan from './components/NewLoan'
import authService from './services/authService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Starting auth check...')
        
        const session = await authService.getSession()
        console.log('📋 Session check result:', !!session)
        
        if (session && session.user) {
          console.log('👤 Session found, getting user data...')
          
          const userData = await authService.getCurrentUser()
          console.log('📊 User data result:', userData ? 'Success' : 'Failed')
          
          if (userData && isMounted) {
            setIsAuthenticated(true)
            setUser(userData.user)
            setProfile(userData.profile)
            console.log('✅ User authenticated successfully')
          }
        } else {
          console.log('❌ No active session found')
          if (isMounted) {
            setIsAuthenticated(false)
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('💥 Auth check error:', error)
        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setAuthChecked(true)
          console.log('🏁 Auth check completed')
        }
      }
    }

    checkAuth()

    // Ascolta i cambiamenti di autenticazione
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session)
      
      if (!isMounted) return
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, getting profile...')
        
        try {
          const userData = await authService.getCurrentUser()
          if (userData && isMounted) {
            setIsAuthenticated(true)
            setUser(userData.user)
            setProfile(userData.profile)
            console.log('✅ Profile loaded after sign in')
          }
        } catch (error) {
          console.error('❌ Error loading profile after sign in:', error)
        }
        
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
          setProfile(null)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed')
      }
    })

    return () => {
      console.log('🧹 Cleaning up auth listener')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      setIsAuthenticated(false)
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Mostra loading solo se non abbiamo ancora controllato l'auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {isAuthenticated && <Header user={profile} onLogout={handleLogout} />}
        <main className={isAuthenticated ? "pt-4" : ""}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : 
              <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} setProfile={setProfile} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : 
              <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} setProfile={setProfile} />
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            } />
            <Route path="/books" element={
              isAuthenticated ? <BookList /> : <Navigate to="/login" replace />
            } />
            <Route path="/books/:id" element={
              isAuthenticated ? <BookDetail /> : <Navigate to="/login" replace />
            } />
            <Route path="/books/:id/edit" element={
              isAuthenticated ? <EditBook /> : <Navigate to="/login" replace />
            } />
            <Route path="/add-book" element={
              isAuthenticated ? <AddBook /> : <Navigate to="/login" replace />
            } />
            <Route path="/loans" element={
              isAuthenticated ? <LoanList /> : <Navigate to="/login" replace />
            } />
            <Route path="/loans/new" element={
              isAuthenticated ? <NewLoan /> : <Navigate to="/login" replace />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <Profile user={profile} setUser={setProfile} /> : <Navigate to="/login" replace />
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App