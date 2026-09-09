import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const rows = [
  ['Arica y Parinacota', 'Arica', 'Colegio San Marcos', 96],
  ['Tarapacá', 'Iquique', 'Liceo Bicentenario Juan Pablo II', 134],
  ['Antofagasta', 'Antofagasta', 'Colegio Santa Emilia', 112],
  ['Antofagasta', 'Calama', 'Liceo América', 88],
  ['Coquimbo', 'La Serena', 'Colegio Gabriela Mistral', 142],
  ['Valparaíso', 'Valparaíso', 'Liceo Eduardo de la Barra', 118],
  ['Valparaíso', 'Quilpué', 'Colegio Los Pinos', 76],
  ['Metropolitana de Santiago', 'Santiago', 'Liceo República de Brasil', 165],
  ['Metropolitana de Santiago', 'Puente Alto', 'Colegio Monte Andino', 121],
  ["O'Higgins", 'Rancagua', 'Instituto O\'Higgins', 109],
  ['Maule', 'Talca', 'Liceo Abate Molina', 153],
  ['Ñuble', 'Chillán', 'Colegio Bicentenario Padre Hurtado', 94],
  ['Biobío', 'Concepción', 'Liceo Enrique Molina', 178],
  ['Biobío', 'Los Ángeles', 'Colegio San Rafael Arcángel', 102],
  ['La Araucanía', 'Temuco', 'Liceo Pablo Neruda', 146],
  ['Los Lagos', 'Puerto Montt', 'Colegio Pumahue', 127],
];

const outputPath = 'outputs/charlas-financieras/charlas-sinteticas.xlsx';
const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Charlas');

sheet.getRange('A1:D17').values = [
  ['Region', 'Lugar', 'ColegioLocacion', 'CantidaddeAlumnos'],
  ...rows,
];
sheet.getRange('A1:D1').format = {
  fill: '#0E7490',
  font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
};
sheet.getRange('A2:D17').format = {
  font: { name: 'Arial', size: 10, color: '#1E293B' },
  verticalAlignment: 'center',
};
sheet.getRange('D2:D17').format.numberFormat = '#,##0';
sheet.getRange('A1:D17').format.borders = { preset: 'outside', style: 'thin', color: '#CBD5E1' };
sheet.getRange('A1:D17').format.autofitColumns();
sheet.getRange('A1:D17').format.autofitRows();
sheet.getRange('A1').format.columnWidth = 28;
sheet.getRange('B1').format.columnWidth = 18;
sheet.getRange('C1').format.columnWidth = 38;
sheet.getRange('D1').format.columnWidth = 23;
sheet.getRange('A1:D1').format.rowHeight = 24;
sheet.showGridLines = false;
sheet.freezePanes.freezeRows(1);
const table = sheet.tables.add('A1:D17', true, 'CharlasTable');
table.style = 'TableStyleMedium2';

workbook.recalculate();
const inspection = await workbook.inspect({
  kind: 'table',
  range: 'Charlas!A1:D17',
  include: 'values,formulas',
  tableMaxRows: 20,
  tableMaxCols: 4,
});
console.log(inspection.ndjson);

const preview = await workbook.render({ sheetName: 'Charlas', range: 'A1:D17', scale: 1.5, format: 'png' });
await fs.mkdir('outputs/charlas-financieras', { recursive: true });
await fs.writeFile('outputs/charlas-financieras/charlas-sinteticas-preview.png', new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
