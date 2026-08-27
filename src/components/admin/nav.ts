import {
  Archive,
  BarChart3,
  Building2,
  ClipboardList,
  FilePlus2,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  KeyRound,
  Images,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  Type,
  Users,
  Users2,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * El menú del panel, por bloques.
 *
 * Antes eran diecisiete botones seguidos y había que leerlos todos para
 * encontrar uno. Ahora van agrupados por el momento en que se usan: lo del
 * día a día con los pedidos, lo del taller, lo de la web de cara al cliente y
 * los ajustes, que casi nunca se tocan.
 *
 * El orden importa: lo de arriba es lo que se abre cada mañana.
 */

export type BadgeKey = 'pendingApplications' | 'lowStock';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Sólo activo cuando la ruta coincide exactamente. */
  exact?: boolean;
  badgeKey?: BadgeKey;
  /** Aclaración bajo el nombre, para lo que no se adivina por el título. */
  pista?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Accesos que van sueltos arriba del todo, sin bloque. */
export const NAV_ARRIBA: NavItem[] = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/negocio', label: 'Control de negocio', icon: BarChart3 },
];

export const NAV_GRUPOS: NavGroup[] = [
  {
    id: 'pedidos',
    label: 'Pedidos y clientes',
    icon: ClipboardList,
    items: [
      { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
      { href: '/admin/pedidos/nuevo', label: 'Pedido manual', icon: FilePlus2, pista: 'Teléfono, mostrador, talonarios' },
      { href: '/admin/solicitudes', label: 'Solicitudes', icon: Building2, badgeKey: 'pendingApplications', pista: 'Farmacias que piden alta' },
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/importar', label: 'Importar Excel', icon: FileSpreadsheet },
    ],
  },
  {
    id: 'taller',
    label: 'Taller',
    icon: Zap,
    items: [
      { href: '/admin/laser', label: 'Grabado láser', icon: Zap, pista: 'Perfiles de material y clave del puente' },
      { href: '/admin/laser/archivo', label: 'Archivo de grabados', icon: Archive },
      { href: '/admin/stock', label: 'Stock', icon: Package, badgeKey: 'lowStock' },
      { href: '/admin/llaveros', label: 'Llaveros', icon: KeyRound, pista: 'Prueba de grabado en metal' },
    ],
  },
  {
    id: 'web',
    label: 'La web',
    icon: Globe,
    items: [
      { href: '/admin/cartel', label: 'Cartel promocional', icon: Megaphone },
      { href: '/admin/imagenes', label: 'Imágenes del sitio', icon: Images },
      { href: '/admin/textos', label: 'Textos del sitio', icon: Type },
      { href: '/admin/personas', label: 'Personas / casos uso', icon: Users },
    ],
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    icon: Settings,
    items: [
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings, pista: 'Precios, portes, avisos' },
      { href: '/admin/usuarios', label: 'Usuarios admin', icon: Users2 },
      { href: '/admin/sistema', label: 'Sistema / Reset', icon: Wrench },
      { href: '/admin/ayuda', label: 'Ayuda', icon: HelpCircle },
    ],
  },
];

/**
 * Cuál de todos los enlaces corresponde a la página abierta.
 *
 * Se queda con el más largo que encaje: si no, estando en
 * `/admin/laser/archivo` se encenderían «Grabado láser» y «Archivo» a la vez,
 * y con dos botones iluminados no sabes dónde estás.
 */
export function enlaceActivo(pathname: string): string | null {
  const todos = [...NAV_ARRIBA, ...NAV_GRUPOS.flatMap((g) => g.items)];
  let mejor: NavItem | null = null;
  for (const n of todos) {
    const encaja = n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + '/');
    if (encaja && (!mejor || n.href.length > mejor.href.length)) mejor = n;
  }
  return mejor?.href ?? null;
}
