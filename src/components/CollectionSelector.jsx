import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Film, TrendingUp, Star, Users, Clock } from 'lucide-react';

function CollectionSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Le Tue Collezioni
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Scegli quale collezione vuoi gestire oggi. Organizza i tuoi libri e film preferiti in un unico posto.
          </p>
        </div>

        {/* Collection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {/* Libreria Card */}
          <Link
            to="/books-dashboard"
            className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            
            <div className="relative p-8 sm:p-10">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-2xl mb-6 mx-auto group-hover:bg-emerald-200 transition-colors duration-300">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
                Libreria
              </h2>
              
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                Gestisci la tua collezione di libri, tieni traccia delle letture e organizza i prestiti.
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                  <span>Valutazioni e recensioni personali</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                  <span>Tracciamento stato di lettura</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                  <span>Sistema prestiti avanzato</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                  <span>Statistiche di lettura</span>
                </div>
              </div>
              
              <div className="text-center">
                <span className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl group-hover:bg-emerald-700 transition-colors duration-300">
                  Accedi alla Libreria
                  <BookOpen className="ml-2 h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Filmoteca Card */}
          <Link
            to="/movies-dashboard"
            className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            
            <div className="relative p-8 sm:p-10">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-2xl mb-6 mx-auto group-hover:bg-purple-200 transition-colors duration-300">
                <Film className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
                Filmoteca
              </h2>
              
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                Organizza la tua collezione di film, tieni traccia delle visioni e gestisci i prestiti.
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Valutazioni e recensioni personali</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Tracciamento stato di visione</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Sistema prestiti avanzato</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Statistiche di visione</span>
                </div>
              </div>
              
              <div className="text-center">
                <span className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl group-hover:bg-purple-700 transition-colors duration-300">
                  Accedi alla Filmoteca
                  <Film className="ml-2 h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-gray-500 text-sm sm:text-base">
            Puoi sempre passare da una collezione all'altra usando il menu di navigazione
          </p>
        </div>
      </div>
    </div>
  );
}

export default CollectionSelector;