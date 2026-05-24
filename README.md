# Lomhifar B2B

Aplicación web B2B privada para el canal farmacia de **Lomhifar**.
Plataforma para pedidos de pulseras de identificación sanitaria personalizadas (negras y rojas), con grabado a dos líneas, simulación visual en vivo y panel administrador completo.

> ⚠️ Acceso restringido: solo farmacias autorizadas. No se integra con SAGE.

---

## Stack

- **Next.js 14** (App Router, Server Actions)
- **TypeScript** + **Tailwind CSS**
- **Prisma** + **PostgreSQL**
- **iron-session** (sesiones admin) + tokens persistidos (sesiones cliente)
- **nodemailer** (SMTP genérico)
- **xlsx** (importación de clientes desde Excel)
- Despliegue: **Railway** con Nixpacks (sin Docker)

---

## Funcionalidades

### Para la farmacia (canal cliente)
- Acceso por **CIF + email**. Si coincide con un cliente activo, se envía un código de 6 dígitos al email.
- Si el CIF/email no existe, se muestra un **formulario de solicitud de alta**.
- **Configurador de pulseras** con:
  - Color (negra / roja)
  - Unidades
  - Texto grabado en **2 líneas** con contador
  - **Vista previa en vivo** sobre la imagen de la pulsera
  - **Confirmación explícita** antes de añadir al carrito
- Carrito con varias líneas, importes, portes y pedido mínimo.
- Confirmación final con segunda confirmación expresa.
- Envío de email a Lomhifar **y copia al cliente**.
- Histórico de pedidos con su estado.

### Para el administrador
- Login privado en `/admin/login`.
- Dashboard con KPIs (clientes, solicitudes pendientes, pedidos, facturación).
- **Importar Excel** con previsualización, validación y opción de desactivar ausentes.
- Gestión de clientes (alta/edición/activación/eliminación).
- **Solicitudes de alta** con aprobar/rechazar (notifica por email).
- Gestión de pedidos con cambio de **estado** y notificación al cliente.
- **Configuración**: precios por color, portes, umbral de portes gratis, pedido mínimo, plazo de entrega, emails receptores, caracteres por línea, datos de empresa.

---

## Desarrollo local

```bash
cd lomhifar
cp .env.example .env       # rellenar DATABASE_URL, SMTP y SESSION_SECRET
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

Abrir http://localhost:3000

- Acceso admin: `/admin/login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.
- Acceso farmacia: `/acceso` (necesita primero importar clientes o crear uno manualmente).

---

## Despliegue en Railway

### 1. Crear servicio + base de datos
1. Crear un **nuevo proyecto** en Railway.
2. Añadir un servicio **PostgreSQL** (botón `+ New → Database → PostgreSQL`).
3. Añadir un servicio desde el repositorio Git (`+ New → GitHub Repo`) apuntando a este proyecto.

### 2. Variables de entorno del servicio web

Railway inyectará automáticamente `DATABASE_URL` desde el servicio PostgreSQL si los enlazas (`Variables → Reference → DATABASE_URL`). El resto:

| Variable | Descripción |
|---|---|
| `SESSION_SECRET` | Cadena aleatoria de **mínimo 32 caracteres**. Genera con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL` | Email del admin inicial |
| `ADMIN_PASSWORD` | Contraseña inicial (cámbiala tras el primer acceso) |
| `SMTP_HOST` | Servidor SMTP (ej: `smtp.ionos.es`, `smtp.office365.com`, `smtp.gmail.com`) |
| `SMTP_PORT` | `587` para STARTTLS, `465` para SSL |
| `SMTP_SECURE` | `true` solo si usas 465 |
| `SMTP_USER` | Usuario del correo |
| `SMTP_PASSWORD` | Contraseña / app password |
| `SMTP_FROM_NAME` | Nombre que aparece como remitente |
| `SMTP_FROM_EMAIL` | Email que aparece como remitente |
| `ORDERS_RECIPIENT_EMAILS` | Emails que reciben los pedidos (separar con coma) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación (ej. `https://pedidos.lomhifar.com`) |

