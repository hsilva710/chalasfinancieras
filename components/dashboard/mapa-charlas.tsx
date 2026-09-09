'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Building2, ChevronRight, Hand, MapPin, RotateCcw, School, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Charla = { Año: number; Region: string; Lugar: string; ColegioLocacion: string; CantidaddeAlumnos: number };
type RegionMeta = { code: number; name: string; aliases: string[] };
type WebMcpContext = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    execute: (input: unknown) => unknown;
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

declare global { interface Document { modelContext?: WebMcpContext } }

const regions: RegionMeta[] = [
  { code: 15, name: 'Arica y Parinacota', aliases: ['arica y parinacota'] }, { code: 1, name: 'Tarapacá', aliases: ['tarapaca'] },
  { code: 2, name: 'Antofagasta', aliases: ['antofagasta'] }, { code: 3, name: 'Atacama', aliases: ['atacama'] },
  { code: 4, name: 'Coquimbo', aliases: ['coquimbo'] }, { code: 5, name: 'Valparaíso', aliases: ['valparaiso'] },
  { code: 13, name: 'Metropolitana de Santiago', aliases: ['metropolitana de santiago', 'metropolitana', 'santiago'] },
  { code: 6, name: "O'Higgins", aliases: ['ohiggins', 'o higgins', 'libertador bernardo ohiggins', 'libertador general bernardo ohiggins'] },
  { code: 7, name: 'Maule', aliases: ['maule'] }, { code: 16, name: 'Ñuble', aliases: ['nuble'] },
  { code: 8, name: 'Biobío', aliases: ['biobio', 'bio bio'] }, { code: 9, name: 'La Araucanía', aliases: ['la araucania', 'araucania'] },
  { code: 14, name: 'Los Ríos', aliases: ['los rios'] }, { code: 10, name: 'Los Lagos', aliases: ['los lagos'] },
  { code: 11, name: 'Aysén', aliases: ['aysen', 'aysen del general carlos ibanez del campo', 'aysen del gral ibanez del campo'] },
  { code: 12, name: 'Magallanes', aliases: ['magallanes', 'magallanes y antartica chilena', 'magallanes y de la antartica chilena'] },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/region|general|gral\.?|del|de|la/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const resolveRegion = (value: string) => {
  const clean = normalize(value);
  return regions.find((region) => region.aliases.some((alias) => clean === normalize(alias)));
};
const formatNumber = (value: number) => new Intl.NumberFormat('es-CL').format(value);
const schoolPhotoSlug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fillFor = (charlas: number, max: number, selected: boolean) => selected ? '#ff7900' : charlas === 0 ? '#c4cad0' : charlas / max > 0.72 ? '#28b4bc' : '#358dc9';
const labelPositions: Record<number, { coordinates: [number, number]; side: 'left' | 'right' }> = {
  15: { coordinates: [-69.5, -18.5], side: 'right' }, 1: { coordinates: [-69.7, -20.4], side: 'left' },
  2: { coordinates: [-69.1, -23.4], side: 'right' }, 3: { coordinates: [-70.2, -27.3], side: 'left' },
  4: { coordinates: [-71.0, -30.2], side: 'right' }, 5: { coordinates: [-71.0, -33.0], side: 'left' },
  13: { coordinates: [-70.7, -33.5], side: 'right' }, 6: { coordinates: [-70.6, -34.5], side: 'left' },
  7: { coordinates: [-71.3, -35.5], side: 'right' }, 16: { coordinates: [-72.4, -36.5], side: 'left' },
  8: { coordinates: [-73.0, -37.2], side: 'right' }, 9: { coordinates: [-72.5, -38.8], side: 'left' },
  14: { coordinates: [-72.8, -40.2], side: 'right' }, 10: { coordinates: [-73.0, -42.3], side: 'left' },
  11: { coordinates: [-72.0, -46.5], side: 'right' }, 12: { coordinates: [-71.0, -52.2], side: 'left' },
};

export function MapaCharlas() {
  const [data, setData] = useState<Charla[]>([]);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [selectedSchoolKey, setSelectedSchoolKey] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [mapInteractionKey, setMapInteractionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mapScale, setMapScale] = useState(830);
  const metropolitanAudioRef = useRef<HTMLAudioElement>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/data/charlas.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('No fue posible cargar los datos');
      setData((await response.json()) as Charla[]);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const fitMapToScreen = () => setMapScale(Math.round(Math.min(1150, Math.max(830, 830 + (window.innerHeight - 912) * 0.39))));
    fitMapToScreen();
    window.addEventListener('resize', fitMapToScreen);
    return () => window.removeEventListener('resize', fitMapToScreen);
  }, []);

  const reset = useCallback(() => {
    metropolitanAudioRef.current?.pause();
    if (metropolitanAudioRef.current) metropolitanAudioRef.current.currentTime = 0;
    setSelectedCode(null);
    setSelectedSchoolKey(null);
    setMapInteractionKey((key) => key + 1);
  }, []);
  const selectYear = useCallback((year: number | 'all') => {
    reset();
    setSelectedYear(year);
  }, [reset]);
  const selectRegion = useCallback((code: number) => {
    metropolitanAudioRef.current?.pause();
    if (metropolitanAudioRef.current) metropolitanAudioRef.current.currentTime = 0;
    if (code === 13) void metropolitanAudioRef.current?.play().catch(() => undefined);
    setSelectedCode(code);
    setSelectedSchoolKey(null);
  }, []);

  useEffect(() => () => { metropolitanAudioRef.current?.pause(); }, []);
  useEffect(() => {
    let timeout = window.setTimeout(reset, 90000);
    const extend = () => { window.clearTimeout(timeout); timeout = window.setTimeout(reset, 90000); };
    window.addEventListener('pointerdown', extend); window.addEventListener('keydown', extend);
    return () => { window.clearTimeout(timeout); window.removeEventListener('pointerdown', extend); window.removeEventListener('keydown', extend); };
  }, [reset]);

  const years = useMemo(() => [...new Set(data.map((charla) => Number(charla.Año)))].filter(Number.isFinite).sort((a, b) => a - b), [data]);
  const yearOptions: Array<number | 'all'> = ['all', ...years];
  const filteredData = useMemo(() => selectedYear === 'all' ? data : data.filter((charla) => Number(charla.Año) === selectedYear), [data, selectedYear]);
  const byRegion = useMemo(() => {
    const summary = new Map<number, Charla[]>();
    filteredData.forEach((charla) => { const region = resolveRegion(charla.Region); if (region) summary.set(region.code, [...(summary.get(region.code) ?? []), charla]); });
    return summary;
  }, [filteredData]);
  const totalStudents = filteredData.reduce((total, charla) => total + Number(charla.CantidaddeAlumnos || 0), 0);
  const activeRegions = [...byRegion.values()].filter((charlas) => charlas.length > 0).length;
  const maxCharlas = Math.max(1, ...[...byRegion.values()].map((charlas) => charlas.length));
  const selectedRegion = regions.find((region) => region.code === selectedCode) ?? null;
  const selectedCharlas = useMemo(() => selectedCode ? [...(byRegion.get(selectedCode) ?? [])].sort((first, second) => first.ColegioLocacion.localeCompare(second.ColegioLocacion, 'es', { sensitivity: 'base' })) : [], [byRegion, selectedCode]);
  const selectedStudents = selectedCharlas.reduce((total, charla) => total + charla.CantidaddeAlumnos, 0);
  const selectedSchools = new Set(selectedCharlas.map((charla) => charla.ColegioLocacion)).size;

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'seleccionar_region',
      title: 'Seleccionar una región',
      description: 'Muestra en pantalla el detalle de una región de Chile.',
      inputSchema: { type: 'object', properties: { region: { type: 'string' } }, required: ['region'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input) => {
        if (!input || typeof input !== 'object' || !('region' in input) || typeof input.region !== 'string') throw new Error('Indica una región válida.');
        const region = resolveRegion(input.region);
        if (!region) throw new Error(`No se reconoce la región: ${input.region}`);
        const charlas = byRegion.get(region.code) ?? [];
        selectRegion(region.code);
        return { region: region.name, charlas: charlas.length, alumnos: charlas.reduce((total, charla) => total + charla.CantidaddeAlumnos, 0) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [byRegion, selectRegion]);

  return <main className="min-h-screen bg-[#404040] text-slate-800 selection:bg-[#fff1e0] lg:h-screen lg:overflow-hidden">
    <audio ref={metropolitanAudioRef} src="/audio/region-metropolitana.mp3" preload="auto" aria-hidden="true" />
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:h-full lg:overflow-hidden lg:px-7 lg:py-6">
      <header className="mb-4 flex flex-col gap-4 rounded-2xl border border-[#e1e5e9] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(28,33,38,.06)] lg:mb-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
        <div className="flex items-center gap-4"><img src="/isotipo.png" alt="BancoEstado" className="h-8 w-auto" /><div><p className="mb-1 text-xs font-semibold tracking-[0.1em] text-[#6b7681]">Educación Financiera - Subgerencia de Ahorro</p><h1 className="text-2xl font-semibold tracking-tight text-[#343e46] lg:text-[2rem]">Charlas realizadas en Chile</h1></div></div>
        <div className="flex flex-col items-start gap-3 lg:items-end"><div className="flex items-center gap-3 rounded-full border border-[#e1e5e9] bg-[#f7f9fa] px-4 py-2.5 text-sm text-[#6b7681]"><Hand className="size-5 shrink-0 text-[#ff7900]" aria-hidden="true" /><span>Toca una región para ver su detalle</span></div><div role="group" aria-label="Filtrar charlas por año" className="flex flex-wrap gap-2">{yearOptions.map((year) => { const isActive = selectedYear === year; const label = year === 'all' ? 'Todos los años' : String(year); return <button key={String(year)} type="button" aria-pressed={isActive} onClick={() => selectYear(year)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-[#e1e5e9] bg-white text-[#6b7681] hover:bg-[#fff1e0]'}`}>{label}</button>; })}</div></div>
      </header>
      <section aria-label="Resumen nacional" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mb-5">
        <StatCard icon={<MapPin />} value={formatNumber(activeRegions)} label="regiones visitadas" loading={loading} />
        <StatCard icon={<School />} value={formatNumber(filteredData.length)} label="charlas realizadas" loading={loading} />
        <StatCard icon={<Users />} value={formatNumber(totalStudents)} label="alumnos alcanzados" loading={loading} />
      </section>
      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.78fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-5">
        <section aria-label="Mapa interactivo de Chile" className="flex min-h-[570px] flex-col rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(28,33,38,.06)] lg:h-full lg:min-h-0 lg:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight text-[#343e46]">Mapa de cobertura</h2><p className="mt-1 text-sm text-[#6b7681]">El color y las etiquetas indican la cantidad de charlas por región.</p></div><Button aria-label="Volver a la vista nacional" className="h-12 shrink-0 rounded-full border-[#ff7900] px-4 text-base text-[#b85600] hover:bg-[#fff1e0]" variant="outline" onClick={reset}><RotateCcw className="size-5" /><span className="hidden sm:inline">Ver todo Chile</span></Button></div>
          <div className="relative flex min-h-[430px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#e1e5e9] bg-[#f7f9fa] px-2 py-3 lg:min-h-0">
            {loading && <p className="text-lg font-medium text-slate-500">Cargando mapa…</p>}
            {error && <div className="text-center"><p className="mb-3 text-lg font-medium text-slate-700">No pudimos cargar las charlas.</p><Button className="h-12 rounded-full px-5 text-base" onClick={() => void loadData()}>Reintentar</Button></div>}
            {!loading && !error && <ComposableMap aria-label="Mapa de las regiones de Chile. Usa dos dedos para acercar o alejar y un dedo para moverlo." className="h-full w-auto max-w-full -translate-y-4 touch-none" projection="geoMercator" projectionConfig={{ center: [-71.1, -37.5], scale: mapScale }} width={560} height={700}>
              <ZoomableGroup key={mapInteractionKey} center={[-71.1, -37.5]} minZoom={1} maxZoom={4}>
              <Geographies geography="/chile-regiones.geojson">{({ geographies }) => <>
                {geographies.map((geo) => {
                  const properties = geo.properties ?? {}; const code = Number(properties.codregion); const charlas = byRegion.get(code) ?? []; const isSelected = selectedCode === code; const region = regions.find((item) => item.code === code); const label = region?.name ?? properties.Region;
                  const activate = () => selectRegion(code);
                  // oxlint-disable-next-line jsx-a11y(prefer-tag-over-role)
                  return <Geography key={geo.rsmKey} geography={geo} aria-label={`${label}: ${charlas.length} charlas`} role="button" tabIndex={0} fill={fillFor(charlas.length, maxCharlas, isSelected)} stroke="#ffffff" strokeWidth={0.75} onClick={activate} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }} style={{ cursor: 'pointer', outline: 'none' }} />;
                })}
                {geographies.map((geo) => {
                  const code = Number(geo.properties?.codregion); const position = labelPositions[code];
                  if (!position) return null;
                  const count = (byRegion.get(code) ?? []).length; const side = position.side === 'right' ? 1 : -1; const x = side * 39; const fill = fillFor(count, maxCharlas, selectedCode === code);
                  return <Marker key={`label-${code}`} coordinates={position.coordinates} pointerEvents="none" aria-label={`${regions.find((region) => region.code === code)?.name}: ${count} charlas`}>
                    <line x1={0} y1={0} x2={side * 31} y2={0} stroke="#6b7681" strokeWidth={1.2} />
                    <g transform={`translate(${x}, -11)`}><rect x={side === 1 ? 0 : -28} y={0} width={28} height={22} rx={11} fill="#ffffff" stroke={fill} strokeWidth={1.4} /><text x={side === 1 ? 14 : -14} y={15} textAnchor="middle" fill="#343e46" fontSize={13} fontWeight={700}>{count}</text></g>
                  </Marker>;
                })}
              </>}</Geographies>
              </ZoomableGroup>
            </ComposableMap>}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"><div className="flex items-center gap-2 text-sm font-medium text-[#4c5761]"><span className="size-4 rounded-md bg-[#c4cad0] ring-1 ring-slate-400" /> Sin charlas <span className="ml-2 size-4 rounded-md bg-[#358dc9]" /> 1 charla <span className="ml-2 size-4 rounded-md bg-[#28b4bc]" /> 2 o más charlas</div><p className="text-sm text-[#6b7681]">La selección se reinicia después de 90 segundos.</p></div>
        </section>
        <aside aria-live="polite" className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(28,33,38,.06)] lg:min-h-0 lg:overflow-y-auto">
          {selectedRegion ? <RegionDetail region={selectedRegion} charlas={selectedCharlas} students={selectedStudents} schools={selectedSchools} selectedSchoolKey={selectedSchoolKey} onSelectSchool={setSelectedSchoolKey} onClose={reset} /> : <Overview regionsWithActivity={regions.filter((region) => (byRegion.get(region.code) ?? []).length > 0)} byRegion={byRegion} onSelect={selectRegion} />}
        </aside>
      </section>
      <footer className="pt-4 text-center text-xs font-medium text-[#d1d1d1]">© Design by El Patroncito 2026</footer>
    </div>
  </main>;
}

function StatCard({ icon, value, label, loading }: { icon: ReactNode; value: string; label: string; loading: boolean }) { return <article className="flex min-h-24 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(28,33,38,.06)]"><span className="grid size-12 place-items-center rounded-2xl bg-[#fff1e0] text-[#b85600]">{icon}</span><div><p className="text-2xl font-semibold tracking-tight text-slate-800">{loading ? '—' : value}</p><p className="text-sm font-medium text-slate-500">{label}</p></div></article>; }

function Overview({ regionsWithActivity, byRegion, onSelect }: { regionsWithActivity: RegionMeta[]; byRegion: Map<number, Charla[]>; onSelect: (code: number) => void }) { return <div className="flex h-full flex-col"><span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#fff1e0] text-[#b85600]"><Hand className="size-6" /></span><h2 className="text-2xl font-semibold tracking-tight text-slate-800">Explora el mapa</h2><p className="mt-2 text-base leading-6 text-slate-600">Toca una región en el mapa o selecciónala desde esta lista.</p><div className="mt-6 grid gap-2 overflow-auto pr-1">{regionsWithActivity.map((region) => { const count = (byRegion.get(region.code) ?? []).length; return <button key={region.code} onClick={() => onSelect(region.code)} className="flex min-h-14 items-center justify-between rounded-full border border-[#e1e5e9] px-4 text-left transition-colors hover:bg-[#fff1e0] active:bg-[#ffdcb8] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#004dff]"><span className="font-semibold text-slate-700">{region.name}</span><span className="flex items-center gap-2 text-sm font-medium text-[#b85600]">{count} <span className="hidden sm:inline">charlas</span><ChevronRight className="size-5" /></span></button>; })}</div></div>; }

function RegionDetail({ region, charlas, students, schools, selectedSchoolKey, onSelectSchool, onClose }: { region: RegionMeta; charlas: Charla[]; students: number; schools: number; selectedSchoolKey: string | null; onSelectSchool: (key: string | null) => void; onClose: () => void }) { return <div className="flex h-full flex-col"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold tracking-[0.13em] text-[#6b7681] uppercase">Región seleccionada</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">{region.name}</h2></div><Button variant="outline" className="h-12 rounded-full border-[#ff7900] px-3 text-[#b85600]" onClick={onClose} aria-label="Cerrar detalle de región"><RotateCcw className="size-5" /><span className="hidden sm:inline">Volver</span></Button></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#f7f9fa] p-3 text-center"><MiniStat value={formatNumber(charlas.length)} label="charlas" /><MiniStat value={formatNumber(students)} label="alumnos" /><MiniStat value={formatNumber(schools)} label="colegios" /></div>{charlas.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-600">Aún no se registran charlas en esta región.</div> : <div className="mt-5 flex-1 overflow-auto pr-1"><h3 className="mb-3 text-base font-semibold text-slate-700">Charlas registradas</h3><div className="grid gap-3">{charlas.map((charla, index) => { const schoolKey = `${charla.Año}-${charla.Lugar}-${charla.ColegioLocacion}-${index}`; const isOpen = schoolKey === selectedSchoolKey; return <article key={schoolKey} className="rounded-2xl border border-[#e1e5e9] p-4"><div className="flex items-start justify-between gap-3"><div><button type="button" onClick={() => onSelectSchool(isOpen ? null : schoolKey)} aria-expanded={isOpen} className="rounded text-left font-semibold leading-5 text-slate-800 underline-offset-4 transition-colors hover:text-[#b85600] hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#004dff]">{charla.ColegioLocacion}</button><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-4 text-[#6b7681]" />{charla.Lugar}</p></div><span className="shrink-0 rounded-full bg-[#e2e9ff] px-2.5 py-1.5 text-sm font-semibold text-[#0038b8]">{formatNumber(charla.CantidaddeAlumnos)} alumnos</span></div>{isOpen && <div className="mt-3 overflow-hidden rounded-2xl border border-[#e1e5e9] bg-[#f7f9fa]"><SchoolPhoto schoolName={charla.ColegioLocacion} /><p className="px-3 py-2 text-xs font-medium text-[#6b7681]">Foto referencial</p></div>}</article>; })}</div></div>}<div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Building2 className="size-4" />Datos cargados desde el archivo de charlas.</div></div>; }

function SchoolPhoto({ schoolName }: { schoolName: string }) { const fallback = '/colegios/foto-referencial-colegio.png'; const [src, setSrc] = useState(`/colegios/${schoolPhotoSlug(schoolName)}.jpg`); return <img src={src} alt={`Foto referencial de ${schoolName}`} className="aspect-[4/3] w-full object-cover" onError={() => { if (src !== fallback) setSrc(fallback); }} />; }

function MiniStat({ value, label }: { value: string; label: string }) { return <div><p className="text-xl font-semibold text-slate-800">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>; }
