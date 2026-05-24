import { prisma } from './prisma';

/**
 * Catálogo de textos editables del sitio.
 * Se almacenan en la tabla Setting con la clave `text.<seccion>.<campo>`.
 * Si no hay valor custom guardado → se usa el `defaultValue`.
 */

export type TextType = 'short' | 'long' | 'select';

export interface TextSlot {
  key: string;                  // p.ej. "acceso.titulo"
  group:
    | 'general'
    | 'acceso'
    | 'codigo'
    | 'landing'
    | 'casos'
    | 'stats'
    | 'personas'
    | 'guia'
    | 'producto'
    | 'canal'
    | 'cta_final'
    | 'tienda'
    | 'carrito'
    | 'pedido_ok'
    | 'mispedidos'
    | 'solicitud'
    | 'solicitud_ok'
    | 'cartel_callout'
    | 'pvpr';
  groupLabel: string;
  label: string;                // Título del campo en el admin
  description?: string;         // Ayuda contextual
  defaultValue: string;
  type: TextType;
  maxLength?: number;
  options?: { value: string; label: string }[];
}

export const TEXT_SLOTS: TextSlot[] = [
  // ============ PÁGINA DE ACCESO (/acceso) ============
  {
    key: 'acceso.badge',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Etiqueta superior',
    description: 'Texto pequeño en mayúsculas arriba del título principal',
    defaultValue: 'Plataforma B2B · Canal farmacia',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.titulo_principal',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Título principal (primera línea)',
    description: 'Aparece en negro grande',
    defaultValue: 'Pulseras sanitarias',
    type: 'short',
    maxLength: 50,
  },
  {
    key: 'acceso.titulo_destacado',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Título destacado (segunda línea)',
    description: 'Aparece debajo con gradient magenta',
    defaultValue: 'personalizadas',
    type: 'short',
    maxLength: 50,
  },
  {
    key: 'acceso.descripcion',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Descripción bajo el título',
    description: 'Párrafo explicativo (1-2 líneas)',
    defaultValue:
      'Acceda al portal exclusivo de Lomhifar para pedir pulseras de identificación médica con grabado láser, listas para entregar a sus pacientes.',
    type: 'long',
    maxLength: 400,
  },
  {
    key: 'acceso.feature_1_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 1 — Título',
    defaultValue: 'Diseño en vivo',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_1_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 1 — Descripción',
    defaultValue: 'Vea el grabado al escribir',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.feature_2_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 2 — Título',
    defaultValue: 'Para cualquier paciente',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_2_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 2 — Descripción',
    defaultValue: 'Niños, adultos, mayores',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.feature_3_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 3 — Título',
    defaultValue: 'Acceso solo farmacias',
    type: 'short',
    maxLength: 30,
  },
  {
    key: 'acceso.feature_3_desc',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Ventaja 3 — Descripción',
    defaultValue: 'Verificación por CIF + email',
    type: 'short',
    maxLength: 60,
  },
  {
    key: 'acceso.form_titulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Cabecera del formulario',
    defaultValue: 'Acceso farmacias',
    type: 'short',
    maxLength: 40,
  },
  {
    key: 'acceso.form_subtitulo',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Texto bajo la cabecera del formulario',
    defaultValue: 'Identifíquese con su CIF y email',
    type: 'short',
    maxLength: 80,
  },

  // ============ PULSERA DEMO MOSTRADA EN /acceso ============
  {
    key: 'acceso.demo_color',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Color',
    defaultValue: 'BLACK',
    type: 'select',
    options: [
      { value: 'BLACK', label: 'Negra' },
      { value: 'RED', label: 'Roja' },
    ],
  },
  {
    key: 'acceso.demo_linea1',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Línea 1 grabada',
    defaultValue: 'DIABETES TIPO 1',
    type: 'short',
    maxLength: 14,
  },
  {
    key: 'acceso.demo_linea2',
    group: 'acceso',
    groupLabel: 'Página de acceso · Farmacias',
    label: 'Pulsera de ejemplo — Línea 2 grabada',
    defaultValue: 'TFNO 666 123 456',
    type: 'short',
    maxLength: 14,
  },

  // ============ LANDING PRINCIPAL (/) ============
  {
    key: 'landing.hero_badge',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Etiqueta superior del hero',
    defaultValue: 'Plataforma privada · Acceso solo farmacias',
    type: 'short', maxLength: 80,
  },
  {
    key: 'landing.hero_titulo_1',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Primera línea',
    defaultValue: 'Pulseras sanitarias',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_titulo_destacado',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Línea destacada (gradient)',
    defaultValue: 'personalizadas',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_titulo_2',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Título — Tercera línea',
    defaultValue: 'para su farmacia.',
    type: 'short', maxLength: 60,
  },
  {
    key: 'landing.hero_descripcion',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Descripción del hero',
    defaultValue:
      'Lomhifar pone a disposición del canal farmacia un sistema profesional para pedir pulseras de identificación médica con grabado láser, listas para entregar al paciente. Negras o rojas, dos líneas de grabado a láser sobre placa de aluminio de 4 × 1 cm.',
    type: 'long', maxLength: 500,
  },
  {
    key: 'landing.hero_cta_principal',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Botón principal',
    defaultValue: 'Acceder con CIF y email',
    type: 'short', maxLength: 40,
  },
  {
    key: 'landing.hero_cta_secundario',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'Botón secundario',
    defaultValue: 'Solicitar alta de farmacia',
    type: 'short', maxLength: 40,
  },
  {
    key: 'landing.hero_stat1_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 1 — Valor',
    defaultValue: '22 × 1',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat1_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 1 — Texto',
    defaultValue: 'cm pulsera',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.hero_stat2_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 2 — Valor',
    defaultValue: '4 × 1',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat2_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 2 — Texto',
    defaultValue: 'cm placa aluminio',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.hero_stat3_valor',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 3 — Valor',
    defaultValue: '7 días',
    type: 'short', maxLength: 20,
  },
  {
    key: 'landing.hero_stat3_label',
    group: 'landing',
    groupLabel: 'Landing principal · Hero',
    label: 'KPI 3 — Texto',
    defaultValue: 'plazo entrega',
    type: 'short', maxLength: 30,
  },
  {
    key: 'landing.cta_final_titulo',
    group: 'landing',
    groupLabel: 'Landing principal · CTA final',
    label: 'CTA final — Título',
    defaultValue: '¿Su farmacia trabaja ya con Lomhifar?',
    type: 'short', maxLength: 100,
  },
  {
    key: 'landing.cta_final_descripcion',
    group: 'landing',
    groupLabel: 'Landing principal · CTA final',
    label: 'CTA final — Descripción',
    defaultValue:
      'Acceda con su CIF y el email registrado. Si aún no es cliente, solicite el alta y nuestro equipo validará su farmacia en horas hábiles.',
    type: 'long', maxLength: 300,
  },

  // ============ SECCIÓN "EL PRODUCTO" ============
  {
    key: 'producto.titulo',
    group: 'producto',
    groupLabel: 'Sección "El producto" (landing)',
    label: 'Título',
    defaultValue: 'Pulsera de silicona médica con placa de aluminio grabada a láser',
    type: 'short', maxLength: 120,
  },
  {
    key: 'producto.descripcion',
    group: 'producto',
    groupLabel: 'Sección "El producto" (landing)',
    label: 'Descripción',
    defaultValue:
      'Silicona hipoalergénica de grado médico, cierre regulable, placa central de aluminio con grabado láser permanente en tono antracita.',
    type: 'long', maxLength: 400,
  },

  // ============ CONFIGURADOR (/tienda) ============
  {
    key: 'tienda.badge',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Etiqueta superior',
    defaultValue: 'Configurador de pulseras',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Título principal',
    defaultValue: 'Diseñe su pulsera y añádala al carrito',
    type: 'short', maxLength: 100,
  },
  {
    key: 'tienda.descripcion',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Descripción',
    defaultValue:
      'Vea el grabado en tiempo real sobre la pulsera y confirme expresamente antes de continuar.',
    type: 'long', maxLength: 300,
  },
  {
    key: 'tienda.paso1_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 1 — Título',
    defaultValue: '1. Color de la pulsera',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso2_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 2 — Título',
    defaultValue: '2. Unidades',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso3_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 3 — Título',
    defaultValue: '3. Texto grabado',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.paso4_titulo',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Paso 4 — Título',
    defaultValue: '4. Confirmación',
    type: 'short', maxLength: 60,
  },
  {
    key: 'tienda.confirmacion_texto',
    group: 'tienda',
    groupLabel: 'Configurador de pulseras',
    label: 'Texto del checkbox de confirmación',
    description: 'Importante: este texto el cliente DEBE marcarlo expresamente antes de añadir al carrito',
    defaultValue:
      'Confirmo que el color, las unidades y el texto grabado son correctos. Entiendo que las pulseras se fabricarán exactamente con estos datos.',
    type: 'long', maxLength: 400,
  },

  // ============ HEADER + FOOTER PÚBLICOS ============
  {
    key: 'header.cta_acceder',
    group: 'general',
    groupLabel: 'Cabecera y pie públicos',
    label: 'Cabecera — Botón "Acceder"',
    defaultValue: 'Acceder',
    type: 'short', maxLength: 30,
  },
  {
    key: 'header.cta_alta',
    group: 'general',
    groupLabel: 'Cabecera y pie públicos',
    label: 'Cabecera — Botón "Nueva farmacia"',
    defaultValue: 'Soy una farmacia nueva',
    type: 'short', maxLength: 40,
  },
  {
    key: 'footer.tagline',
    group: 'general',
    groupLabel: 'Cabecera y pie públicos',
    label: 'Pie — Tagline',
    defaultValue: 'Canal exclusivo farmacia',
    type: 'short', maxLength: 60,
  },
  {
    key: 'footer.extra',
    group: 'general',
    groupLabel: 'Cabecera y pie públicos',
    label: 'Pie — Texto adicional',
    defaultValue: 'Plataforma B2B para farmacias autorizadas. Uso restringido.',
    type: 'short', maxLength: 120,
  },

  // ============ /acceso/codigo (introducir código) ============
  {
    key: 'codigo.titulo',
    group: 'codigo',
    groupLabel: 'Introducir código de acceso',
    label: 'Título',
    defaultValue: 'Introduzca su código',
    type: 'short', maxLength: 80,
  },
  {
    key: 'codigo.descripcion',
    group: 'codigo',
    groupLabel: 'Introducir código de acceso',
    label: 'Texto bajo el título',
    description: 'Aparece antes del email enmascarado',
    defaultValue: 'Hemos enviado un código de 6 dígitos a',
    type: 'short', maxLength: 120,
  },

  // ============ /solicitud (alta nueva farmacia) ============
  {
    key: 'solicitud.titulo',
    group: 'solicitud',
    groupLabel: 'Solicitud de alta de farmacia',
    label: 'Título',
    defaultValue: 'Solicitud de alta de farmacia',
    type: 'short', maxLength: 80,
  },
  {
    key: 'solicitud.descripcion',
    group: 'solicitud',
    groupLabel: 'Solicitud de alta de farmacia',
    label: 'Descripción bajo el título',
    defaultValue:
      'Complete los datos. Tras la verificación de Lomhifar recibirá un correo confirmando el alta y podrá empezar a realizar pedidos.',
    type: 'long', maxLength: 300,
  },
  {
    key: 'solicitud.cta',
    group: 'solicitud',
    groupLabel: 'Solicitud de alta de farmacia',
    label: 'Botón de envío',
    defaultValue: 'Enviar solicitud',
    type: 'short', maxLength: 40,
  },

  // ============ /solicitud/enviada (confirmación) ============
  {
    key: 'solicitud_ok.titulo',
    group: 'solicitud_ok',
    groupLabel: 'Solicitud enviada (confirmación)',
    label: 'Título',
    defaultValue: 'Solicitud enviada correctamente',
    type: 'short', maxLength: 80,
  },
  {
    key: 'solicitud_ok.descripcion',
    group: 'solicitud_ok',
    groupLabel: 'Solicitud enviada (confirmación)',
    label: 'Descripción',
    defaultValue:
      'Le hemos enviado un correo de acuse de recibo. El equipo de Lomhifar revisará su solicitud y le contactará para activar el acceso.',
    type: 'long', maxLength: 300,
  },

  // ============ CARRITO /tienda/carrito ============
  {
    key: 'carrito.titulo',
    group: 'carrito',
    groupLabel: 'Carrito',
    label: 'Título',
    defaultValue: 'Carrito de pedido',
    type: 'short', maxLength: 60,
  },
  {
    key: 'carrito.descripcion',
    group: 'carrito',
    groupLabel: 'Carrito',
    label: 'Descripción bajo el título',
    defaultValue:
      'Revise cada línea. El pedido se enviará a Lomhifar con copia a su email.',
    type: 'long', maxLength: 200,
  },
  {
    key: 'carrito.cta',
    group: 'carrito',
    groupLabel: 'Carrito',
    label: 'Botón "Confirmar pedido"',
    defaultValue: 'Confirmar y enviar pedido',
    type: 'short', maxLength: 60,
  },
  {
    key: 'carrito.checkbox',
    group: 'carrito',
    groupLabel: 'Carrito',
    label: 'Texto del checkbox de confirmación final',
    description: 'Legal: el cliente debe marcarlo para enviar el pedido a producción',
    defaultValue:
      'Confirmo que las pulseras, colores, unidades y textos grabados son correctos. Lomhifar fabricará el pedido exactamente con estos datos.',
    type: 'long', maxLength: 400,
  },

  // ============ /tienda/pedidos/[id]?nuevo=1 (pedido enviado) ============
  {
    key: 'pedido_ok.titulo',
    group: 'pedido_ok',
    groupLabel: 'Pedido enviado (confirmación)',
    label: 'Título del banner verde',
    defaultValue: '¡Pedido enviado correctamente!',
    type: 'short', maxLength: 60,
  },
  {
    key: 'pedido_ok.descripcion',
    group: 'pedido_ok',
    groupLabel: 'Pedido enviado (confirmación)',
    label: 'Descripción',
    defaultValue:
      'Hemos enviado el pedido a Lomhifar y le hemos remitido una copia por email.',
    type: 'long', maxLength: 200,
  },

  // ============ /tienda/pedidos (mis pedidos) ============
  {
    key: 'mispedidos.titulo',
    group: 'mispedidos',
    groupLabel: 'Mis pedidos (área cliente)',
    label: 'Título',
    defaultValue: 'Mis pedidos',
    type: 'short', maxLength: 40,
  },
  {
    key: 'mispedidos.descripcion',
    group: 'mispedidos',
    groupLabel: 'Mis pedidos (área cliente)',
    label: 'Descripción',
    defaultValue: 'Histórico de pedidos enviados a Lomhifar.',
    type: 'short', maxLength: 120,
  },

  // ============ CARTEL CALLOUT (banner descarga cartel) ============
  {
    key: 'cartel_callout.badge',
    group: 'cartel_callout',
    groupLabel: 'Banner de descarga de cartel',
    label: 'Etiqueta superior',
    defaultValue: 'Para su farmacia',
    type: 'short', maxLength: 40,
  },
  {
    key: 'cartel_callout.titulo',
    group: 'cartel_callout',
    groupLabel: 'Banner de descarga de cartel',
    label: 'Título',
    defaultValue: 'Descargue el cartel para imprimir en su mostrador',
    type: 'short', maxLength: 100,
  },
  {
    key: 'cartel_callout.descripcion',
    group: 'cartel_callout',
    groupLabel: 'Banner de descarga de cartel',
    label: 'Descripción',
    defaultValue:
      'Comunique a sus clientes que ya ofrece pulseras de identificación sanitaria personalizadas Lomhifar. Cartel listo para imprimir en A4.',
    type: 'long', maxLength: 300,
  },
  {
    key: 'cartel_callout.cta',
    group: 'cartel_callout',
    groupLabel: 'Banner de descarga de cartel',
    label: 'Botón principal',
    defaultValue: 'Descargar cartel (PDF A4)',
    type: 'short', maxLength: 40,
  },

  // ============ SECCIÓN "CASOS REALES" (landing) ============
  {
    key: 'casos.badge',
    group: 'casos',
    groupLabel: 'Sección "Casos reales" (landing)',
    label: 'Etiqueta superior',
    defaultValue: 'Casos reales',
    type: 'short', maxLength: 40,
  },
  {
    key: 'casos.titulo',
    group: 'casos',
    groupLabel: 'Sección "Casos reales" (landing)',
    label: 'Título',
    defaultValue: 'Así llevan la pulsera sus pacientes',
    type: 'short', maxLength: 80,
  },
  {
    key: 'casos.descripcion',
    group: 'casos',
    groupLabel: 'Sección "Casos reales" (landing)',
    label: 'Descripción',
    defaultValue:
      'Niños, adultos, embarazadas, mayores. Discreta, elegante y siempre visible para los servicios de emergencia. Estas son las situaciones donde marca la diferencia.',
    type: 'long', maxLength: 400,
  },
  {
    key: 'casos.disclaimer',
    group: 'casos',
    groupLabel: 'Sección "Casos reales" (landing)',
    label: 'Disclaimer al pie',
    defaultValue:
      'Las situaciones están inspiradas en patrones reales de prescripción y atención farmacéutica en España. Personajes ilustrativos. Para sustituir cualquier ilustración por una foto real, súbela desde el panel admin → Imágenes del sitio.',
    type: 'long', maxLength: 400,
  },

  // ============ SECCIÓN "MERCADO POTENCIAL" (landing) ============
  {
    key: 'stats.badge',
    group: 'stats',
    groupLabel: 'Sección "Mercado potencial" (landing)',
    label: 'Etiqueta superior',
    defaultValue: 'Mercado potencial',
    type: 'short', maxLength: 40,
  },
  {
    key: 'stats.titulo_1',
    group: 'stats',
    groupLabel: 'Sección "Mercado potencial" (landing)',
    label: 'Título — Primera línea',
    defaultValue: 'Hay millones de candidatos',
    type: 'short', maxLength: 80,
  },
  {
    key: 'stats.titulo_2',
    group: 'stats',
    groupLabel: 'Sección "Mercado potencial" (landing)',
    label: 'Título — Segunda línea (gradient)',
    defaultValue: 'a la pulsera Lomhifar',
    type: 'short', maxLength: 80,
  },
  {
    key: 'stats.descripcion',
    group: 'stats',
    groupLabel: 'Sección "Mercado potencial" (landing)',
    label: 'Descripción',
    defaultValue:
      'Solo en España. Cada uno de estos pacientes que entra en su farmacia es una recomendación natural.',
    type: 'long', maxLength: 300,
  },
  {
    key: 'stats.fuentes',
    group: 'stats',
    groupLabel: 'Sección "Mercado potencial" (landing)',
    label: 'Texto de fuentes',
    defaultValue:
      'Fuentes: Federación Española de Diabetes, SEN, Confederación Española de Alzheimer · Datos de referencia 2024',
    type: 'long', maxLength: 300,
  },

  // ============ SECCIÓN "PARA TODOS LOS PACIENTES" (landing) ============
  {
    key: 'personas.badge',
    group: 'personas',
    groupLabel: 'Sección "Para todos los pacientes" (landing)',
    label: 'Etiqueta superior',
    defaultValue: 'Para todos los pacientes',
    type: 'short', maxLength: 40,
  },
  {
    key: 'personas.titulo',
    group: 'personas',
    groupLabel: 'Sección "Para todos los pacientes" (landing)',
    label: 'Título',
    defaultValue: 'Hay un paciente para cada pulsera en su farmacia',
    type: 'short', maxLength: 100,
  },
  {
    key: 'personas.descripcion',
    group: 'personas',
    groupLabel: 'Sección "Para todos los pacientes" (landing)',
    label: 'Descripción',
    defaultValue:
      'No es solo para mayores. Niños, adolescentes, embarazadas, deportistas, personas con patologías crónicas o raras. Abrámosles los ojos.',
    type: 'long', maxLength: 400,
  },

  // ============ SECCIÓN "GUÍA FARMACÉUTICO" (landing) ============
  {
    key: 'guia.badge',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Etiqueta superior',
    defaultValue: 'Para el farmacéutico',
    type: 'short', maxLength: 40,
  },
  {
    key: 'guia.titulo',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Título',
    defaultValue: '¿Cuándo recomendarla? Una guía rápida',
    type: 'short', maxLength: 80,
  },
  {
    key: 'guia.descripcion',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Descripción',
    defaultValue:
      'En su día a día atendiendo el mostrador, estas son las señales para sugerir naturalmente la pulsera a su cliente. Aproveche cada conversación.',
    type: 'long', maxLength: 400,
  },
  {
    key: 'guia.frase_titulo',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Bloque destacado — Título',
    defaultValue: 'La frase mágica del mostrador',
    type: 'short', maxLength: 80,
  },
  {
    key: 'guia.frase_mensaje',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Bloque destacado — Mensaje principal',
    defaultValue:
      '«Por cierto, ¿sabe que tenemos pulseras de identificación sanitaria personalizadas? Si tiene un accidente o un mareo, los sanitarios sabrán al momento que es diabético / alérgico a la penicilina / anticoagulado. Cuesta poco y se la grabamos con sus datos.»',
    type: 'long', maxLength: 500,
  },
  {
    key: 'guia.frase_consejo',
    group: 'guia',
    groupLabel: 'Sección "Guía farmacéutico" (landing)',
    label: 'Bloque destacado — Consejo al pie',
    defaultValue:
      'Sugerirla cuando dispensa la medicación habitual es el momento perfecto.',
    type: 'long', maxLength: 200,
  },

  // ============ PVPR (Precio venta recomendado al paciente) ============
  {
    key: 'pvpr.etiqueta',
    group: 'pvpr',
    groupLabel: 'PVP recomendado al paciente',
    label: 'Etiqueta corta (badge / chip)',
    description: 'Texto pequeño que aparece junto al precio recomendado',
    defaultValue: 'PVP recomendado',
    type: 'short', maxLength: 40,
  },
  {
    key: 'pvpr.titulo',
    group: 'pvpr',
    groupLabel: 'PVP recomendado al paciente',
    label: 'Título del bloque (landing / configurador)',
    defaultValue: 'Precio de venta recomendado al paciente',
    type: 'short', maxLength: 80,
  },
  {
    key: 'pvpr.descripcion',
    group: 'pvpr',
    groupLabel: 'PVP recomendado al paciente',
    label: 'Descripción / nota explicativa',
    defaultValue:
      'Precio sugerido por Lomhifar al que la farmacia revende cada pulsera a su cliente final. El importe es el mismo independientemente del color.',
    type: 'long', maxLength: 400,
  },
  {
    key: 'pvpr.margen_texto',
    group: 'pvpr',
    groupLabel: 'PVP recomendado al paciente',
    label: 'Texto de margen (configurador / carrito)',
    description: 'Aparece junto al cálculo del margen estimado por pulsera',
    defaultValue: 'Su margen estimado por pulsera',
    type: 'short', maxLength: 80,
  },

  // ============ SECCIÓN "CANAL PROFESIONAL" (landing) ============
  {
    key: 'canal.badge',
    group: 'canal',
    groupLabel: 'Sección "Canal profesional" (landing)',
    label: 'Etiqueta superior',
    defaultValue: 'Canal profesional',
    type: 'short', maxLength: 40,
  },
  {
    key: 'canal.titulo',
    group: 'canal',
    groupLabel: 'Sección "Canal profesional" (landing)',
    label: 'Título',
    defaultValue: 'Diseñado por y para la oficina de farmacia',
    type: 'short', maxLength: 100,
  },
];