### 3. Build & start

Ya está configurado en `nixpacks.toml`:

- **install**: `npm ci`
- **build**: `prisma generate` → `prisma migrate deploy` → `next build` → `tsx prisma/seed.ts`
- **start**: `npm run start`

Railway sirve la aplicación en `${PORT}` automáticamente.

### 4. Dominio

En el servicio web, pestaña **Settings → Networking → Generate Domain** o asigna tu dominio (`pedidos.lomhifar.com`).

### 5. Healthcheck

El endpoint `/api/health` está configurado en `railway.json` para Railway.

---

## Importación de clientes (Excel)

El sistema reconoce automáticamente columnas con estos nombres (o sus variantes):

| Columna lógica | Aliases reconocidos |
|---|---|
| CIF/NIF | `cif`, `nif`, `cif/nif`, `documento` |
| Email | `email`, `correo`, `e-mail`, `mail` |
| Farmacia | `farmacia`, `nombre`, `razón social`, `nombre comercial` |
| Contacto | `contacto`, `persona contacto`, `titular` |
| Teléfono | `teléfono`, `telefono`, `tel`, `móvil` |
| Dirección | `dirección`, `direccion`, `calle`, `domicilio` |
| Localidad | `localidad`, `ciudad`, `población` |
| CP | `cp`, `código postal`, `codigo postal` |
| Provincia | `provincia` |
| Observaciones | `observaciones`, `notas`, `comentarios` |
| Activo | `activo`, `estado` (acepta `Sí/No`, `true/false`, `1/0`, `inactivo`) |

Ejemplo: `prisma/customers-example.csv`.

> Opción avanzada: marcar **«Desactivar clientes ausentes»** desactivará todos los clientes de origen Excel que no aparezcan en este archivo (sincronización total).

---

## Imágenes de pulseras

Coloca los PNG reales en:

- `public/bracelets/black.png`
- `public/bracelets/red.png`

Hasta que existan, el configurador renderiza una representación SVG estilizada del color correspondiente.

---

## Seguridad

- Sesiones admin con `iron-session` (cookie firmada AEAD, TTL 8h).
- Sesiones cliente con token aleatorio persistido en BD (TTL 7 días).
- Códigos de acceso de un solo uso, TTL 15 min.
- Validación con `zod` en todos los formularios.
- Cookies `httpOnly + secure + sameSite=lax`.
- `noindex`/`nofollow` global (la plataforma es privada).

---

## Estructura

```
src/
├── app/
│   ├── (public)/        → landing, acceso, solicitud
│   ├── tienda/          → configurador, carrito, pedidos (cliente)
│   ├── admin/
│   │   ├── login/       → login admin (público)
│   │   └── (protected)/ → dashboard, clientes, solicitudes, pedidos, configuración, importar
│   └── api/             → health, logouts
├── components/
│   ├── brand/           → Logo
│   ├── ui/              → Alert
│   ├── marketing/       → PublicHeader / PublicFooter
│   ├── shop/            → ShopHeader, BraceletPreview, OrderStatusBadge
│   └── admin/           → AdminSidebar
└── lib/
    ├── prisma.ts
    ├── auth.ts          → sesiones admin/cliente
    ├── email.ts         → nodemailer + plantilla HTML
    ├── settings.ts      → ajustes en BD
    ├── pricing.ts       → cálculo de carrito
    ├── cart.ts          → carrito (cookie)
    ├── excel.ts         → parser Excel
    ├── validations.ts   → zod schemas + CIF/NIF
    └── utils.ts
prisma/
├── schema.prisma
├── seed.ts
└── customers-example.csv
```

---

## Roadmap sugerido (post-MVP)

- Exportación de pedidos a Excel/PDF
- Filtrado avanzado y paginación de pedidos
- 2FA opcional para administrador
- Estadísticas por farmacia y por mes
- Multi-administrador con roles
