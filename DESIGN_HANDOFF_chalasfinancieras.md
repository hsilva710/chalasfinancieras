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
- Sí se agrega el isotipo de BancoEstado al header (instrucciones en §3.1) — ese logo ya viene
  incluido en este handoff. Para cualquier otra decisión de producto (agregar una sección, cambiar
  copy, etc.) no inventar — preguntar antes.

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

## 3. `components/dashboard/mapa-charlas.tsx` — donde está casi todo el color real

Este componente (el único de la app) **no usa los tokens de `styles.css` casi en ningún lado**:
casi todos los colores están escritos directo como clases Tailwind arbitrarias (`bg-[#073b4c]`,
`text-[#0f766e]`, etc.) o como atributos SVG (`fill`, `stroke`). Cambiar solo `styles.css` va a
dejar la app casi igual — el trabajo real es reemplazar estos valores uno por uno en este archivo.

### 3.1 Header (acá va el isotipo)

El header actual es un bloque oscuro (`bg-[#073b4c]`) con texto blanco. En Estudio Seguro el
topbar es blanco con borde inferior, isotipo + título a la izquierda — replicar ese patrón acá:

```tsx
<header className="mb-4 flex flex-col gap-4 rounded-b-none border-b border-[#e1e5e9] bg-white px-5 py-4 lg:mb-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
  <div className="flex items-center gap-4">
    <img src="/isotipo.png" alt="BancoEstado" className="h-8 w-auto" />
    <div>
      <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-[#6b7681] uppercase">Educación financiera</p>
      <h1 className="text-2xl font-semibold tracking-tight text-[#343e46] lg:text-[2rem]">Charlas realizadas en Chile</h1>
    </div>
  </div>
  <div className="flex items-center gap-3 rounded-full bg-[#f7f9fa] border border-[#e1e5e9] px-4 py-2.5 text-sm text-[#6b7681]">
    <Hand className="size-5 shrink-0 text-[#ff7900]" aria-hidden="true" />
    <span>Toca una región para ver su detalle</span>
  </div>
</header>
```

Copiar `isotipo.png` a `public/isotipo.png` en el repo. Opcional: usarlo también como favicon
(`<link rel="icon" type="image/png" href="/isotipo.png">` en `index.html`) y cambiar
`<meta name="theme-color" content="#073b4c">` por `content="#ff7900"`.

**No usar `logo-horizontal.png` en este header** — ya lleva el ícono (isotipo) + el título como
texto, agregar el lockup completo con la palabra "BancoEstado" al lado sería redundante. Si se
quiere reforzar la marca en otro lugar, copiar `logo-horizontal.png` a `public/logo-horizontal.png`
y usarlo en un pie de página discreto al fondo del `<main>`, por ejemplo:

```tsx
<footer className="mt-4 flex justify-center">
  <img src="/logo-horizontal.png" alt="BancoEstado" className="h-5 w-auto opacity-70" />
</footer>
```

### 3.2 Mapa: colores de relleno por región (`fillFor`)

```ts
// antes
const fillFor = (charlas: number, max: number, selected: boolean) =>
  selected ? '#f97316' : charlas === 0 ? '#cbd5e1' : charlas / max > 0.72 ? '#0f766e' : '#0284c7';

// después
const fillFor = (charlas: number, max: number, selected: boolean) =>
  selected ? '#ff7900' : charlas === 0 ? '#c4cad0' : charlas / max > 0.72 ? '#28b4bc' : '#358dc9';
```

La leyenda del mapa (`Sin charlas` / `1 charla` / `2 o más charlas`) usa los mismos hex a mano —
actualizar ahí también: `bg-[#cbd5e1]` → `bg-[#c4cad0]`, `bg-[#0284c7]` → `bg-[#358dc9]`,
`bg-[#0f766e]` → `bg-[#28b4bc]`.

En las etiquetas numeradas del mapa (los círculos con el conteo por región):
`stroke="#64748b"` (línea guía) → `stroke="#6b7681"`; `fill="#0f172a"` (texto dentro del círculo)
→ `fill="#343e46"`. `stroke="#ffffff"` en los polígonos de región se mantiene igual (separador
entre regiones, no es un color de marca).

### 3.3 Contenedor del mapa — quitar el degradado

```tsx
// antes (viola la regla "sin degradados")
className="... bg-[radial-gradient(circle_at_40%_15%,#f8fdfc_0%,#eef7f6_52%,#e6f0f0_100%)] ..."

// después
className="... bg-[#f7f9fa] ..."
```

### 3.4 Tabla de reemplazos — el resto del archivo

Todos son reemplazos directos de string; no cambian estructura ni lógica.

