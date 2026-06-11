import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import TodoList from './components/TodoList';
import Drive from './components/Drive';

axios.interceptors.request.use((config) =>{
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;// envia el token y cabecera
  }
  return config;
});
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    if (tokenGuardado) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 40px 0 0' }}>
        <button onClick={handleLogout} className="upload-btn" style={{ background: '#ff4d4d', color: 'white', border: '2px solid black' }}>
          CERRAR SESIÓN ✕
        </button>
      </div>
      <div className="main-container">
        <TodoList />
        <Drive />
      </div>
    </div>
  );
}

export default App;
