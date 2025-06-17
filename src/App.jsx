import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import BookList from './components/BookList'
import AddBook from './components/AddBook'
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getSession()
        if (session) {
          const userData = await authService.getCurrentUser()
          if (userData) {
            setIsAuthenticated(true)
            setUser(userData.user)
            setProfile(userData.profile)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Ascolta i cambiamenti di autenticazione
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const userData = await authService.getCurrentUser()
        if (userData) {
          setIsAuthenticated(true)
          setUser(userData.user)
          setProfile(userData.profile)
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        {isAuthenticated && <Header user={profile} onLogout={handleLogout} />}
        <main className={isAuthenticated ? "pt-4" : ""}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} setProfile={setProfile} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} setProfile={setProfile} />
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            } />
            <Route path="/books" element={
              isAuthenticated ? <BookList /> : <Navigate to="/login" />
            } />
            <Route path="/books/:id" element={
              isAuthenticated ? <BookDetail /> : <Navigate to="/login" />
            } />
            <Route path="/add-book" element={
              isAuthenticated ? <AddBook /> : <Navigate to="/login" />
            } />
            <Route path="/loans" element={
              isAuthenticated ? <LoanList /> : <Navigate to="/login" />
            } />
            <Route path="/loans/new" element={
              isAuthenticated ? <NewLoan /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <Profile user={profile} setUser={setProfile} /> : <Navigate to="/login" />
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App