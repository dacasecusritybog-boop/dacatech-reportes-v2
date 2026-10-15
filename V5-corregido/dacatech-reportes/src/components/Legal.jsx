import React, { useState } from 'react';
import Modal from './Modal';
import { EMPRESA as E } from '../config/empresa';

// Resalta en amarillo los datos de empresa que todavía no se han completado.
const V = ({ children }) =>
  String(children).startsWith('[COMPLETAR') ? <mark className="pend" title="Dato pendiente de completar en src/config/empresa.js">{children}</mark> : <>{children}</>;

const Datos = () => (
  <ul>
    <li><b>Razón social:</b> <V>{E.razonSocial}</V> (marca comercial {E.nombre})</li>
    <li><b>NIT:</b> <V>{E.nit}</V></li>
    <li><b>Domicilio:</b> <V>{E.direccion}</V>, <V>{E.ciudad}</V></li>
    <li><b>Correo para consultas, reclamos y datos personales:</b> <V>{E.correo}</V></li>
    <li><b>Teléfono / WhatsApp:</b> <V>{E.telefono}</V></li>
    <li><b>Sitio web:</b> <V>{E.sitioWeb}</V></li>
  </ul>
);

const SECTIONS = [
  {
    id: 'privacidad', title: 'Privacidad',
    body: (
      <>
        <h3>Política de privacidad y tratamiento de datos personales</h3>
        <p>En cumplimiento de la Ley 1581 de 2012 y sus normas reglamentarias (Colombia), {E.nombre} informa cómo trata los datos personales que se registran en este portal.</p>
        <h4>Responsable del tratamiento</h4>
        <Datos />
        <h4>Datos que recolectamos</h4>
        <ul>
          <li>Datos de cuenta: nombre, correo electrónico, empresa a la que perteneces y rol dentro del portal.</li>
          <li>Contenido de los reportes: título, descripción, tipo de servicio, prioridad, ubicación que escribas y fotografías o evidencias que adjuntes, además del historial de seguimiento.</li>
          <li>Datos para notificaciones (solo si las activas): identificador técnico del dispositivo/navegador necesario para enviarte avisos.</li>
          <li>Registro de aceptación de estos términos (fecha y versión).</li>
        </ul>
        <h4>Finalidades</h4>
        <ul>
          <li>Crear tu cuenta y controlar el acceso al portal.</li>
          <li>Recibir, atender, asignar, documentar y cerrar los reportes de servicio técnico.</li>
          <li>Avisarte de novedades de tus reportes (correo de la cuenta y, si lo activas, notificaciones al dispositivo).</li>
          <li>Mantener la seguridad del servicio y atender requerimientos legales.</li>
        </ul>
        <h4>Autorización</h4>
        <p>Al crear tu cuenta aceptas esta política y autorizas el tratamiento descrito. Puedes revocar la autorización o solicitar la supresión de tus datos, salvo cuando exista un deber legal o contractual de conservarlos.</p>
        <h4>Tus derechos</h4>
        <p>Como titular puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización; ser informado del uso que se les da; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y solicitar la supresión; y acceder gratuitamente a tus datos. Para ejercerlos escribe a <V>{E.correo}</V>.</p>
        <h4>Encargados y terceros</h4>
        <p>Para operar el portal usamos proveedores que tratan datos por nuestra cuenta: <b>Supabase</b> (autenticación, base de datos y almacenamiento de archivos), el proveedor de alojamiento del sitio web y los servicios de notificaciones push de tu navegador o sistema (Google, Apple, Mozilla o Microsoft, según el dispositivo). Algunos pueden estar ubicados fuera de Colombia; en ese caso exigimos medidas de seguridad adecuadas. No vendemos tus datos.</p>
        <h4>Conservación y seguridad</h4>
        <p>Conservamos la información mientras exista la relación de servicio y durante el tiempo que exijan la ley o la atención de garantías y reclamaciones. Aplicamos conexión cifrada (HTTPS), control de acceso por empresa y rol, y almacenamiento privado de las fotografías con enlaces temporales. Ningún sistema es infalible; si detectamos un incidente que afecte tus datos, actuaremos conforme a la ley.</p>
        <h4>Menores de edad</h4>
        <p>El portal está dirigido a personas mayores de edad y a representantes de empresas clientes.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'terminos', title: 'Términos',
    body: (
      <>
        <h3>Términos y condiciones de uso</h3>
        <p>Al usar este portal aceptas estos términos.</p>
        <ul>
          <li><b>Objeto.</b> El portal permite a clientes de {E.nombre} reportar fallas o novedades de los servicios de seguridad electrónica y hacer seguimiento a su atención.</li>
          <li><b>Cuenta.</b> Eres responsable de la confidencialidad de tu contraseña y de la actividad de tu cuenta. El acceso a la información de una empresa lo habilita {E.nombre}.</li>
          <li><b>Uso adecuado.</b> Debes entregar información veraz y no subir contenido ilegal, ofensivo, malicioso ni imágenes de terceros sin su autorización. Podemos suspender cuentas que incumplan.</li>
          <li><b>Tiempos de atención.</b> Un reporte registrado en el portal no equivale a una atención inmediata ni a una emergencia. Los tiempos de respuesta dependen del contrato o acuerdo de servicio vigente con {E.nombre}. En emergencias, comunícate con las líneas de emergencia o con tu contacto directo.</li>
          <li><b>Disponibilidad.</b> Procuramos mantener el portal disponible, pero puede haber interrupciones por mantenimiento o por causas de terceros.</li>
          <li><b>Notificaciones.</b> Son opcionales y su entrega depende del dispositivo, el navegador y la conexión; no sustituyen otros canales de contacto.</li>
          <li><b>Cambios.</b> Podemos actualizar estos términos; la versión vigente será la publicada aquí.</li>
          <li><b>Ley aplicable.</b> Estos términos se rigen por las leyes de la República de Colombia.</li>
        </ul>
        <h4>Datos de la empresa</h4>
        <Datos />
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'cookies', title: 'Cookies',
    body: (
      <>
        <h3>Política de cookies y almacenamiento local</h3>
        <p>Este portal usa únicamente almacenamiento <b>estrictamente necesario</b> en tu dispositivo:</p>
        <ul>
          <li><b>Sesión de acceso</b> (almacenamiento local del navegador, generado por Supabase Auth): te mantiene conectado de forma segura.</li>
          <li><b>Preferencias</b>: recordar que ya viste el aviso de cookies.</li>
          <li><b>Service worker</b> (solo si activas notificaciones o instalas la app): permite recibir avisos aunque la app esté cerrada.</li>
        </ul>
        <p>No usamos cookies de publicidad, analítica ni de seguimiento de terceros. Las fuentes tipográficas se sirven desde el propio sitio. Puedes borrar estos datos desde los ajustes de tu navegador; si lo haces, tendrás que iniciar sesión de nuevo.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'garantias', title: 'Garantías y reembolsos',
    body: (
      <>
        <h3>Garantías, devoluciones y reembolsos</h3>
        <p>Este portal <b>no vende productos ni procesa pagos</b>; es un canal de soporte. Las garantías, devoluciones, reembolsos y el derecho de retracto aplicables a los equipos o servicios contratados con {E.nombre} se rigen por la cotización, el contrato o la factura correspondiente y por el Estatuto del Consumidor (Ley 1480 de 2011).</p>
        <p>Para consultar o reclamar una garantía, crea un reporte indicando el equipo o servicio, o escribe a <V>{E.correo}</V>. También puedes acudir a la Superintendencia de Industria y Comercio (SIC) si consideras vulnerados tus derechos como consumidor.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'accesibilidad', title: 'Accesibilidad',
    body: (
      <>
        <h3>Declaración de accesibilidad</h3>
        <p>Buscamos que el portal sea usable por la mayor cantidad de personas posible, tomando como guía las pautas WCAG 2.1 nivel AA. Medidas aplicadas:</p>
        <ul>
          <li>Contraste de color suficiente entre texto y fondo.</li>
          <li>Navegación completa con teclado, indicador de foco visible y enlace «Saltar al contenido».</li>
          <li>Formularios con etiquetas claras y mensajes de error anunciados a lectores de pantalla.</li>
          <li>Diálogos que atrapan el foco y se cierran con la tecla Escape.</li>
          <li>Respeto a la preferencia del sistema de reducir animaciones.</li>
          <li>El estado de un reporte se indica con texto, no solo con color.</li>
        </ul>
        <p>Es posible que persistan barreras. Si encuentras alguna, cuéntanos a <V>{E.correo}</V> y la corregiremos.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'propiedad', title: 'Derechos y terceros',
    body: (
      <>
        <h3>Derechos de autor, imágenes y servicios de terceros</h3>
        <ul>
          <li>El nombre, logotipo y diseño de {E.nombre} son de su titular. No se usan imágenes de bancos de fotos ni de terceros en la interfaz.</li>
          <li>Las fotografías y evidencias que subas siguen siendo tuyas. Nos otorgas una licencia limitada para almacenarlas y usarlas con el único fin de atender tus reportes. Sube solo imágenes que tengas derecho a compartir y evita captar personas identificables sin su autorización.</li>
          <li>Este portal se apoya en software y servicios de terceros: Supabase (cuentas, base de datos y archivos), el servicio de alojamiento web y los servicios de notificaciones del navegador. Las librerías de código abierto utilizadas mantienen sus propias licencias.</li>
        </ul>
        <h4>Marca y afirmaciones</h4>
        <p>La información de este portal es de apoyo al servicio; no constituye garantía de resultados ni de disponibilidad de los sistemas de seguridad del cliente.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
];

export default function Legal({ initial = 'privacidad', onClose }) {
  const [tab, setTab] = useState(initial);
  const current = SECTIONS.find((s) => s.id === tab) || SECTIONS[0];
  return (
    <Modal eyebrow="INFORMACIÓN LEGAL" title="Legal y accesibilidad" onClose={onClose} wide>
      {!E.revisadoPorAbogado && (
        <p className="warning" role="note">Texto base pendiente de revisión legal. Debe ser validado por un abogado antes de publicarse como definitivo.</p>
      )}
      <div className="legal-tabs" role="tablist" aria-label="Documentos legales">
        {SECTIONS.map((s) => (
          <button key={s.id} role="tab" type="button" id={`tab-${s.id}`} aria-selected={tab === s.id} aria-controls="legal-panel"
            className={tab === s.id ? 'on' : ''} onClick={() => setTab(s.id)} data-autofocus={s.id === initial ? '' : undefined}>
            {s.title}
          </button>
        ))}
      </div>
      <div className="legal-body" role="tabpanel" id="legal-panel" aria-labelledby={`tab-${current.id}`} tabIndex={0}>
        {current.body}
      </div>
    </Modal>
  );
}

export function LegalLinks({ onOpen, className = '' }) {
  return (
    <nav className={`legal-links ${className}`} aria-label="Información legal">
      <button type="button" className="link-btn" onClick={() => onOpen('privacidad')}>Privacidad</button>
      <button type="button" className="link-btn" onClick={() => onOpen('terminos')}>Términos</button>
      <button type="button" className="link-btn" onClick={() => onOpen('cookies')}>Cookies</button>
      <button type="button" className="link-btn" onClick={() => onOpen('accesibilidad')}>Accesibilidad</button>
    </nav>
  );
}
