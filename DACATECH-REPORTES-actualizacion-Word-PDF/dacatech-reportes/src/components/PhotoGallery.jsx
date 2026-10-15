import React, { useEffect, useState } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PhotoGallery({ photos }) {
  const [urls, setUrls] = useState({});
  const key = photos.map((p) => p.id + ':' + p.storage_path).join('|');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase || !photos.length) return;
      const paths = photos.map((p) => p.storage_path);
      const { data } = await supabase.storage.from('report-photos').createSignedUrls(paths, 300);
      if (!alive || !data) return;
      const next = {};
      photos.forEach((p, i) => { if (data[i]?.signedUrl) next[p.id] = data[i].signedUrl; });
      setUrls(next);
    })();
    return () => { alive = false; };
  }, [key]); // eslint-disable-line

  if (!photos.length) return <div className="photos-empty"><Camera size={18} aria-hidden="true" /> No hay fotografías adjuntas.</div>;
  return (
    <div className="photo-section">
      <h3><Camera size={18} aria-hidden="true" /> Fotografías y evidencias</h3>
      <div className="photo-grid">
        {photos.map((p) => (
          <a key={p.id} href={urls[p.id] || '#'} target="_blank" rel="noreferrer" className="photo-tile"
            aria-label={`${p.photo_type === 'service' ? 'Evidencia de atención' : 'Foto del cliente'}: ${p.caption || 'abrir imagen'}`}
            onClick={(e) => { if (!urls[p.id]) e.preventDefault(); }}>
            {urls[p.id] ? <img src={urls[p.id]} alt={p.caption || 'Evidencia del reporte'} loading="lazy" /> : <div className="photo-loading"><ImagePlus aria-hidden="true" /></div>}
            <span>{p.photo_type === 'service' ? 'Evidencia de atención' : 'Foto del cliente'}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