| Dónde | Antes | Después | Motivo |
|---|---|---|---|
| `<main>` fondo | `bg-[#eef5f5]` | `bg-[#f7f9fa]` | gris 50 |
| `<main>` selección de texto | `selection:bg-teal-200` | `selection:bg-[#fff1e0]` | naranjo 100 |
| Sombras (los 3 `shadow-[...]` de header/tarjetas) | `shadow-[0_16px_45px_rgba(7,59,76,0.16)]`, `shadow-[0_12px_35px_rgba(15,73,83,0.09)]`, `shadow-[0_8px_22px_rgba(15,73,83,0.07)]` | `shadow-[0_1px_3px_rgba(28,33,38,.06)]` en todas | única sombra de tarjeta de marca |
| `StatCard` ícono, chip | `bg-[#dff3ef] text-[#0f766e]` | `bg-[#fff1e0] text-[#b85600]` | naranjo 100 / naranjo 700 |
| Botón "Ver todo Chile" / "Volver" (outline) | `border-[#c7dcde] text-[#075985] hover:bg-[#eef8f7]` | `border-[#ff7900] text-[#b85600] hover:bg-[#fff1e0]` | botón secundario de marca |
| Título sección mapa | `text-slate-800` | `text-[#343e46]` | gris 700 |
| Subtítulo sección mapa | `text-slate-500` | `text-[#6b7681]` | gris 500 |
| Borde contenedor mapa | `border-[#d8e7e8]` | `border-[#e1e5e9]` | gris 200 |
| Leyenda del mapa, texto | `text-slate-600` / `text-slate-500` | `text-[#4c5761]` / `text-[#6b7681]` | gris 600 / 500 |
| `Overview` ícono chip | `bg-[#e0f3f0] text-[#0f766e]` | `bg-[#fff1e0] text-[#b85600]` | igual que StatCard |
| `Overview` botones de lista, borde | `border-[#d9e7e7]` | `border-[#e1e5e9]` | gris 200 |
| `Overview` botones, hover/active | `hover:bg-[#eff9f7] active:bg-[#dff3ef]` | `hover:bg-[#fff1e0] active:bg-[#ffdcb8]` | naranjo 100 / 200 |
| `Overview` botones, foco | `focus-visible:outline-[#0f766e]` | `focus-visible:outline-[#004dff]` | azul de foco de marca |
| `Overview` botones, texto count | `text-[#0f766e]` | `text-[#b85600]` | naranjo 700 |
| `RegionDetail` overline "Región seleccionada" | `text-[#0f766e] uppercase` | `text-[#6b7681] uppercase` | los overline de marca son siempre gris, nunca de color |
| `RegionDetail` bloque de stats | `bg-[#eff8f7]` | `bg-[#f7f9fa]` | gris 50 |
| `RegionDetail` botón "Volver" | `border-[#c7dcde] text-[#075985]` | `border-[#ff7900] text-[#b85600]` | igual que 3.4 fila botón |
| Tarjeta de charla, borde | `border-[#dce8e8]` | `border-[#e1e5e9]` | gris 200 |
| Ícono `MapPin` junto al lugar | `text-[#0f766e]` | `text-[#6b7681]` | ícono decorativo, no de marca |
| Badge "N alumnos" | `bg-[#dff3ef] text-[#0f766e]` | `bg-[#e2e9ff] text-[#0038b8]` | tono "info" de marca (azul), distinto del naranjo de acción |

### 3.5 Radios — unificar la escala

Hay `rounded-[1.4rem]`, `rounded-[1.5rem]`, `rounded-2xl`, `rounded-xl`, `rounded-lg` mezclados.
Dejar solo tres tamaños, según el token de marca:

- Tarjetas normales (`StatCard`, sección del mapa, aside de detalle, tarjeta de charla):
  `rounded-2xl` (16px) — ya es lo más cercano, no cambiar salvo donde diga `rounded-[1.4rem]`/
  `rounded-[1.5rem]` (esos sí bajarlos a `rounded-2xl`).
- Botones y badges/pills: `rounded-full` (cápsula) — ya lo usan bien en general, revisar que
  ningún botón quedó en `rounded-xl`/`rounded-lg`.
- Chips pequeños de contexto (como el de "Toca una región..."): `rounded-full` también.

## 4. Verificación

- `npm run dev` y revisar el mapa de Chile, el panel de detalle de región y cualquier gráfico
  (recharts) contra estos colores.
- Confirmar que el contraste texto/fondo se mantiene legible (los `-foreground` de arriba ya están
  calculados para eso).
- No romper `npm run build` (el paso `datos` que genera `public/data/charlas.json` es independiente
  del CSS, pero confirmar que el build completo sigue pasando).

## 5. Si hace falta más fidelidad

Si en algún componente se necesita un color, radio o sombra que no está en esta lista, **no
inventarlo** — son los mismos tokens de `lib/theme.py` y `styles.css` del dashboard Estudio Seguro;
avisar para extraer el valor exacto de ahí en vez de aproximarlo.
