import React, { useState } from 'react';
import Modal from './Modal';
import { EMPRESA as E } from '../config/empresa';

const Datos = () => (
  <ul>
    <li><b>Responsable:</b> {E.razonSocial} — {E.nombre}</li>
    <li><b>NIT:</b> {E.nit}</li>
    <li><b>Domicilio:</b> {E.direccion}, {E.ciudad}</li>
    <li><b>Representante legal:</b> Enrique Cárdenas</li>
    <li><b>Correo de contacto y protección de datos:</b> <a href={`mailto:${E.correo}`}>{E.correo}</a></li>
  </ul>
);

const SECTIONS = [
  {
    id: 'privacidad', title: 'Privacidad',
    body: (
      <>
        <h3>Política de tratamiento de datos personales</h3>
        <p>{E.razonSocial}, identificada con NIT {E.nit}, responsable de DACATECH Reportes, adopta esta política conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y las normas colombianas aplicables.</p>
        <h4>1. Responsable</h4><Datos />
        <h4>2. Datos tratados</h4>
        <p>Según el uso de la plataforma, podemos tratar nombres, correos electrónicos, datos de cuenta, empresa y rol asignados, información contenida en reportes de servicio, fechas, ubicaciones escritas por el usuario, novedades, fotografías, documentos, evidencias, historial de actividad, preferencias de notificación y registros necesarios para proteger las cuentas. También podremos tratar datos de facturación y suscripción cuando sean necesarios para la relación comercial.</p>
        <h4>3. Finalidades</h4>
        <ul>
          <li>Crear, autenticar y administrar cuentas y permisos.</li>
          <li>Vincular usuarios con la empresa correspondiente y limitar el acceso a su información.</li>
          <li>Crear, asignar, actualizar, consultar, cerrar y descargar reportes de servicio.</li>
          <li>Almacenar evidencias y mantener el historial de seguimiento.</li>
          <li>Enviar comunicaciones operativas, avisos y notificaciones solicitadas o necesarias para el servicio.</li>
          <li>Gestionar soporte, suscripciones, pagos, facturación y solicitudes.</li>
          <li>Prevenir accesos no autorizados, investigar incidentes y proteger los derechos de los usuarios.</li>
          <li>Atender consultas, reclamos, requerimientos de autoridad y obligaciones legales o contractuales.</li>
        </ul>
        <h4>4. Autorización y libertad</h4>
        <p>Cuando la ley exija autorización, esta se solicitará de manera previa, expresa e informada y se conservará evidencia de la decisión del titular. La aceptación de los términos de uso no sustituye una autorización específica que sea legalmente necesaria. No se solicitarán datos sensibles salvo que exista una finalidad legítima y se cumplan los requisitos legales correspondientes.</p>
        <h4>5. Derechos de los titulares</h4>
        <p>El titular puede conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización cuando corresponda; conocer el uso dado a la información; presentar consultas y reclamos; solicitar la supresión o revocar la autorización cuando legalmente proceda; y acceder gratuitamente a sus datos en los términos de la ley. También puede acudir a la Superintendencia de Industria y Comercio, una vez agotado el trámite previo exigible ante el responsable.</p>
        <h4>6. Consultas y reclamos</h4>
        <p>Las solicitudes deben enviarse a <a href={`mailto:${E.correo}`}>{E.correo}</a>, indicando nombre del titular, descripción clara de la solicitud y un medio para responder. Para proteger la información, podremos solicitar verificación razonable de identidad. Las consultas y reclamos se atenderán dentro de los plazos legales vigentes. Si la solicitud está incompleta, se requerirá la información necesaria conforme a la ley.</p>
        <h4>7. Empresas clientes y roles</h4>
        <p>La empresa cliente es responsable de contar con autorización o fundamento jurídico para los datos personales que incorpora y de definir quién puede consultarlos. {E.razonSocial} tratará la información según su papel como responsable o encargado, las instrucciones contractuales legítimas y la normativa aplicable. Los usuarios no deben cargar información que no estén autorizados a compartir.</p>
        <h4>8. Proveedores y circulación</h4>
        <p>La operación puede requerir proveedores que presten servicios de alojamiento, almacenamiento, autenticación, comunicaciones, mantenimiento y notificaciones. Estos proveedores solo deberán acceder a la información necesaria para sus funciones y bajo obligaciones de confidencialidad y protección de datos. Cuando exista transmisión o transferencia internacional de datos, se cumplirán las condiciones y salvaguardas exigidas por la legislación colombiana. No vendemos datos personales.</p>
        <h4>9. Seguridad</h4>
        <p>Se aplican medidas técnicas, administrativas y organizativas razonables para evitar pérdida, alteración, consulta o acceso no autorizado, incluyendo controles de acceso según las funciones y la empresa. Ninguna medida puede garantizar riesgo cero; los incidentes se gestionarán conforme a la ley.</p>
        <h4>10. Menores y datos sensibles</h4>
        <p>La plataforma está diseñada para uso empresarial y no está dirigida a menores de edad. No deben cargarse datos de menores ni datos sensibles salvo que sea estrictamente necesario, exista fundamento jurídico y se cumplan las protecciones y autorizaciones exigidas por la ley.</p>
        <h4>11. Vigencia y cambios</h4>
        <p>Esta política rige desde su publicación. Las modificaciones sustanciales se comunicarán por medios apropiados y se solicitará una nueva autorización cuando legalmente corresponda.</p>
        <p className="legal-date">Versión {E.versionLegal} · Colombia</p>
      </>
    ),
  },
  {
    id: 'terminos', title: 'Términos',
    body: (
      <>
        <h3>Términos y condiciones de uso</h3>
        <p>Estos términos regulan el acceso y uso de DACATECH Reportes, una plataforma para registrar, administrar y consultar reportes de servicios técnicos, novedades, actividades, evidencias y cierres de atención. Al crear una cuenta o utilizar la plataforma, el usuario acepta estos términos. Las autorizaciones de datos personales se solicitan por separado cuando corresponde.</p>
        <h4>1. Cuentas y acceso</h4>
        <p>El usuario debe proporcionar información veraz, mantenerla actualizada y proteger sus credenciales. Las cuentas son personales. Los administradores de cada empresa deben asignar permisos apropiados y solicitar la desactivación de usuarios que ya no deban acceder.</p>
        <h4>2. Uso permitido</h4>
        <p>La plataforma solo puede usarse para fines empresariales legítimos y conforme a los permisos asignados. Se prohíbe intentar acceder a información de otra empresa, suplantar identidades, interferir con el servicio, vulnerar controles de seguridad o cargar contenido ilícito o que infrinja derechos de terceros.</p>
        <h4>3. Reportes y evidencias</h4>
        <p>La empresa usuaria y sus usuarios son responsables de la exactitud de los datos que registran y de tener autorización para compartir fotografías, documentos, firmas e información de terceros. Los reportes reflejan la información ingresada y no sustituyen inspecciones, certificaciones ni obligaciones previstas en contratos independientes.</p>
        <h4>4. Emergencias y tiempos de atención</h4>
        <p>Registrar un reporte no significa que exista atención inmediata ni constituye un canal de emergencias. Los tiempos de atención dependen del acuerdo de servicio vigente. En situaciones urgentes, el usuario debe comunicarse por los canales de emergencia o contacto establecidos con su proveedor.</p>
        <h4>5. Disponibilidad y cambios</h4>
        <p>Se procura mantener el servicio disponible, pero pueden existir interrupciones por mantenimiento, conectividad, incidentes o causas externas. Las actualizaciones sustanciales de estos términos se comunicarán cuando corresponda.</p>
        <h4>6. Suspensión</h4>
        <p>El acceso podrá limitarse por riesgos de seguridad, uso ilícito, incumplimiento de estos términos, instrucciones legítimas de la empresa administradora o falta de pago de una suscripción, cuando resulte aplicable y se haya informado al cliente. Se comunicará la causa cuando sea posible y procedente.</p>
        <h4>7. Propiedad intelectual</h4>
        <p>La marca, identidad visual, interfaz y materiales propios de DACATECH Reportes están protegidos por las normas aplicables. El usuario conserva los derechos que tenga sobre sus reportes y archivos, y autoriza su uso limitado para almacenar, mostrar, procesar y gestionar el servicio solicitado.</p>
        <h4>8. Responsabilidad</h4>
        <p>Cada empresa es responsable de sus usuarios, permisos y datos. {E.razonSocial} responderá conforme a la ley y a los acuerdos aplicables. Nada en estos términos excluye responsabilidades que legalmente no puedan excluirse.</p>
        <h4>9. Terminación</h4>
        <p>Al finalizar el acceso, la información se gestionará de acuerdo con la política de conservación, las condiciones contratadas y las obligaciones legales. Las obligaciones de confidencialidad y protección de datos continuarán cuando corresponda.</p>
        <h4>10. Ley aplicable y contacto</h4>
        <p>Estos términos se rigen por las leyes de Colombia. Contacto: <a href={`mailto:${E.correo}`}>{E.correo}</a>.</p>
        <Datos /><p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'cookies', title: 'Cookies',
    body: (
      <>
        <h3>Política de cookies y almacenamiento local</h3>
        <p>DACATECH Reportes puede utilizar almacenamiento local y tecnologías similares estrictamente necesarias para mantener la sesión, recordar preferencias básicas, proteger el acceso y permitir funciones que el usuario active, como notificaciones.</p>
        <h4>Tipos y finalidades</h4>
        <ul>
          <li><b>Sesión y autenticación:</b> permiten iniciar sesión, mantenerla y proteger el acceso.</li>
          <li><b>Preferencias:</b> recuerdan elecciones de funcionamiento, como el cierre de avisos informativos.</li>
          <li><b>Notificaciones:</b> cuando el usuario las activa, se utilizan los identificadores técnicos necesarios para entregar avisos en el dispositivo o navegador.</li>
        </ul>
        <p>El usuario puede gestionar o borrar el almacenamiento desde la configuración del navegador o dispositivo. Al eliminarlo, puede ser necesario iniciar sesión de nuevo o volver a configurar ciertas funciones. El bloqueo de tecnologías necesarias puede impedir que algunas funciones trabajen correctamente.</p>
        <p>No se utilizarán datos de navegación para fines publicitarios incompatibles con esta política sin la información y autorizaciones que correspondan. Cualquier herramienta adicional de analítica o seguimiento que se incorpore deberá reflejarse en esta política antes de su uso.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'suscripcion', title: 'Suscripciones',
    body: (
      <>
        <h3>Condiciones de suscripción, pagos y cancelación</h3>
        <h4>1. Planes y contratación</h4>
        <p>DACATECH Reportes puede ofrecer planes con diferentes funciones, límites, precios y periodos. Antes de contratar, el cliente recibirá la información del plan elegido, precio total, periodicidad y condiciones aplicables.</p>
        <h4>2. Pagos y activación</h4>
        <p>Cuando el pago sea por transferencia bancaria, el cliente deberá seguir las instrucciones comunicadas. Enviar un comprobante no equivale a confirmación del pago. La activación se realiza después de verificar el pago y confirmar el plan contratado.</p>
        <h4>3. Periodo y renovación</h4>
        <p>El periodo de suscripción, fecha de inicio, vencimiento y modalidad de renovación serán los informados en la contratación y podrán consultarse en el panel correspondiente. Cuando una renovación sea automática, se informará claramente antes de contratar y se indicará cómo cancelarla.</p>
        <h4>4. Cambios de plan y precios</h4>
        <p>Los cambios de plan y los ajustes de precio se informarán antes de aplicarse, incluyendo el efecto sobre el periodo vigente y los importes que correspondan. No se aplicarán cobros distintos a los informados y aceptados por el cliente.</p>
        <h4>5. Vencimiento y suspensión</h4>
        <p>Si el pago no se recibe o verifica dentro del periodo aplicable, la cuenta podrá quedar limitada o suspendida conforme al plan contratado. Se informará el estado de la suscripción y el procedimiento para regularizarla. La suspensión de acceso no elimina las obligaciones de protección de datos ni los derechos legales del cliente.</p>
        <h4>6. Cancelación</h4>
        <p>El cliente puede solicitar la cancelación escribiendo a <a href={`mailto:${E.correo}`}>{E.correo}</a>. La fecha efectiva, el acceso durante el periodo pagado y cualquier saldo pendiente se regirán por las condiciones informadas al contratar y la ley aplicable.</p>
        <h4>7. Reembolsos y errores de pago</h4>
        <p>Los pagos duplicados, pagos realizados por error, cobros no autorizados y solicitudes de devolución serán revisados individualmente. Los reembolsos y el derecho de retracto, cuando procedan, se regirán por la legislación colombiana y las condiciones de contratación. Ninguna condición de esta política limita derechos irrenunciables del consumidor.</p>
        <h4>8. Datos y exportación tras la cancelación</h4>
        <p>El cliente tendrá un plazo de treinta (30) días calendario desde la terminación efectiva para solicitar o realizar la descarga de los reportes disponibles. Transcurrido ese plazo, los datos podrán eliminarse de los sistemas activos dentro de los siguientes noventa (90) días, salvo información que deba conservarse por obligación legal, prevención de fraude o atención de reclamaciones. Las copias de respaldo se eliminarán conforme a sus ciclos de renovación, en un plazo máximo operativo de ciento ochenta (180) días, salvo obligación legal o técnica justificada. Durante esos periodos, el acceso puede estar limitado.</p>
        <h4>9. Contacto comercial</h4>
        <p>Para asuntos de planes, pagos, facturación, cancelaciones o reembolsos, escribe a <a href={`mailto:${E.correo}`}>{E.correo}</a>.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'autorizacion', title: 'Autorización',
    body: (
      <>
        <h3>Autorización para el tratamiento de datos personales</h3>
        <p>Al marcar voluntariamente la casilla de autorización, declaro que he leído la Política de Tratamiento de Datos Personales de {E.razonSocial} y que recibí información sobre las finalidades descritas. Autorizo, cuando legalmente corresponda, la recolección, almacenamiento, consulta, uso, actualización y circulación restringida de mis datos para administrar mi cuenta, asociarla a una empresa, gestionar reportes y evidencias, comunicar novedades, prestar soporte, administrar suscripciones y cumplir obligaciones legales o contractuales.</p>
        <p>Declaro conocer mis derechos a consultar, actualizar y rectificar mis datos, solicitar prueba de la autorización, conocer el uso dado a la información, presentar consultas y reclamos, y solicitar la supresión o revocatoria cuando legalmente proceda. Puedo ejercerlos escribiendo a <a href={`mailto:${E.correo}`}>{E.correo}</a>.</p>
        <p>No estoy obligado a autorizar el tratamiento de datos sensibles. Si alguna función excepcional requiere estos datos, se informará su carácter y finalidad y se solicitará autorización explícita independiente cuando sea legalmente posible.</p>
        <h4>Registro de la autorización</h4>
        <p>La plataforma podrá conservar la identificación del usuario, fecha y hora, versión del texto aceptado y evidencia de la acción afirmativa, con el propósito de demostrar la autorización. La casilla no debe aparecer premarcada. La aceptación de términos y la autorización de datos deben presentarse de forma clara y diferenciada cuando sus finalidades sean distintas.</p>
        <p><b>Responsable:</b> {E.razonSocial} · NIT {E.nit} · {E.direccion}, {E.ciudad} · <a href={`mailto:${E.correo}`}>{E.correo}</a>.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'conservacion', title: 'Conservación',
    body: (
      <>
        <h3>Conservación, eliminación y solicitudes de información</h3>
        <h4>1. Durante la prestación del servicio</h4>
        <p>Los datos se conservan mientras sean necesarios para operar las cuentas, gestionar reportes, prestar soporte, cumplir obligaciones contractuales y atender deberes legales.</p>
        <h4>2. Reportes, fotografías y evidencias</h4>
        <p>Las empresas clientes deben asegurar que cuentan con fundamento jurídico para los datos que registran y determinar los periodos que requieren para sus propios fines. Las fotografías y evidencias se conservarán mientras sean necesarias para prestar el servicio y durante los periodos legales o contractuales aplicables.</p>
        <h4>3. Cancelación de la suscripción</h4>
        <p>La empresa dispone de treinta (30) días calendario desde la terminación efectiva para solicitar o realizar la descarga de sus reportes disponibles. Luego, los datos podrán eliminarse de los sistemas activos dentro de los siguientes noventa (90) días, salvo obligación legal, reclamación pendiente o necesidad legítima de conservación.</p>
        <h4>4. Copias de respaldo</h4>
        <p>Las copias de respaldo se eliminan de acuerdo con sus ciclos de renovación, con un plazo operativo máximo de ciento ochenta (180) días, salvo que una obligación legal requiera conservar determinada información. Los datos eliminados no se restablecerán para uso ordinario salvo que sea necesario para recuperar el servicio tras un incidente, y en ese caso se respetarán las obligaciones de protección aplicables.</p>
        <h4>5. Solicitudes de eliminación</h4>
        <p>Las solicitudes se evaluarán conforme a la ley, al papel de DACATECH como responsable o encargado y a las obligaciones de conservación. La eliminación puede no ser inmediata cuando exista un deber legal de conservar información, una reclamación pendiente o una necesidad legítima permitida por la ley.</p>
        <h4>6. Consultas</h4>
        <p>Para solicitar acceso, actualización, corrección o eliminación cuando proceda, escribe a <a href={`mailto:${E.correo}`}>{E.correo}</a>.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
  {
    id: 'accesibilidad', title: 'Accesibilidad',
    body: (
      <>
        <h3>Compromiso de accesibilidad</h3>
        <p>DACATECH Reportes procura ofrecer una experiencia clara y accesible. Se promueven etiquetas comprensibles, navegación por teclado, indicadores de foco, mensajes de error descriptivos y estados que no dependan únicamente del color. La experiencia puede variar según el dispositivo y navegador.</p>
        <p>Si encuentras una barrera de acceso o necesitas asistencia para consultar la información legal, escríbenos a <a href={`mailto:${E.correo}`}>{E.correo}</a> describiendo el problema.</p>
        <p className="legal-date">Versión {E.versionLegal}</p>
      </>
    ),
  },
];

export default function Legal({ initial = 'privacidad', onClose }) {
  const [tab, setTab] = useState(initial);
  const current = SECTIONS.find((s) => s.id === tab) || SECTIONS[0];
  return (
    <Modal eyebrow="INFORMACIÓN LEGAL" title="Información legal" onClose={onClose} wide>
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
      <button type="button" className="link-btn" onClick={() => onOpen('suscripcion')}>Suscripciones</button>
      <button type="button" className="link-btn" onClick={() => onOpen('autorizacion')}>Autorización de datos</button>
      <button type="button" className="link-btn" onClick={() => onOpen('conservacion')}>Conservación</button>
      <button type="button" className="link-btn" onClick={() => onOpen('accesibilidad')}>Accesibilidad</button>
    </nav>
  );
}
