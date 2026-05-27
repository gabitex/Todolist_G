import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App(){
  const [tareas, setTareas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");

  const [paginaTareas, setPaginaTareas] = useState(1);
  const [paginaArchivos, setPaginaArchivos] = useState(1);
  const itemsPorPagina = 4;

  const API_URL = "http://localhost:300/listadetareas/appv1";

  useEffect(() => { 
    fetchTareas(); 
    fetchArchivos(); 
  }, []);

  const fetchTareas = async () =>{
    try {
      const res = await axios.get(API_URL);
      setTareas(res.data.data || []);
    } catch (err) { console.error("Error fetching tasks:", err); }
  };

  const fetchArchivos = async () =>{
    try {
      const res = await axios.get('http://localhost:300/drive/files');
      setArchivos(res.data || []);
    } catch (err) { console.error("Error fetching files:", err); }
  };

  const agregarTarea = async (e) =>{
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    try {
      await axios.post(API_URL, { tarea: nuevaTarea });
      setNuevaTarea("");
      fetchTareas();
    } catch (err) { console.error("Error adding task:", err); }
  };

  const eliminarTarea = async (id) =>{
    if (!id) return;
    try {
      // Usamos el ID de MongoDB para la ruta DELETE
      await axios.delete(`${API_URL}/${id}`);
      fetchTareas();
    } catch (err) { console.error("Error deleting task:", err); }
  };

  const guardarEdicion = async (id) =>{
    if (!textoEditado.trim()){
      setEditandoId(null);
      return;
    }
    try {
      // Usamos el ID de MongoDB para la ruta PUT
      await axios.put(`${API_URL}/${id}`, { tarea: textoEditado });
      setEditandoId(null);
      fetchTareas();
    } catch (err) { console.error("Error updating task:", err); }
  };

  const cambiarEstado = async (id, estadoActual) =>{
    try {
      await axios.put(`${API_URL}/${id}`, { finalizado: !estadoActual });
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const tareasActuales = tareas.slice((paginaTareas - 1) * itemsPorPagina, paginaTareas * itemsPorPagina);
  const archivosActuales = archivos.slice((paginaArchivos - 1) * itemsPorPagina, paginaArchivos * itemsPorPagina);

  return (
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
                    // SOLUCIÓN AL ENTER
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
                {/* SOLUCIÓN AL ELIMINAR CON ID */}
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
  );
}

export default App;