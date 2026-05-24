# 🚀 Despliegue en Railway · Lomhifar B2B

Guía paso a paso para publicar la plataforma en producción.

---

## 📋 Pre-requisitos

- [ ] Cuenta de **GitHub** (gratuita) — https://github.com
- [ ] Cuenta de **Railway** (plan Hobby gratuito basta para empezar) — https://railway.app
- [ ] Credenciales **SMTP** funcionando (las que ya usas en otros proyectos)
- [ ] El proyecto ya está en local con commit inicial creado ✓

---

## Paso 1 · Subir el código a GitHub

### 1.1 · Crear el repositorio en GitHub
1. Entra en https://github.com/new
2. Configura:
   - **Repository name:** `lomhifar-b2b` (o el nombre que prefieras)
   - **Visibility:** `Private` ✅ (importante — el código contiene la lógica de tu negocio)
   - **NO** marques "Initialize this repository with a README/.gitignore/license" (ya los tenemos)
3. Click **Create repository**

### 1.2 · Conectar tu repo local con GitHub
GitHub te mostrará comandos. Usa la sección **"…or push an existing repository from the command line"**.

Desde tu carpeta `lomhifar/` ejecuta (sustituye `TUUSUARIO` por tu usuario GitHub):

```bash
cd "D:/CLAUDE CODE TRADINGVIEW MAYO 2026/lomhifar"
git remote add origin https://github.com/TUUSUARIO/lomhifar-b2b.git
git push -u origin main
```

