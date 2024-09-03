const testUser = {
    email: 'alex@gmail.com',
    password: '123',
    name: 'Utente di Test'
  };
  
  const authService = {
    login: (email, password) => {
      if (email === testUser.email && password === testUser.password) {
        const user = { ...testUser };
        delete user.password;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      throw new Error('Credenziali non valide');
    },
  
    logout: () => {
      localStorage.removeItem('user');
    },
  
    getCurrentUser: () => {
      return JSON.parse(localStorage.getItem('user'));
    },
  
    isAuthenticated: () => {
      return !!localStorage.getItem('user');
    }
  };
  
  export default authService;
  
