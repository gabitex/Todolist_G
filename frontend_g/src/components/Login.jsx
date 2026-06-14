import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step2FA, setStep2FA] = useState(false);
  const [code2FA, setCode2FA] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [errorAuth, setErrorAuth] = useState("");
  const [esRegistro, setEsRegistro] = useState(false);
  const [codigoSugerido, setCodigoSugerido] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorAuth("");
    try {
      await axios.post('https://localhost:300/api/auth/register', { correo: username, password });//manda correro y password al backend
      alert("¡Cuenta creada con éxito!..inicia secion");
      setEsRegistro(false);
      setPassword("");
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Error al registrar usuario");
    }
  };

  const handleLogin = async (e) => {//hecho con ayuda de ia claude------------------------------------
    e.preventDefault();
    setErrorAuth("");
    try {
      const res = await axios.post('https://localhost:300/api/auth/login', { usuario: username, password });
      if (res.data.requiere2FA) {//manda credenciales y el bakend responde cn el token
        setTempToken(res.data.tokenTemporal);
        setCodigoSugerido(res.data.codigoParaPrueba);
        setStep2FA(true);
      }
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Usuario o contraseña incorrectos");
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setErrorAuth("");
    try {
      const res = await axios.post('https://localhost:300/api/auth/verify-2fa', {
        codigo: code2FA,
        tokenTemporal: tempToken
      });
      if (res.data.autorizado) {
        localStorage.setItem('token', res.data.tokenFinal);//guarda en el token 
        onLoginSuccess();
      }
    } catch (err) {
      setErrorAuth(err.response?.data?.message || "Código de verificación incorrecto");
    }
  };
//hasta aqui hecho con ayuda de ia claude---------------------------------------------------------------
  return (
    <div className="login-container">
      <div className="login-card">

  {/* ÍCONO DE USUARIO */}
<div className="icon-wrapper">
  <div className="user-icon-circle">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  </div>
</div>

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
            <p
              style={{ textAlign: 'center', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => { setEsRegistro(!esRegistro); setErrorAuth(""); }}
            >
              {esRegistro ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="login-form">
            <div style={{ background: '#e1f5fe', padding: '12px', border: '2px dashed #0288d1', marginBottom: '15px', borderRadius: '4px' }}>
              <p className="info-text" style={{ margin: 0, color: '#0288d1', fontSize: '14px', lineHeight: '1.4' }}>
                <strong>=</strong> Tu token de seguridad para esta sesión es:
                <span style={{ fontSize: '20px', color: '#000', display: 'block', textAlign: 'center', marginTop: '5px' }}>
                  <strong>{codigoSugerido}</strong>
                </span>
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
}

export default Login;