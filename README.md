# Charlas financieras en Chile

Mapa táctil de Chile que destaca las regiones donde se han realizado charlas y muestra su detalle al tocarlas.

## Actualizar las charlas

1. Edita `data/charlas-sinteticas.xlsx`.
2. Conserva estas cuatro columnas: `Region`, `Lugar`, `ColegioLocacion` y `CantidaddeAlumnos`.
3. Ejecuta `npm run build`. El sitio genera automáticamente `public/data/charlas.json` desde el Excel.
4. Sube los cambios a GitHub. Vercel volverá a publicar el sitio de forma automática.

Los nombres de región admiten formas habituales, por ejemplo `Biobío`, `Bío-Bío`, `Metropolitana de Santiago` u `O'Higgins`.

## Publicar en Vercel

1. Crea un repositorio vacío en GitHub y sube esta carpeta.
2. En Vercel, elige **Add New → Project** e importa el repositorio.
3. Vercel detectará la configuración incluida y ejecutará `npm run build`.
4. Presiona **Deploy**.

La aplicación es estática: no requiere base de datos ni credenciales para operar.