GitHub te pedirá autenticación. Si nunca lo has hecho:
- En navegador: te abrirá una ventana para autenticar
- Con token: usa un Personal Access Token (https://github.com/settings/tokens)

Cuando termine, recarga la pestaña del repo en GitHub: deberías ver todos los archivos.

---

## Paso 2 · Crear el proyecto en Railway

### 2.1 · Iniciar el proyecto desde GitHub
1. Entra en https://railway.app/new
2. Click **Deploy from GitHub repo**
3. La primera vez Railway te pedirá autorizar GitHub. Acepta para tu cuenta.
4. Selecciona tu repo `lomhifar-b2b`
5. Click **Add variables** (NO hagas deploy todavía — primero necesitamos crear la base de datos)

> 💡 Si Railway inicia el deploy automáticamente, no pasa nada — fallará por falta de `DATABASE_URL`. Lo arreglamos en los siguientes pasos.

### 2.2 · Añadir base de datos PostgreSQL
1. En tu proyecto Railway, click **+ Create** (esquina superior)
2. Selecciona **Database → Add PostgreSQL**
3. Railway crea automáticamente un servicio Postgres con su propia `DATABASE_URL`.

### 2.3 · Enlazar PostgreSQL al servicio web
1. Click en el **servicio web** (el que viene de tu repo)
2. Pestaña **Variables**
3. Click **+ New Variable → Add Reference**
4. Selecciona `Postgres` → `DATABASE_URL`
   - Railway añade `DATABASE_URL` como referencia dinámica al servicio Postgres.

---

## Paso 3 · Configurar variables de entorno

En el **servicio web**, pestaña **Variables**, añade una por una (usa **+ New Variable** y luego **Raw editor** para pegar varias):

### 3.1 · Variables obligatorias

| Variable | Valor sugerido |
|---|---|
| `SESSION_SECRET` | Genera con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | tu email de admin (ej. `admin@lomhifar.com`) |
| `ADMIN_PASSWORD` | una contraseña fuerte (cambia tras primer login) |
| `NEXT_PUBLIC_APP_URL` | de momento `https://placeholder.up.railway.app` (lo actualizas en el Paso 5) |

### 3.2 · Variables SMTP (las que ya usas en otros proyectos)

| Variable | Ejemplo |
|---|---|
| `SMTP_HOST` | `smtp.ionos.es` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` (`true` solo si usas puerto 465) |
| `SMTP_USER` | `pedidos@lomhifar.com` |
| `SMTP_PASSWORD` | tu password SMTP |
| `SMTP_FROM_NAME` | `Lomhifar Farmacia` |
| `SMTP_FROM_EMAIL` | `pedidos@lomhifar.com` |
| `ORDERS_RECIPIENT_EMAILS` | `pedidos@lomhifar.com` (varios separados por coma) |

### 3.3 · Atajo: Raw editor
Click **Raw editor** y pega todas de golpe:

```env
SESSION_SECRET=PEGA_AQUI_LA_CADENA_ALEATORIA
ADMIN_EMAIL=admin@lomhifar.com
ADMIN_PASSWORD=CambiaEstaPassword!2026
NEXT_PUBLIC_APP_URL=https://placeholder.up.railway.app
SMTP_HOST=smtp.ionos.es
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedidos@lomhifar.com
SMTP_PASSWORD=tu-password
SMTP_FROM_NAME=Lomhifar Farmacia
SMTP_FROM_EMAIL=pedidos@lomhifar.com
ORDERS_RECIPIENT_EMAILS=pedidos@lomhifar.com
```

> ⚠️ NO añadas `PREVIEW_BYPASS_CODE` — esa variable es solo para preview local.

---

## Paso 4 · Lanzar el primer deploy

1. En el servicio web → pestaña **Deployments**
2. Click **Deploy** (o haz un nuevo commit/push para disparar deploy automático)
3. Verás los logs en tiempo real. El proceso ejecuta:
   - `npm ci`
   - `npx prisma generate`
   - `npx prisma db push --accept-data-loss` ← crea las tablas
   - `npm run build` ← compila Next.js
   - `npx tsx prisma/seed.ts` ← crea admin y ajustes por defecto
   - `npx tsx prisma/seed-demo.ts` ← crea 2 farmacias demo
4. Cuando veas **"Deployment successful"** y `▲ Next.js Ready in Xms`, ya está corriendo.

---

## Paso 5 · Generar dominio público

1. Servicio web → pestaña **Settings**
2. Sección **Networking** → click **Generate Domain**
3. Railway te asigna algo como `lomhifar-b2b-production.up.railway.app`
4. **Copia esa URL** y actualiza la variable `NEXT_PUBLIC_APP_URL` (Paso 3) con el valor real.
5. (Opcional) Si tienes un dominio propio como `pedidos.lomhifar.com`:
   - Click **+ Custom Domain**
   - Sigue las instrucciones para añadir el CNAME en tu DNS

---

## Paso 6 · Primer login y verificación

### 6.1 · Acceso administrador
- URL: `https://TU-DOMINIO.up.railway.app/admin/login`
- Email: el que pusiste en `ADMIN_EMAIL`
- Password: el que pusiste en `ADMIN_PASSWORD`

### 6.2 · Comprobar farmacias demo
- URL: `https://TU-DOMINIO.up.railway.app/acceso`
- Prueba con: `B12345678` / `demo@farmaciacentral.es`
- Deberías recibir un código de 6 dígitos por email
  - Si no llega, revisa logs (variables SMTP, carpeta spam)

### 6.3 · Comprobar healthcheck
- URL: `https://TU-DOMINIO.up.railway.app/api/health`
- Debe devolver `{"status":"ok","ts":...}`

### 6.4 · Comprobar gestor de imágenes
- URL: `https://TU-DOMINIO.up.railway.app/admin/imagenes`
- Debes ver los 9 slots con sus previews

---

## Paso 7 · Configuración post-despliegue

Una vez dentro del admin:

1. **`/admin/configuracion`** — revisa precios, portes, plazo de entrega, emails receptores
2. **`/admin/cartel`** — sube tu cartel promocional definitivo (o usa el por defecto)
3. **`/admin/imagenes`** — sube tu logo real si quieres reemplazar el SVG inline, fotos de producto, fotos de casos reales
4. **`/admin/clientes`** — borra las 2 farmacias demo (Farmacia Central, Farmacia La Plaza) si no las necesitas
5. **`/admin/importar`** — importa tu base real de clientes desde Excel

---

## 🔄 Actualizaciones futuras

Cada vez que hagas `git push origin main`, Railway detecta el cambio y redespliega automáticamente. El build:
- Aplica cambios de schema con `prisma db push` (sin perder datos si solo añades columnas)
- Re-ejecuta el seed (usa upsert, no duplica)

> ⚠️ Para cambios destructivos en el schema (renombrar/borrar columnas), considera generar migraciones con `prisma migrate dev` localmente y commitearlas, en lugar de `db push --accept-data-loss`.

---

## 🆘 Troubleshooting

| Problema | Solución |
|---|---|
| **Build falla con "DATABASE_URL not found"** | El servicio Postgres no está enlazado. Vuelve al Paso 2.3 |
| **App carga pero las imágenes no se ven** | `NEXT_PUBLIC_APP_URL` está mal o sin actualizar. Paso 5 |
| **Login admin: "Credenciales incorrectas"** | Verifica `ADMIN_EMAIL` y `ADMIN_PASSWORD` en variables. El seed solo crea el admin la primera vez |
| **Los códigos por email no llegan** | Revisa logs SMTP. Variables SMTP correctas. Carpeta de spam del destinatario |
| **Error 500 en alguna ruta** | Logs del servicio web en Railway → busca el stack trace |
| **El cartel/imagen subido no aparece** | Cache del navegador. Forza recarga (Ctrl+Shift+R) |

---

## 💰 Coste estimado en Railway

- **Plan Hobby (gratuito):** $5 de crédito mensual — suficiente para empezar
- **App + PostgreSQL:** ~$3-5/mes para tráfico bajo-medio
- Si necesitas más, **Plan Pro:** $20/mes con uso ilimitado de recursos básicos
