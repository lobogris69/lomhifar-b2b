-- Añade campos de origen del pedido (WEB vs ADMIN) y tabla LaserFile
-- para el archivo de DXFs generados desde el admin.

-- Order: origen manual + canal + auditoría de quién lo creó
ALTER TABLE "Order" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WEB';
ALTER TABLE "Order" ADD COLUMN "channel" TEXT;
ALTER TABLE "Order" ADD COLUMN "createdByAdmin" TEXT;

CREATE INDEX "Order_source_idx" ON "Order"("source");

-- Nueva tabla LaserFile: cada DXF descargado queda registrado aquí
-- con snapshot del contexto para trazabilidad total.
CREATE TABLE "LaserFile" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "orderId"      TEXT NOT NULL,
  "orderNumber"  INTEGER NOT NULL,
  "pharmacyName" TEXT NOT NULL,
  "cif"          TEXT,
  "filename"     TEXT NOT NULL,
  "data"         BYTEA NOT NULL,
  "size"         INTEGER NOT NULL,
  "line1"        TEXT NOT NULL,
  "line2"        TEXT,
  "line3"        TEXT,
  "linesJoined"  TEXT NOT NULL,
  "color"        TEXT NOT NULL,
  "totalUnits"   INTEGER NOT NULL,
  "dateFolder"   TEXT NOT NULL,
  "createdBy"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaserFile_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LaserFile_dateFolder_idx" ON "LaserFile"("dateFolder");
CREATE INDEX "LaserFile_orderId_idx" ON "LaserFile"("orderId");
CREATE INDEX "LaserFile_pharmacyName_idx" ON "LaserFile"("pharmacyName");
