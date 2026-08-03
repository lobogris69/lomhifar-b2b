import Link from 'next/link';
import {
  BookOpen, ClipboardList, Zap, Users, Building2, Megaphone, Package,
  Type, Image as ImageIcon, Users2, Settings, HelpCircle, Truck,
  MessageCircle, Shield, Rocket, FileText, KeyRound,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manual de ayuda · Admin Lomhifar' };

/**
 * Manual de ayuda accesible desde el propio admin.
 * Todo el contenido es estático — cualquier admin puede consultarlo
 * en cualquier momento sin conexión a servicios externos.
 */
export default function HelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Manual de ayuda</h1>
          <p className="section-subtitle">
            Guía rápida para hacer cualquier cosa desde el panel de administración.
          </p>
        </div>
      </div>

      {/* Índice */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-ink-900 mb-3">Índice</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <IndexLink href="#empezar" icon={Rocket} label="Cómo empezar cada día" />
          <IndexLink href="#pedidos" icon={ClipboardList} label="Gestión de pedidos" />
          <IndexLink href="#pedido-manual" icon={FileText} label="Pedido por teléfono / visita / nota" />
          <IndexLink href="#laser" icon={Zap} label="Grabado láser (DXF para EZCAD)" />
          <IndexLink href="#envios" icon={Truck} label="Envíos y tracking (Correos)" />
          <IndexLink href="#clientes" icon={Users} label="Farmacias clientes" />
          <IndexLink href="#solicitudes" icon={Building2} label="Solicitudes de alta" />
          <IndexLink href="#cartel" icon={Megaphone} label="Cartel promocional y QR" />
          <IndexLink href="#stock" icon={Package} label="Stock de pulseras" />
          <IndexLink href="#textos" icon={Type} label="Textos e imágenes editables" />
          <IndexLink href="#usuarios" icon={Users2} label="Usuarios admin y roles" />
          <IndexLink href="#config" icon={Settings} label="Configuración general" />
          <IndexLink href="#faq" icon={HelpCircle} label="Preguntas frecuentes (FAQ)" />
          <IndexLink href="#emergencias" icon={Shield} label="Emergencias" />
        </div>
      </div>

      {/* CÓMO EMPEZAR */}
      <Section id="empezar" icon={Rocket} title="Cómo empezar cada día">
        <ol className="list-decimal list-inside space-y-1.5 text-sm">
          <li>Entra a <A href="/admin">/admin</A> (login con tu email y contraseña).</li>
          <li>En el dashboard ves de un vistazo: clientes activos, solicitudes pendientes, pedidos del mes y total facturado.</li>
          <li>Si hay número ámbar junto a «Solicitudes» en el menú lateral → hay farmacias nuevas esperando aprobación.</li>
          <li>Si hay número ámbar junto a «Stock» → algún color está por debajo del nivel de alerta.</li>
          <li>Los <strong>pedidos nuevos</strong> te llegan por email; también aparecen en <A href="/admin/pedidos">/admin/pedidos</A>.</li>
        </ol>
        <Tip>
          Marca <code className="tag">pulseraspersonalizadas.lomhifar.net/admin</code> como
          favorito en tu navegador para acceder rápido.
        </Tip>
      </Section>

      {/* PEDIDOS */}
      <Section id="pedidos" icon={ClipboardList} title="Gestión de pedidos">
        <SubDetail title="Ver un pedido">
          <p>En <A href="/admin/pedidos">/admin/pedidos</A> verás la lista completa. Filtros:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>Buscar</strong>: por nº de pedido, farmacia o CIF.</li>
            <li><strong>Estado</strong>: filtra por estado (Recibido, En preparación, Enviado, Entregado, Cancelado…).</li>
            <li><strong>Desde/Hasta</strong>: por rango de fechas.</li>
          </ul>
          <p>Pulsa en el número de pedido para abrirlo y ver todo el detalle.</p>
        </SubDetail>

        <SubDetail title="Cambiar el estado de un pedido">
          <p>Dentro del pedido (<code className="tag">/admin/pedidos/[id]</code>):</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Bloque «Estado del pedido» arriba a la derecha.</li>
            <li>Elige el nuevo estado y opcionalmente marca «Notificar al cliente por email».</li>
            <li>Pulsa «Actualizar».</li>
          </ul>
          <p className="mt-2 text-xs text-ink-600">
            Estados: <strong>RECIBIDO</strong> → <strong>EN PREPARACIÓN</strong> →{' '}
            <strong>ENVIADO</strong> → <strong>ENTREGADO</strong>. También pueden estar{' '}
            <strong>EN ESPERA</strong>, <strong>CANCELADO</strong>, <strong>FACTURADO</strong>.
          </p>
        </SubDetail>

        <SubDetail title="Añadir notas internas">
          <p>Cada pedido tiene un campo «Notas internas» que sólo se ve en el admin (no llega al cliente). Útil para anotar incidencias, forma de pago, urgencias, etc.</p>
        </SubDetail>

        <SubDetail title="Imprimir un pedido">
          <p>Botón «🖨 Imprimir» arriba del pedido. Formato listo para PDF con los datos del cliente, líneas de pulseras y totales.</p>
        </SubDetail>

        <SubDetail title="Exportar todos los pedidos a Excel">
          <p>En <A href="/admin/pedidos">/admin/pedidos</A> → botón «Exportar a Excel (CSV)». Respeta los filtros que tengas activos.</p>
        </SubDetail>
      </Section>

      {/* PEDIDO MANUAL */}
      <Section id="pedido-manual" icon={FileText} title="Pedido por teléfono, WhatsApp, visita o nota escrita">
        <p className="text-sm mb-3">
          Cuando una farmacia te pide por una vía distinta de la web (llamada, visita comercial,
          WhatsApp, nota en papel…), lo introduces desde el admin así:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm">
          <li>Ve a <A href="/admin/pedidos/nuevo">/admin/pedidos/nuevo</A> (también hay botón «Nuevo pedido manual» arriba en la lista de pedidos).</li>
          <li><strong>Selecciona la farmacia</strong>: busca por CIF, nombre, ciudad o email.</li>
          <li>Si la farmacia <strong>no está registrada</strong>: pulsa «Crear cliente rápido», rellena los datos mínimos (CIF, nombre, email) y se da de alta automáticamente.</li>
          <li>Añade las <strong>pulseras</strong>: color (negra/roja), unidades y hasta 3 líneas de texto por pulsera.</li>
          <li>Elige el <strong>canal de entrada</strong> (Teléfono / Email / WhatsApp / Visita comercial / Nota escrita / Otro) — se guarda para poder hacer estadísticas después.</li>
          <li>Marca o desmarca «<strong>Notificar al cliente por email</strong>» según prefieras. Por defecto va marcado.</li>
          <li>Opcional: nota interna con detalles del pedido (ej. «tomado por Juan en visita del 3-agosto»).</li>
          <li>Pulsa «Guardar pedido».</li>
        </ol>
        <Tip>
          El pedido se crea EXACTAMENTE igual que uno hecho desde la web (mismos precios,
          mismos descuentos por volumen, mismo IVA). Se distingue en la lista con una etiqueta
          ámbar «📱 MANUAL» junto al número.
        </Tip>
      </Section>

      {/* LÁSER */}
      <Section id="laser" icon={Zap} title="Grabado láser · Generar DXF para EZCAD">
        <SubDetail title="Configurar el área de tu placa (una sola vez)">
          <p>En <A href="/admin/laser">/admin/laser</A>:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>Ancho × alto</strong> de la placa metálica (mm).</li>
            <li><strong>Márgenes izq/der/sup/inf</strong>: espacio donde el láser NO grabará. Aumenta el margen izquierdo si la Estrella de la Vida ya viene estampada en esa zona.</li>
            <li><strong>Interlineado</strong> (factor 1.0–3.0): 1.05 es lo estándar; sube a 1.2 si quieres las líneas más separadas.</li>
            <li><strong>Resolución curvas</strong>: 24 es óptimo. Solo sube si las curvas de las letras se ven angulosas en EZCAD.</li>
          </ul>
          <p className="mt-2 text-xs">Preview visual en vivo a la derecha — verás cómo queda antes de guardar.</p>
        </SubDetail>

        <SubDetail title="Descargar el DXF de un pedido">
          <p>Dentro del pedido (<code className="tag">/admin/pedidos/[id]</code>) hay un bloque <strong>«Archivos láser para EZCAD»</strong>:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Muestra los textos únicos del pedido (deduplicados). Si el pedido pide 10 «DIABETES TIPO 1» + 5 «ALERGIA», verás 2 grabados distintos.</li>
            <li>Por cada uno: preview visual de cómo quedará sobre la placa + botón «⬇ Descargar DXF».</li>
            <li>Nombre del archivo automático: <code className="tag">2026-08-03_Pedido-00042_FarmaciaLopez_L1_DIABETES.dxf</code></li>
          </ul>
        </SubDetail>

        <SubDetail title="Cómo grabar la pulsera (paso a paso)">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>Descargas el DXF desde el pedido.</li>
            <li>Doble click al archivo → se abre EZCAD.</li>
            <li>Colocas la placa en la máquina.</li>
            <li>Pulsas <strong>F2</strong> → el láser dispara.</li>
            <li>Si son varias unidades del mismo texto: quitas la placa grabada, pones otra, F2 otra vez, repites.</li>
            <li>Cuando termines todas las unidades del pedido, marca en el admin el pedido como <strong>EN PREPARACIÓN</strong>.</li>
          </ol>
          <Tip>
            El DXF ya tiene el texto CONVERTIDO A TRAZADO VECTORIAL — no depende de las fuentes que
            tenga EZCAD instaladas. Sale exactamente como el preview de la web.
          </Tip>
        </SubDetail>

        <SubDetail title="Ver histórico de DXF descargados">
          <p>En <A href="/admin/laser/archivo">/admin/laser/archivo</A>:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Ordenado por carpetas de fecha (📁 2026-08-03, 📁 2026-08-04…).</li>
            <li>Cada carpeta desplegable con lista de archivos, hora, pedido, farmacia, texto grabado, color y unidades.</li>
            <li>Buscador por texto grabado, farmacia o nombre de archivo.</li>
            <li>Botón «ZIP del día» para descargar todos los DXF de una jornada de una vez.</li>
          </ul>
        </SubDetail>
      </Section>

      {/* ENVÍOS */}
      <Section id="envios" icon={Truck} title="Envíos y tracking · Correos">
        <SubDetail title="Marcar un pedido como enviado">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>Preparas el paquete y llevas a Correos (o llamas para recogida).</li>
            <li>Imprimes la etiqueta desde el <strong>portal de Correos Empresas</strong> → te da un nº de seguimiento (ej. AB123456789ES).</li>
            <li>En el admin, abres el pedido, bajas al bloque «Tracking del envío».</li>
            <li>Elige <strong>Correos · Paq Estándar</strong> (48-72h) o <strong>Correos · Paq Premium</strong> (24-48h) según el servicio contratado.</li>
            <li>Pega el número de seguimiento.</li>
            <li>Marca «Notificar al cliente» y pulsa «Guardar».</li>
          </ol>
          <p className="mt-2 text-sm">
            El pedido pasa automáticamente a <strong>ENVIADO</strong> y al cliente le llega email
            con el botón «Seguir mi envío» → abre el localizador de Correos.
          </p>
        </SubDetail>

        <SubDetail title="Ver el estado del envío">
          <p>Dentro del pedido puedes pulsar «Ver tracking» → abre el localizador oficial de Correos con el nº de tu envío.</p>
        </SubDetail>
      </Section>

      {/* CLIENTES */}
      <Section id="clientes" icon={Users} title="Farmacias clientes">
        <SubDetail title="Ver / buscar clientes">
          <p><A href="/admin/clientes">/admin/clientes</A> — lista completa con búsqueda por CIF, email, nombre o ciudad.</p>
        </SubDetail>

        <SubDetail title="Añadir un cliente manualmente">
          <p>Botón «+ Añadir cliente» arriba a la derecha. Rellena los datos y guarda.</p>
        </SubDetail>

        <SubDetail title="Editar / desactivar un cliente">
          <p>Pulsa sobre el nombre para abrir su ficha. Puedes editar cualquier dato o desactivarlo (deja de poder hacer pedidos).</p>
        </SubDetail>

        <SubDetail title="Borrar varios clientes a la vez">
          <p>Selecciona los checkboxes de las filas → aparece una barra flotante con acciones «Desactivar» o «Eliminar».</p>
          <p className="mt-1 text-xs text-ink-600">Los clientes con pedidos NO se pueden borrar (solo desactivar) — para no perder historial.</p>
        </SubDetail>

        <SubDetail title="Importar farmacias en masa desde Excel">
          <p><A href="/admin/importar">/admin/importar</A>:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
            <li>Sube el Excel con las columnas: CIF, Email, Farmacia, Contacto, Teléfono, Dirección, Ciudad, CP, Provincia, IBAN…</li>
            <li>Se muestra un preview con lo que va a importar.</li>
            <li>Confirmas → importa en masa (los CIFs que ya existan se actualizan, no se duplican).</li>
          </ol>
        </SubDetail>
      </Section>

      {/* SOLICITUDES */}
      <Section id="solicitudes" icon={Building2} title="Solicitudes de alta">
        <p className="text-sm mb-2">
          Cuando una farmacia rellena el formulario público de <A href="/solicitud">solicitar alta</A>,
          aparece aquí para revisión.
        </p>
        <SubDetail title="Aprobar una solicitud">
          <p>En <A href="/admin/solicitudes">/admin/solicitudes</A>, pulsa «✓ Aprobar». Se hace todo automático:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li>Se crea el cliente en <A href="/admin/clientes">/admin/clientes</A>.</li>
            <li>Se envía email a la farmacia con las instrucciones para acceder.</li>
          </ul>
        </SubDetail>
        <SubDetail title="Rechazar una solicitud">
          <p>Pulsa «✕ Rechazar» → aparece un cuadro para escribir el motivo (opcional). Al confirmar, se envía email a la farmacia con el motivo.</p>
        </SubDetail>
      </Section>

      {/* CARTEL */}
      <Section id="cartel" icon={Megaphone} title="Cartel promocional y QR">
        <SubDetail title="Descargar el cartel">
          <p>En <A href="/admin/cartel">/admin/cartel</A> tienes 3 formatos:</p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-1">
            <li><strong>PDF</strong>: para imprimir en A4 y colgar en la farmacia.</li>
            <li><strong>PNG (WhatsApp)</strong>: para enviar por WhatsApp — se previsualiza como imagen en el chat (no como archivo adjunto).</li>
            <li><strong>QR solo</strong>: código QR + URL para enviar suelto sin todo el cartel.</li>
          </ul>
          <p className="mt-2 text-sm">Los 3 apuntan a la home <code className="tag">pulseraspersonalizadas.lomhifar.net</code>.</p>
        </SubDetail>
        <SubDetail title="Subir un cartel personalizado">
          <p>En la misma página, columna derecha: formulario para subir tu propio PDF/PNG/JPG. Sustituye al por defecto.</p>
        </SubDetail>
        <SubDetail title="Restaurar el cartel por defecto">
          <p>Botón rojo «🗑 Restaurar el cartel por defecto» — borra el personalizado y vuelve al del sistema.</p>
        </SubDetail>
      </Section>

      {/* STOCK */}
      <Section id="stock" icon={Package} title="Stock de pulseras">
        <p className="text-sm mb-2">
          El sistema descuenta stock automáticamente cada vez que se hace un pedido.
        </p>
        <SubDetail title="Ver stock actual">
          <p><A href="/admin/stock">/admin/stock</A>: muestra unidades disponibles por color (negro, rojo) y las alertas activas.</p>
        </SubDetail>
        <SubDetail title="Añadir stock (nueva compra)">
          <ol className="list-decimal list-inside space-y-1 text-sm mt-1">
            <li>En <A href="/admin/stock">/admin/stock</A>, para el color que corresponda.</li>
            <li>Cantidad (positiva) + motivo «COMPRA» + nota opcional.</li>
            <li>«Registrar movimiento».</li>
          </ol>
        </SubDetail>
        <SubDetail title="Ajustar stock por merma o devolución">
          <p>Mismo formulario, cantidad negativa (para bajar) o positiva (para subir) + motivo «AJUSTE» / «DEVOLUCIÓN» / «MERMA».</p>
        </SubDetail>
        <SubDetail title="Cambiar nivel de alerta">
          <p>Cada color tiene un «Nivel mínimo de alerta». Cuando el stock baja de ese número, aparece un aviso en el dashboard y te llega email.</p>
        </SubDetail>
      </Section>

      {/* TEXTOS E IMÁGENES */}
      <Section id="textos" icon={Type} title="Textos e imágenes editables del sitio">
        <SubDetail title="Editar textos de la web pública">
          <p><A href="/admin/textos">/admin/textos</A>: cambia titulares del hero, botones, textos del acceso, del configurador, etc. Los cambios se aplican inmediatamente.</p>
        </SubDetail>
        <SubDetail title="Cambiar imágenes del sitio">
          <p><A href="/admin/imagenes">/admin/imagenes</A>: sube tu propio logo, foto del hero, ilustraciones de los perfiles de paciente, etc.</p>
        </SubDetail>
        <SubDetail title="Cambiar la foto de la pulsera del configurador">
          <p><A href="/admin/imagenes/pulseras">/admin/imagenes/pulseras</A>: sube la foto real de tu pulsera (negra y roja) y ajusta el área donde va el texto grabado. El cliente ve esta foto al configurar en la tienda.</p>
        </SubDetail>
        <SubDetail title="Editar perfiles de paciente (casos de uso)">
          <p><A href="/admin/personas">/admin/personas</A>: los 8 perfiles que aparecen en la landing como ejemplos.</p>
        </SubDetail>
      </Section>

      {/* USUARIOS */}
      <Section id="usuarios" icon={Users2} title="Usuarios admin y roles">
        <SubDetail title="Crear otro usuario admin">
          <p>Solo <strong>Super-Admin</strong> puede crear usuarios. Ve a <A href="/admin/usuarios">/admin/usuarios</A> → «Crear nuevo usuario» → email + contraseña inicial + rol.</p>
          <p className="mt-1 text-xs">Al primer login se le forzará cambiar la contraseña.</p>
        </SubDetail>
        <SubDetail title="Roles disponibles">
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Super-Admin</strong>: acceso total + gestión de otros usuarios admin.</li>
            <li><strong>Administrador</strong>: acceso total excepto crear/borrar usuarios y zona Sistema/Reset.</li>
            <li><strong>Gestor de pedidos</strong>: solo puede ver pedidos, cambiar estado y generar DXF.</li>
            <li><strong>Supervisor (solo lectura)</strong>: ve TODO el panel pero no puede modificar nada. Ideal para auditores o socios.</li>
          </ul>
        </SubDetail>
        <SubDetail title="Resetear contraseña de otro admin">
          <p>En la lista de usuarios, pulsa el icono 🔑 → escribe nueva contraseña. Se fuerza cambio en su próximo login.</p>
        </SubDetail>
        <SubDetail title="Cambiar tu propia contraseña">
          <p><A href="/admin/perfil">/admin/perfil</A>: cambio de contraseña (con confirmación) y editar tu nombre visible.</p>
        </SubDetail>
        <SubDetail title="Recuperar contraseña si la olvidaste">
          <p>En la pantalla de login, enlace «¿Olvidó su contraseña?» → mete tu email → te llega un enlace válido 1 hora.</p>
        </SubDetail>
      </Section>

      {/* CONFIGURACIÓN */}
      <Section id="config" icon={Settings} title="Configuración general">
        <p className="text-sm mb-2">
          Todo en <A href="/admin/configuracion">/admin/configuracion</A>. Los cambios se aplican al instante.
        </p>
        <SubDetail title="Cambiar precios de las pulseras">
          <p>Sección «Precios». Precio negra y roja en euros. Se refleja al momento en la tienda y en los pedidos nuevos (los antiguos mantienen el precio con que se hicieron).</p>
        </SubDetail>
        <SubDetail title="IVA y recargo de equivalencia">
          <p>Sección «Impuestos». IVA por defecto 21%. Recargo de equivalencia 5,2% activo por defecto (típico en farmacia).</p>
        </SubDetail>
        <SubDetail title="Descuentos por volumen">
          <p>Sección «Descuentos por volumen». Añade tramos (ej. desde 25 uds → 10%, desde 50 uds → 15%). Se aplican automáticamente en el carrito.</p>
        </SubDetail>
        <SubDetail title="Portes / envío">
          <p>Sección «Envío». Puedes tener portes «incluidos» en el precio o «cobrados aparte». Además: umbral de envío gratis y coste base.</p>
        </SubDetail>
        <SubDetail title="Emails destinatarios de pedidos">
          <p>Los emails a los que se copian los pedidos nuevos y las solicitudes de alta (para que no se te pase ninguno).</p>
        </SubDetail>
        <SubDetail title="Plazo de entrega">
          <p>Días laborables que se muestran en la web y en los emails al cliente («entrega en 7 días laborables»).</p>
        </SubDetail>
      </Section>

      {/* FAQ */}
      <Section id="faq" icon={HelpCircle} title="Preguntas frecuentes">
        <SubDetail title="¿Puedo probar un pedido sin cobrarlo?">
          <p>Sí. Crea un pedido manual desde <A href="/admin/pedidos/nuevo">/admin/pedidos/nuevo</A> a tu propio CIF, con las cantidades que quieras. Puedes cancelarlo después.</p>
        </SubDetail>
        <SubDetail title="Un cliente dice que no ha recibido el email de confirmación">
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Pídele que revise SPAM.</li>
            <li>Verifica que su email en <A href="/admin/clientes">/admin/clientes</A> es correcto.</li>
            <li>Reenvía desde el propio pedido (botón «Notificar al cliente» al cambiar el estado a RECIBIDO).</li>
          </ul>
        </SubDetail>
        <SubDetail title="La farmacia se equivocó al escribir el texto — ¿puedo cambiarlo antes de grabar?">
          <p>Sí, mientras esté en estado RECIBIDO o EN PREPARACIÓN. Abre el pedido y edita las líneas del ítem. Cuidado: si ya descargaste el DXF antes de editar, tendrás que descargarlo otra vez con el texto corregido.</p>
        </SubDetail>
        <SubDetail title="El DXF sale con el texto descentrado o mal escalado">
          <p>Ve a <A href="/admin/laser">/admin/laser</A> y ajusta los márgenes o el interlineado. El preview en vivo te muestra el resultado antes de guardar.</p>
        </SubDetail>
        <SubDetail title="No aparece la opción «Nuevo pedido manual»">
          <p>Comprueba tu rol en <A href="/admin/perfil">/admin/perfil</A>. Solo Super-Admin, Administrador y Gestor de pedidos pueden crear pedidos. Supervisor (solo lectura) no puede.</p>
        </SubDetail>
        <SubDetail title="¿Cómo veo estadísticas de canales (teléfono, visita, web…)?">
          <p>De momento la info se guarda en cada pedido. En una siguiente versión se añadirá una vista específica con % por canal. Mientras tanto, filtra por estado y mira los badges «MANUAL» en la lista.</p>
        </SubDetail>
      </Section>

      {/* EMERGENCIAS */}
      <Section id="emergencias" icon={Shield} title="Emergencias">
        <SubDetail title="Se me ha borrado o corrompido un pedido">
          <p>Los pedidos NO se borran del histórico salvo que uses la zona <A href="/admin/sistema">/admin/sistema</A> (solo Super-Admin). Si no es tu caso, contacta con soporte.</p>
        </SubDetail>
        <SubDetail title="La web no responde">
          <p>Comprueba que Railway está desplegando. Espera 2-3 minutos y refresca. Si sigue caído, contacta con soporte.</p>
        </SubDetail>
        <SubDetail title="Necesito borrar TODOS los pedidos o solicitudes (reset)">
          <p>Solo Super-Admin. <A href="/admin/sistema">/admin/sistema</A> → botones de reset (piden escribir «BORRAR» para confirmar).</p>
          <p className="mt-1 text-xs text-danger"><strong>⚠️ Irreversible</strong>. Úsalo solo para limpiar datos de prueba antes del lanzamiento real.</p>
        </SubDetail>
        <SubDetail title="Contacto de soporte">
          <p>Si necesitas ayuda que este manual no cubre: <A href="mailto:f.ayllon66@gmail.com">f.ayllon66@gmail.com</A></p>
        </SubDetail>
      </Section>

      <div className="text-center text-[11px] text-ink-400 pt-4 border-t border-ink-100">
        Manual v1.0 · Lomhifar B2B · Última actualización: 3 agosto 2026
      </div>
    </div>
  );
}

// ============================================================
// Helpers de presentación
// ============================================================

function IndexLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 px-3 py-2 transition-colors"
    >
      <Icon className="h-4 w-4 text-brand-700 shrink-0" />
      <span className="text-ink-800">{label}</span>
    </a>
  );
}

function Section({
  id, icon: Icon, title, children,
}: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card overflow-hidden scroll-mt-6">
      <div className="px-5 py-3 border-b border-ink-100 bg-ink-50/40 flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-700" />
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </section>
  );
}

function SubDetail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-ink-100 group">
      <summary className="px-4 py-2.5 cursor-pointer text-sm font-medium text-ink-900 flex items-center justify-between hover:bg-ink-50/40">
        <span>{title}</span>
        <span className="text-ink-400 text-xs group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="px-4 pb-4 pt-2 text-sm text-ink-700 space-y-2">{children}</div>
    </details>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  if (isExternal) {
    return (
      <a href={href} className="text-brand-700 hover:underline font-medium">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="text-brand-700 hover:underline font-medium">
      {children}
    </Link>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
      💡 <strong>Truco:</strong> {children}
    </div>
  );
}
