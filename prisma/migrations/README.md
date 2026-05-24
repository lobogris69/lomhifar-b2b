# Migraciones Prisma

Esta carpeta contiene el SQL versionado de cambios de schema.

## Estado actual

**El deploy de Railway usa `prisma db push --accept-data-loss`** (ver `package.json` → `start:prod`).
Esto es pragmático y seguro mientras la app es pequeña y todos los cambios de schema
son aditivos (añadir columnas/tablas, nunca renombrar/eliminar).

Las migrations están aquí por si quieres hacer la transición a un flujo migratorio
estricto (recomendado cuando la app esté madura).

---

## Cómo activar migrations en producción

### 1. Hacer "baseline" de la BD existente en Railway

La BD actual ya tiene todas las tablas creadas vía `db push`. Para que Prisma sepa
que la migration `20260524000000_init` ya está aplicada (sin volver a crearla),
ejecuta UNA SOLA VEZ desde la consola de Railway:

```bash
# Conecta a la BD desde Railway: servicio Postgres → Connect → "Run a query"
# o usa el shell de Railway con la variable DATABASE_URL inyectada:
npx prisma migrate resolve --applied 20260524000000_init
```

### 2. Cambiar el comando de arranque

En `package.json`, cambia el script `start:prod`:

```diff
-"start:prod": "prisma db push --accept-data-loss --skip-generate && tsx prisma/seed.ts && tsx prisma/seed-demo.ts && next start -p ${PORT:-3000}"
+"start:prod": "prisma migrate deploy && tsx prisma/seed.ts && next start -p ${PORT:-3000}"
```

(Quita también `seed-demo.ts` si ya no quieres las farmacias demo en cada deploy).

### 3. A partir de ahora

Para cualquier cambio de schema:

```bash
# En local, con DATABASE_URL apuntando a Postgres local o una BD de staging
npx prisma migrate dev --name "describe_cambio"
# Esto crea una nueva carpeta de migration y la aplica localmente.
git add prisma/migrations
git commit -m "db: <descripción>"
git push
# Railway ejecutará prisma migrate deploy automáticamente.
```

---

## Por qué no se ha activado ya

- La BD de Railway se creó con `db push` y no tiene metadata de migrations.
- Activar `migrate deploy` sin hacer baseline → fallaría porque las tablas ya existen.
- El baseline requiere ejecutar `prisma migrate resolve --applied` UNA VEZ contra la BD real, y eso lo tiene que hacer el operador desde Railway.
