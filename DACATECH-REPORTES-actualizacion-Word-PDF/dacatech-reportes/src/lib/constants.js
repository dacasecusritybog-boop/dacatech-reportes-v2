export const categories = ['CCTV y cámaras', 'Control de acceso', 'Detección de incendios', 'Redes y cableado', 'Alarmas de intrusión', 'Otros servicios'];
export const statuses = ['Recibido', 'En revisión', 'Asignado', 'En atención', 'Solucionado', 'Cerrado'];
export const priorities = ['Baja', 'Media', 'Alta', 'Crítica'];
export const roleLabel = { admin: 'Administrador', technician: 'Técnico', customer: 'Cliente' };
export const statusClass = (s) => (s || 'Recibido').toLowerCase().replaceAll(' ', '-');
export const fmtDate = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
