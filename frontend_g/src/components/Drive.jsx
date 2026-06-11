import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Drive() {
  const [archivos, setArchivos] = useState([]);
  const [paginaArchivos, setPaginaArchivos] = useState(1);
  const itemsPorPagina = 3;// maximo 3 arch por pag

  useEffect(() => {
    fetchArchivos();
  }, []);

  const fetchArchivos = async () => {
    try {
      const res = await axios.get('http://localhost:300/drive/files');
      setArchivos(res.data || []);
    } catch (err) { console.error(err); }
  };

  const totalPaginas = Math.ceil(archivos.length / itemsPorPagina);
  const archivosActuales = archivos.slice((paginaArchivos - 1) * itemsPorPagina, paginaArchivos * itemsPorPagina);

  return (
    <div className="column">
      <div className="drive-header-row">
        <h1 className="main-title">DRIVE</h1>
        <label className="upload-btn">
          + UPLOAD
          <input type="file" onChange={async (e) => {
            const d = new FormData();
            d.append('archivo', e.target.files[0]);
            await axios.post('http://localhost:300/drive/upload', d);
            fetchArchivos();
          }} hidden />
        </label>
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
        <button onClick={() => setPaginaArchivos(p => Math.max(p - 1, 1))} className="pag-btn">{"<"}</button>
        <button className="pag-btn active">{paginaArchivos}</button>
        <button onClick={() => setPaginaArchivos(p => Math.min(p + 1, totalPaginas))} className="pag-btn">{">"}</button>
      </div>
    </div>
  );
}

export default Drive;
