import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App(){
  //ESTADOS DE AUTENTICACIÓN--- Hecho con Ayuda de Ia gemini--------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(""); // Funcionará como el Correo Electrónico
  const [password, setPassword] = useState("");
  const [step2FA, setStep2FA] = useState(false);
  const [code2FA, setCode2FA] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [errorAuth, setErrorAuth] = useState("");
  const [esRegistro, setEsRegistro] = useState(false); // Falso = Login, Verdadero = Registro
  const [codigoSugerido, setCodigoSugerido] = useState(""); // Almacena el PIN dinámico del servidor
//estados originales de la app
  const [tareas, setTareas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [paginaTareas, setPaginaTareas] = useState(1);
  const [paginaArchivos, setPaginaArchivos] = useState(1);
  const itemsPorPagina = 4;

  const API_URL = "http://localhost:300/listadetareas/appv1";

  // Al cargar, revisamos si ya está logueado en LocalStorage
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    if (tokenGuardado) {
      setIsAuthenticated(true);
      fetchTareas();
      fetchArchivos();
    }
  }, [isAuthenticated]);

  const fetchTareas = async () =>{
    try {
      const res = await axios.get(API_URL);
      setTareas(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchArchivos = async () =>{
    try {
      const res = await axios.get('http://localhost:300/drive/files');
      setArchivos(res.data || []);
    } catch (err) { console.error(err); }
  };
//funciones de autenticacion -mongo db
  const handleRegister = async (e) =>{
    e.preventDefault();
    setErrorAuth("");
    try {
      await axios.post('http://localhost:300/api/auth/register', { correo: username, password });
      alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
      setEsRegistro(false); // Cambia automáticamente a la vista de Login
      setPassword("");
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Error al registrar usuario");
    }
  };
  // Login validando contraseñas hasheadas y solicitando OTP
  const handleLogin = async (e) =>{
    e.preventDefault();
    setErrorAuth("");
    try {
      const res = await axios.post('http://localhost:300/api/auth/login', { usuario: username, password });
      if (res.data.requiere2FA) {
        setTempToken(res.data.tokenTemporal);
        setCodigoSugerido(res.data.codigoParaPrueba); // Captura el PIN aleatorio generado
        setStep2FA(true); // Pasa al Paso 2
      }
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Usuario o contraseña incorrectos");
    }
  };

  // Verificación del Segundo Paso contra la variable temporal del backend
  const handleVerify2FA = async (e) =>{
    e.preventDefault();
    setErrorAuth("");
    try {
      const res = await axios.post('http://localhost:300/api/auth/verify-2fa', { 
        codigo: code2FA, 
        tokenTemporal: tempToken 
      });
      if (res.data.autorizado) {
        localStorage.setItem('token', res.data.tokenFinal); // Almacenamiento seguro en LS
        setIsAuthenticated(true);
      }
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Código de verificación incorrecto");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Limpieza de persistencia en LS
    setIsAuthenticated(false);
    setStep2FA(false);
    setUsername("");
    setPassword("");
    setCode2FA("");
    setCodigoSugerido("");//------------hasta ahi hecho con ayuda de ia gemini-----------
  };
//todolist
  const agregarTarea = async (e) =>{
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    try {
      await axios.post(API_URL, { tarea: nuevaTarea });
      setNuevaTarea("");
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const eliminarTarea = async (id) =>{
    if (!id) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const guardarEdicion = async (id) =>{
    if (!textoEditado.trim()){ setEditandoId(null); return; }
    try {
      await axios.put(`${API_URL}/${id}`, { tarea: textoEditado });
      setEditandoId(null);
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const cambiarEstado = async (id, estadoActual) =>{
    try {
      await axios.put(`${API_URL}/${id}`, { finalizado: !estadoActual });
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const tareasActuales = tareas.slice((paginaTareas - 1) * itemsPorPagina, paginaTareas * itemsPorPagina);
  const archivosActuales = archivos.slice((paginaArchivos - 1) * itemsPorPagina, paginaArchivos * itemsPorPagina);

  //VISTA DE ACCESO DINÁMICA CON REGISTRO Y 2FA ALEATORIO--hecho con ayuda de gemini ia---------
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2 className="main-title">
            {step2FA ? "PASO 2: VERIFICACIÓN" : (esRegistro ? "CREAR CUENTA" : "INICIAR SESIÓN")}
          </h2>
          
          {errorAuth && <p className="error-text">{errorAuth}</p>}

          {!step2FA ? (
            <form onSubmit={esRegistro ? handleRegister : handleLogin} className="login-form">
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="input-main border-black"
                required
              />
              <input 
                type="password" 
                placeholder="Tu contraseña secreta" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="input-main border-black"
                required
              />
              <button type="submit" className="upload-btn W-100">
                {esRegistro ? "REGISTRARME " : "CONTINUAR "}
              </button>
              
              <p style={{ textAlign: 'center', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} 
                 onClick={() => { setEsRegistro(!esRegistro); setErrorAuth(""); }}>
                {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="login-form">
              {/* Notificación simulada del SMS para la demostración del PIN Aleatorio */}
              <div style={{ background: '#e1f5fe', padding: '12px', border: '2px dashed #0288d1', marginBottom: '15px', borderRadius: '4px' }}>
                <p className="info-text" style={{ margin: 0, color: '#0288d1', fontSize: '14px', lineHeight: '1.4' }}>
                 <strong>=</strong> Tu token de seguridad para esta sesión es: <span style={{ fontSize: '20px', color: '#000', display: 'block', textAlign: 'center', marginTop: '5px' }}><strong>{codigoSugerido}</strong></span>
                </p>
              </div>
              
              <input 
                type="text" 
                placeholder="Introduce el código PIN" 
                value={code2FA} 
                onChange={(e) => setCode2FA(e.target.value)}
                className="input-main border-black"
                maxLength="4"
                required
              />
              <button type="submit" className="upload-btn W-100">VERIFICAR ACCESO </button>
            </form>
          )}
        </div>
      </div>
    );
  }// Hasta ahi hecho con ayuda de gemini ia---

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 40px 0 0' }}>
        <button onClick={handleLogout} className="upload-btn" style={{ background: '#ff4d4d', color: 'white', border: '2px solid black' }}>CERRAR SESIÓN ✕</button>
      </div>
      
      <div className="main-container">
        {/* SECCIÓN TODO LIST */}
        <div className="column">
          <h1 className="main-title">TODO LIST</h1>
          <form onSubmit={agregarTarea} className="add-form-row">
            <input 
              type="text" 
              placeholder="Nueva tarea..." 
              value={nuevaTarea}
              onChange={(e) => setNuevaTarea(e.target.value)}
              className="input-main"
            />
            <button type="submit" className="upload-btn">AÑADIR</button>
          </form>

          <div className="items-container">
            {tareasActuales.map(t => (
              <div key={t._id} className="card-item">
                <div className="task-header">
                  <input 
                    type="checkbox" 
                    checked={t.finalizado || false} 
                    onChange={() => cambiarEstado(t._id, t.finalizado)} 
                  />
                  {editandoId === t._id ? (
                    <input 
                      className="edit-input"
                      value={textoEditado} 
                      onChange={(e) => setTextoEditado(e.target.value)}
                      onBlur={() => guardarEdicion(t._id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          guardarEdicion(t._id);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className={`task-text ${t.finalizado ? "strikethrough" : ""}`}>
                      {t.tarea}
                    </span>
                  )}
                </div>
                
                <div className="action-buttons-row">
                  <button 
                    className="action-icon" 
                    onClick={() => { setEditandoId(t._id); setTextoEditado(t.tarea); }}
                  >✏️</button>
                  <button 
                    className="action-icon" 
                    onClick={() => eliminarTarea(t._id)}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-bar">
            <button onClick={() => setPaginaTareas(p => Math.max(p-1, 1))} className="pag-btn">{"<"}</button>
            <button className="pag-btn active">{paginaTareas}</button>
            <button onClick={() => setPaginaTareas(p => p + 1)} className="pag-btn">{">"}</button>
          </div>
        </div>

        {/* SECCIÓN DRIVE */}
        <div className="column">
          <div className="drive-header-row">
            <h1 className="main-title">DRIVE</h1>
            <label className="upload-btn">+ UPLOAD <input type="file" onChange={async (e) => {
               const d = new FormData(); d.append('archivo', e.target.files[0]);
               await axios.post('http://localhost:300/drive/upload', d); fetchArchivos();
            }} hidden /></label>
          </div>
          <div className="drive-grid">
            {archivosActuales.map((file, i) => (
              <div key={i} className="drive-card">
                <h3 className="file-name">{file.nombre.split('-').slice(1).join('-')}</h3>
                <p className="file-info">Tamaño: {file.size} | {new Date(file.fecha).toLocaleDateString()}</p>
                <div className="action-buttons-row">
                  <a href={file.url} download className="action-icon">⬇</a>
                  <button 
                    className="action-icon" 
                    onClick={() => axios.delete(`http://localhost:300/drive/files/${file.nombre}`).then(fetchArchivos)}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination-bar">
            <button onClick={() => setPaginaArchivos(p => Math.max(p-1, 1))} className="pag-btn">{"<"}</button>
            <button className="pag-btn active">{paginaArchivos}</button>
            <button onClick={() => setPaginaArchivos(p => p + 1)} className="pag-btn">{">"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;