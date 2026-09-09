# Handoff de diseño — BancoEstado 2023 → chalasfinancieras

Este documento traduce el sistema de diseño de BancoEstado (el mismo usado en el dashboard
Estudio Seguro) al stack de **chalasfinancieras**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui,
con tokens en `src/styles.css` (bloque `@theme inline` + variables `:root`).

No es una guía de estilo genérica: son los valores exactos a usar, para no reinterpretarlos.

---

## 1. Alcance

- Cambiar **solo** el sistema visual: colores, tipografía, radios, sombras, espaciado.
- **No tocar** la lógica del mapa (`react-simple-maps`), la carga de datos
  (`scripts/excel-a-json.mjs`, `data/charlas-sinteticas.xlsx`), el audio, ni la estructura de
  componentes/rutas existente.
- Si algo requiere una decisión de producto (agregar una sección, cambiar copy, agregar un logo),
  no inventarlo — preguntar antes.

## 2. Archivo principal a editar: `src/styles.css`

Reemplazar el bloque `:root` actual por estos valores (formato hex directo — no es necesario
mantener `oklch`, Tailwind v4 acepta cualquier función de color válida en las variables):

```css
:root {
  /* Superficies y texto */
  --background: #f7f9fa;         /* gris 50 */
  --foreground: #4c5761;         /* gris 600 — cuerpo */
  --card: #ffffff;
  --card-foreground: #343e46;    /* gris 700 — títulos */
  --popover: #ffffff;
  --popover-foreground: #343e46;

  /* Marca */
  --primary: #ff7900;            /* naranjo — color de acción */
  --primary-foreground: #ffffff;
  --secondary: #eef1f3;          /* gris 100 */
  --secondary-foreground: #343e46;
  --muted: #f7f9fa;              /* gris 50 */
  --muted-foreground: #6b7681;   /* gris 500 */
  --accent: #fff1e0;             /* naranjo 100 */
  --accent-foreground: #b85600;  /* naranjo 700 */

  /* Estado */
  --destructive: #ff2318;        /* rojo — SOLO acciones destructivas/isotipo */
  --destructive-foreground: #ffffff;
  --border: #e1e5e9;             /* gris 200 */
  --input: #c4cad0;              /* gris 300 */
  --ring: #004dff;               /* azul — foco */

  /* Series de gráficos (recharts), en este orden */
  --chart-1: #ff7900;  /* naranjo */
  --chart-2: #28b4bc;  /* turquesa */
  --chart-3: #ffb600;  /* amarillo flor */
  --chart-4: #358dc9;  /* cielo */
  --chart-5: #d3bc9c;  /* duna */

  --radius: 1rem; /* 16px — con el @theme inline existente da sm≈8px, md≈13px, lg=16px */

  /* Sidebar (si el componente shadcn se usa en algún lado) */
  --sidebar: #f7f9fa;
  --sidebar-foreground: #343e46;
  --sidebar-primary: #ff7900;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #fff1e0;
  --sidebar-accent-foreground: #b85600;
  --sidebar-border: #e1e5e9;
  --sidebar-ring: #004dff;

  background: #f7f9fa;
}
```

No hay modo oscuro definido en el diseño original (BancoEstado no lo especifica) — si el archivo
tiene un bloque `.dark { ... }`, dejarlo igual a `:root` (mismos valores) en vez de inventar una
paleta oscura.

### Tipografía

Agregar Google Fonts al `<head>` (en `index.html`) o vía `@import` en `styles.css`:

```
Figtree:wght@400;600;900   → sans, texto general
Petrona:wght@400;600       → serif, para un titular/hero si lo hay
IBM Plex Mono:wght@400;600 → mono, solo para cifras/códigos si los hay
```

Reemplazar en `@theme inline`:
```css
--font-sans: "Figtree", "Helvetica Neue", Arial, sans-serif;
```
y quitar la referencia a `--font-geist-sans` (no está cargada, es un resto del boilerplate).

En `body` (bloque `@layer base`), cambiar `font-family: Arial, Helvetica, sans-serif;` por
`font-family: var(--font-sans);`.

### Reglas no negociables (iguales a Estudio Seguro)

1. **Sin degradados.** Si `styles.css` o algún componente usa `linear-gradient`, reemplazar por
   color sólido.
2. **Sin emoji ni íconos de librerías genéricas de stock.** `lucide-react` ya está instalado y es
   aceptable (son íconos de línea, no emoji) — mantenerlo, no agregar `react-icons` ni emoji Unicode
   en el copy.
3. **Radios**: 8px inputs/chips pequeños, 16px tarjetas, cápsula (999px) para botones y badges.
   Verificar que los componentes `Button`/`Badge` de shadcn en `components/ui/` usen `rounded-full`
   donde corresponda (vienen por defecto en `rounded-md`; ajustar si el diseño pide cápsula).
4. **Sombras**: solo `0 1px 3px rgba(28,33,38,.06)` para tarjetas y `0 4px 12px rgba(28,33,38,.10)`
   para estados hover/elevados. Nada de sombras internas ni glow.
5. **Foco**: anillo azul `--ring` de 3px, no el azul/gris por defecto de shadcn.

## 3. Verificación

- `npm run dev` y revisar el mapa de Chile, el panel de detalle de región y cualquier gráfico
  (recharts) contra estos colores.
- Confirmar que el contraste texto/fondo se mantiene legible (los `-foreground` de arriba ya están
  calculados para eso).
- No romper `npm run build` (el paso `datos` que genera `public/data/charlas.json` es independiente
  del CSS, pero confirmar que el build completo sigue pasando).

## 4. Si hace falta más fidelidad

Si en algún componente se necesita un color, radio o sombra que no está en esta lista, **no
inventarlo** — son los mismos tokens de `lib/theme.py` y `styles.css` del dashboard Estudio Seguro;
avisar para extraer el valor exacto de ahí en vez de aproximarlo.
