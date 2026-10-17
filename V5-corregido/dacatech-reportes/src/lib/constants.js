export const categories = ['Mantenimiento', 'Infraestructura y obras', 'Energía y comunicaciones', 'Tecnología y sistemas', 'Seguridad', 'Aseo y servicios generales', 'Logística y operaciones', 'Atención al cliente', 'Otro servicio'];
export const statuses = ['Recibido', 'En revisión', 'Asignado', 'En atención', 'Solucionado', 'Cerrado'];
export const priorities = ['Baja', 'Media', 'Alta', 'Crítica'];
export const roleLabel = { admin: 'Administrador de empresa', supervisor: 'Supervisor / coordinador', technician: 'Responsable operativo', customer: 'Cliente / solicitante' };
export const statusClass = (s) => (s || 'Recibido').toLowerCase().replaceAll(' ', '-');
export const fmtDate = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
