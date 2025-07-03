import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Film, Menu, X, User, LogOut, Home, Plus, Library, Users } from 'lucide-react'

function Header({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  // Determina se siamo nella sezione libri o film
  const isInBooksSection = location.pathname.includes('/books') || location.pathname.includes('/add-book') || location.pathname.includes('/loans')
  const isInMoviesSection = location.pathname.includes('/movies') || location.pathname.includes('/add-movie') || location.pathname.includes('/movie-loans')

  const booksNavigation = [
    { name: 'Dashboard', href: '/books-dashboard', icon: Home },
    { name: 'Libreria', href: '/books', icon: Library },
    { name: 'Aggiungi', href: '/add-book', icon: Plus },
    { name: 'Prestiti', href: '/loans', icon: Users },
  ]

  const moviesNavigation = [
    { name: 'Dashboard', href: '/movies-dashboard', icon: Home },
    { name: 'Filmoteca', href: '/movies', icon: Film },
    { name: 'Aggiungi', href: '/add-movie', icon: Plus },
    { name: 'Prestiti', href: '/movie-loans', icon: Users },
  ]

  // Usa la navigazione appropriata o quella di default
  const navigation = isInBooksSection ? booksNavigation : 
                    isInMoviesSection ? moviesNavigation : 
                    [{ name: 'Collezioni', href: '/dashboard', icon: Home }]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              {isInBooksSection ? (
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
              ) : isInMoviesSection ? (
                <Film className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              ) : (
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  <Film className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              )}
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">
                {isInBooksSection ? 'Libreria' : isInMoviesSection ? 'Filmoteca' : 'Collezioni'}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:space-x-6 xl:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? isInBooksSection 
                        ? 'border-emerald-500 text-gray-900'
                        : isInMoviesSection
                        ? 'border-purple-500 text-gray-900'
                        : 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Desktop user menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <Link
              to="/profile"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/profile')
                  ? isInBooksSection
                    ? 'bg-emerald-100 text-emerald-700'
                    : isInMoviesSection
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              <span className="truncate max-w-32">{user?.name}</span>
            </Link>
            
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Apri menu principale</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? isInBooksSection
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : isInMoviesSection
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 py-2">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-base font-medium text-gray-800 truncate">{user?.name}</div>
                <div className="text-sm font-medium text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              >
                Profilo
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  onLogout()
                }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header