// Prefijo de la clave en la tabla Setting (para no chocar con ajustes de negocio)
const KEY_PREFIX = 'text.';
const storageKey = (slot: string) => `${KEY_PREFIX}${slot}`;

/**
 * Obtiene UN texto. Devuelve el valor custom si existe, o el default.
 * Resiliente ante fallos de BD (build time).
 */
export async function getSiteText(slotKey: string): Promise<string> {
  const def = TEXT_SLOTS.find((s) => s.key === slotKey);
  if (!def) return '';
  try {
    const row = await prisma.setting.findUnique({ where: { key: storageKey(slotKey) } });
    return row?.value ?? def.defaultValue;
  } catch {
    return def.defaultValue;
  }
}

/**
 * Obtiene TODOS los textos como mapa. Devuelve defaults para los que no
 * estén guardados. Resiliente ante fallos.
 */
export async function getAllSiteTexts(): Promise<Record<string, string>> {
  const defaults = Object.fromEntries(TEXT_SLOTS.map((s) => [s.key, s.defaultValue]));
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
    });
    const result = { ...defaults };
    for (const row of rows) {
      const k = row.key.slice(KEY_PREFIX.length);
      if (k in result) result[k] = row.value;
    }
    return result;
  } catch {
    return defaults;
  }
}

