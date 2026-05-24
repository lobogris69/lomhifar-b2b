/**
 * Prueba el parser de Excel contra un archivo real.
 * Uso: npx tsx scripts/test-excel-parser.ts <ruta-al-xlsx>
 */
import fs from 'node:fs';
import { parseCustomersExcel } from '../src/lib/excel';

const path = process.argv[2] ?? 'D:\\EXCELL\\2026\\LISTADOS CLIENTES LOMHIFAR 2026\\LISTADO CLIENTES LOMHIFAR COMPLETO 20 MAYO 2026.xlsx';
const buf = fs.readFileSync(path);
const result = parseCustomersExcel(buf);

console.log('=== Cabeceras detectadas ===');
for (const h of result.detectedHeaders) {
  const tag = h.mapped ? `→ ${h.mapped}` : '(no mapeada)';
  console.log(`  "${h.raw}" ${tag}`);
}

console.log('\n=== Errores de cabeceras ===');
console.log(result.headerErrors.length ? result.headerErrors : '(ninguno)');

console.log(`\n=== Filas: ${result.rows.length} ===`);
const ok = result.rows.filter((r) => r.errors.length === 0);
const ko = result.rows.filter((r) => r.errors.length > 0);
console.log(`Válidas: ${ok.length}, con errores: ${ko.length}`);
const inactive = ok.filter((r) => !r.active);
console.log(`Activas: ${ok.length - inactive.length}, inactivas (BAJA): ${inactive.length}`);

console.log('\n=== Primeras 3 filas válidas ===');
for (const r of ok.slice(0, 3)) {
  console.log({
    cif: r.cif,
    email: r.email,
    name: r.pharmacyName.slice(0, 40),
    city: r.city,
    active: r.active,
  });
}

console.log('\n=== Errores agrupados ===');
const errorTypes = new Map<string, number>();
for (const r of ko) {
  const k = r.errors.join(', ');
  errorTypes.set(k, (errorTypes.get(k) ?? 0) + 1);
}
for (const [err, count] of Array.from(errorTypes.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count}x: ${err}`);
}
