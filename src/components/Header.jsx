import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, onLogout }) {
  return (
    <header className="bg-indigo-600">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-white font-bold text-xl">
              La Mia Libreria
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              <Link to="/books" className="text-base font-medium text-white hover:text-indigo-50">
                I Miei Libri
              </Link>
              <Link to="/add-book" className="text-base font-medium text-white hover:text-indigo-50">
                Aggiungi Libro
              </Link>
              <Link to="/profile" className="text-base font-medium text-white hover:text-indigo-50">
                Profilo
              </Link>
            </div>
          </div>
          <div className="ml-10 space-x-4">
            <span className="text-white">{user?.email}</span>
            <button
              onClick={onLogout}
              className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;