/**
 * Devuelve los textos en formato lista para el panel admin
 * (incluye metadata del slot + valor actual + flag isCustom).
 */
export interface SiteTextWithMeta extends TextSlot {
  currentValue: string;
  isCustom: boolean;
}

export async function getAllSiteTextsWithMeta(): Promise<SiteTextWithMeta[]> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
      select: { key: true, value: true },
    });
  } catch {
    rows = [];
  }
  const customByKey = new Map(
    rows.map((r) => [r.key.slice(KEY_PREFIX.length), r.value] as const),
  );
  return TEXT_SLOTS.map((slot) => {
    const custom = customByKey.get(slot.key);
    return {
      ...slot,
      currentValue: custom ?? slot.defaultValue,
      isCustom: custom !== undefined,
    };
  });
}

/**
 * Guarda o restaura un texto.
 * - Si value es igual al default → borra el registro (vuelve a default).
 * - Si value es distinto → upsert.
 */
export async function setSiteText(slotKey: string, value: string): Promise<void> {
  const def = TEXT_SLOTS.find((s) => s.key === slotKey);
  if (!def) return;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === def.defaultValue) {
    await prisma.setting.deleteMany({ where: { key: storageKey(slotKey) } });
  } else {
    await prisma.setting.upsert({
      where: { key: storageKey(slotKey) },
      create: { key: storageKey(slotKey), value: trimmed },
      update: { value: trimmed },
    });
  }
}

export async function resetSiteText(slotKey: string): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: storageKey(slotKey) } });
}
