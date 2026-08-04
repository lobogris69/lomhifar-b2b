-- Pedidos de prueba: flag para simular el flujo sin efectos reales
-- (no descuenta stock, emails al admin). Borrables en bloque.
ALTER TABLE "Order" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_isTest_idx" ON "Order"("isTest");
