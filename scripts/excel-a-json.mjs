import fs from 'node:fs/promises';
import path from 'node:path';
import * as XlsxModule from 'xlsx';

const XLSX = XlsxModule.default ?? XlsxModule;

const workbookPath = path.resolve('data/charlas-sinteticas.xlsx');
const outputPath = path.resolve('public/data/charlas.json');
const requiredColumns = ['Año', 'Region', 'Lugar', 'ColegioLocacion', 'CantidaddeAlumnos'];

const workbook = XLSX.readFile(workbookPath, { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const missing = requiredColumns.filter((column) => !(column in (rows[0] ?? {})));
if (missing.length) {
  throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}`);
}

const charlas = rows.map((row, index) => {
  const year = Number(row.Año);
  const alumnos = Number(row.CantidaddeAlumnos);
  if (!Number.isInteger(year) || year < 2000 || !row.Region || !row.Lugar || !row.ColegioLocacion || !Number.isFinite(alumnos) || alumnos < 0) {
    throw new Error(`Fila ${index + 2}: completa Año, Región, Lugar, ColegioLocacion y CantidaddeAlumnos.`);
  }
  return {
    Año: year,
    Region: String(row.Region).trim(),
    Lugar: String(row.Lugar).trim(),
    ColegioLocacion: String(row.ColegioLocacion).trim(),
    CantidaddeAlumnos: Math.round(alumnos),
  };
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(charlas, null, 2)}\n`);
console.log(`Datos actualizados: ${charlas.length} charlas.`);
