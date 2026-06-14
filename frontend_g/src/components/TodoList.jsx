import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://localhost:300/listadetareas/appv1";

function TodoList() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [paginaTareas, setPaginaTareas] = useState(1);
  const itemsPorPagina = 3;

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await axios.get(API_URL);
      setTareas(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const agregarTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    try {
      await axios.post(API_URL, { tarea: nuevaTarea });
      setNuevaTarea("");
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const eliminarTarea = async (id) => {//hecho con ayuda de ia claude-------------------------------------
    if (!id) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const guardarEdicion = async (id) => {
    if (!textoEditado.trim()) { setEditandoId(null); return; }
    try {
      await axios.put(`${API_URL}/${id}`, { tarea: textoEditado });
      setEditandoId(null);
      fetchTareas();
    } catch (err) { console.error(err); }
  };

  const cambiarEstado = async (id, estadoActual) => {
    try {
      await axios.put(`${API_URL}/${id}`, { finalizado: !estadoActual });
      fetchTareas();
    } catch (err) { console.error(err); }
  };
//hasta ahi, hecho con ayuda de la ia claude------------------------------------------------------------------
  const totalPaginas = Math.ceil(tareas.length / itemsPorPagina);//corta el arraya para mosgrar 3 tareas
  const tareasActuales = tareas.slice((paginaTareas - 1) * itemsPorPagina, paginaTareas * itemsPorPagina);

  return (
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
        <button onClick={() => setPaginaTareas(p => Math.max(p - 1, 1))} className="pag-btn">{"<"}</button>
        <button className="pag-btn active">{paginaTareas}</button>
        <button onClick={() => setPaginaTareas(p => Math.min(p + 1, totalPaginas))} className="pag-btn">{">"}</button>
      </div>
    </div>
  );
}

export default TodoList;
