import React, { useState } from 'react';
import { ArrowRight, ImagePlus, X } from 'lucide-react';
import Modal from './Modal';
import { categories, priorities } from '../lib/constants';

export default function CreateReportModal({ onClose, onSubmit, saving, error }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState('Media');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  return (
    <Modal eyebrow="NUEVA SOLICITUD" title="Crear reporte de servicio" subtitle="Cuéntanos qué está pasando y adjunta fotos si las tienes." onClose={onClose}>
      {error && <div className="error-msg" role="alert">{error}</div>}
      <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSubmit({ title, category, priority, location, description, files }); }}>
        <label>Título del reporte
          <input data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={140} required placeholder="Ej. Cámara sin señal en recepción" />
        </label>
        <div className="two-col">
          <label>Tipo de servicio
            <select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label>Prioridad
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
        </div>
        <label>Ubicación
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sede, piso, zona o dirección" />
        </label>
        <label>Descripción
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={3} maxLength={4000} required rows="4" placeholder="Describe la falla, desde cuándo ocurre y qué afecta…" />
        </label>
        <label className="upload-box">
          <ImagePlus size={22} aria-hidden="true" />
          <span><b>Adjuntar fotografías</b><small>Selecciona una o varias imágenes · máximo 10 MB cada una</small></span>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...files, ...e.target.files])} />
        </label>
        {files.length > 0 && (
          <div className="file-chips">
            {files.map((f, i) => (
              <span key={i}>{f.name}<button type="button" aria-label={`Quitar ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={13} aria-hidden="true" /></button></span>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
          <button className="primary-btn" disabled={saving}>{saving ? 'Enviando…' : 'Enviar reporte'} <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </form>
    </Modal>
  );
}
