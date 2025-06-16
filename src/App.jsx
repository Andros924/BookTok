import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import BookList from './components/BookList';
import AddBook from './components/AddBook';
import BookDetail from './components/BookDetail';
import Profile from './components/Profile';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        {isAuthenticated && <Header user={user} onLogout={handleLogout} />}
        <main className={isAuthenticated ? "pt-4" : ""}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : 
              <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
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
            <Route path="/profile" element={
              isAuthenticated ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;