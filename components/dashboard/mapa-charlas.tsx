'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Building2, ChevronRight, Hand, MapPin, RotateCcw, School, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Charla = { Region: string; Lugar: string; ColegioLocacion: string; CantidaddeAlumnos: number };
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
  { code: 6, name: "O'Higgins", aliases: ['ohiggins', 'libertador bernardo ohiggins', 'libertador general bernardo ohiggins'] },
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
const fillFor = (charlas: number, max: number, selected: boolean) => selected ? '#075985' : charlas === 0 ? '#dde8e9' : charlas / max > 0.72 ? '#0f766e' : charlas / max > 0.4 ? '#299d92' : '#78cbbd';

export function MapaCharlas() {
  const [data, setData] = useState<Charla[]>([]);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/data/charlas.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('No fue posible cargar los datos');
      setData((await response.json()) as Charla[]);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const reset = useCallback(() => setSelectedCode(null), []);
  useEffect(() => {
    let timeout = window.setTimeout(reset, 90000);
    const extend = () => { window.clearTimeout(timeout); timeout = window.setTimeout(reset, 90000); };
    window.addEventListener('pointerdown', extend); window.addEventListener('keydown', extend);
    return () => { window.clearTimeout(timeout); window.removeEventListener('pointerdown', extend); window.removeEventListener('keydown', extend); };
  }, [reset]);

  const byRegion = useMemo(() => {
    const summary = new Map<number, Charla[]>();
    data.forEach((charla) => { const region = resolveRegion(charla.Region); if (region) summary.set(region.code, [...(summary.get(region.code) ?? []), charla]); });
    return summary;
  }, [data]);
  const totalStudents = data.reduce((total, charla) => total + Number(charla.CantidaddeAlumnos || 0), 0);
  const activeRegions = [...byRegion.values()].filter((charlas) => charlas.length > 0).length;
  const maxCharlas = Math.max(1, ...[...byRegion.values()].map((charlas) => charlas.length));
  const selectedRegion = regions.find((region) => region.code === selectedCode) ?? null;
  const selectedCharlas = selectedCode ? byRegion.get(selectedCode) ?? [] : [];
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
        setSelectedCode(region.code);
        return { region: region.name, charlas: charlas.length, alumnos: charlas.reduce((total, charla) => total + charla.CantidaddeAlumnos, 0) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [byRegion]);

  return <main className="min-h-screen bg-[#eef5f5] text-slate-800 selection:bg-teal-200 lg:h-screen lg:overflow-hidden">
    <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:h-full lg:overflow-hidden lg:px-7 lg:py-6">
      <header className="mb-4 flex flex-col gap-4 rounded-[1.4rem] bg-[#073b4c] px-5 py-5 text-white shadow-[0_16px_45px_rgba(7,59,76,0.16)] lg:mb-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
        <div><p className="mb-1 text-sm font-semibold tracking-[0.16em] text-teal-200 uppercase">Educación financiera</p><h1 className="text-2xl font-semibold tracking-tight lg:text-[2rem]">Charlas realizadas en Chile</h1></div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-base text-teal-50"><Hand className="size-6 shrink-0 text-teal-200" aria-hidden="true" /><span>Toca una región para ver su detalle</span></div>
      </header>
      <section aria-label="Resumen nacional" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mb-5">
        <StatCard icon={<MapPin />} value={formatNumber(activeRegions)} label="regiones visitadas" loading={loading} />
        <StatCard icon={<School />} value={formatNumber(data.length)} label="charlas realizadas" loading={loading} />
        <StatCard icon={<Users />} value={formatNumber(totalStudents)} label="alumnos alcanzados" loading={loading} />
      </section>
      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.78fr)] lg:gap-5">
        <section aria-label="Mapa interactivo de Chile" className="flex min-h-[570px] flex-col rounded-[1.5rem] bg-white p-4 shadow-[0_12px_35px_rgba(15,73,83,0.09)] lg:h-full lg:min-h-0 lg:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight text-slate-800">Mapa de cobertura</h2><p className="mt-1 text-sm text-slate-500">El color indica la cantidad de charlas por región.</p></div><Button aria-label="Volver a la vista nacional" className="h-12 shrink-0 rounded-xl border-[#c7dcde] px-4 text-base text-[#075985] hover:bg-[#eef8f7]" variant="outline" onClick={reset}><RotateCcw className="size-5" /><span className="hidden sm:inline">Ver todo Chile</span></Button></div>
          <div className="relative flex min-h-[430px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#d8e7e8] bg-[radial-gradient(circle_at_40%_15%,#f8fdfc_0%,#eef7f6_52%,#e6f0f0_100%)] px-2 py-3 lg:h-[clamp(360px,calc(100dvh-430px),640px)] lg:min-h-0 lg:flex-none">
            {loading && <p className="text-lg font-medium text-slate-500">Cargando mapa…</p>}
            {error && <div className="text-center"><p className="mb-3 text-lg font-medium text-slate-700">No pudimos cargar las charlas.</p><Button className="h-12 rounded-xl px-5 text-base" onClick={() => void loadData()}>Reintentar</Button></div>}
            {!loading && !error && <ComposableMap aria-label="Mapa de las regiones de Chile" className="h-full max-h-[640px] w-auto max-w-full" projection="geoMercator" projectionConfig={{ center: [-71.1, -37.5], scale: 720 }} width={560} height={700}>
              <Geographies geography="/chile-regiones.geojson">{({ geographies }) => geographies.map((geo) => {
                const properties = geo.properties ?? {}; const code = Number(properties.codregion); const charlas = byRegion.get(code) ?? []; const isSelected = selectedCode === code; const region = regions.find((item) => item.code === code); const label = region?.name ?? properties.Region;
                const activate = () => setSelectedCode(code);
                // oxlint-disable-next-line jsx-a11y(prefer-tag-over-role)
                return <Geography key={geo.rsmKey} geography={geo} aria-label={`${label}: ${charlas.length} charlas`} role="button" tabIndex={0} fill={fillFor(charlas.length, maxCharlas, isSelected)} stroke="#ffffff" strokeWidth={0.75} onClick={activate} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }} style={{ cursor: 'pointer', outline: 'none' }} />;
              })}</Geographies>
            </ComposableMap>}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><span className="size-4 rounded-md bg-[#dde8e9] ring-1 ring-slate-300" /> Sin charlas <span className="ml-2 size-4 rounded-md bg-[#78cbbd]" /> Menor cobertura <span className="ml-2 size-4 rounded-md bg-[#0f766e]" /> Mayor cobertura</div><p className="text-sm text-slate-500">La selección se reinicia después de 90 segundos.</p></div>
        </section>
        <aside aria-live="polite" className="rounded-[1.5rem] bg-white p-5 shadow-[0_12px_35px_rgba(15,73,83,0.09)]">
          {selectedRegion ? <RegionDetail region={selectedRegion} charlas={selectedCharlas} students={selectedStudents} schools={selectedSchools} onClose={reset} /> : <Overview regionsWithActivity={regions.filter((region) => (byRegion.get(region.code) ?? []).length > 0)} byRegion={byRegion} onSelect={setSelectedCode} />}
        </aside>
      </section>
    </div>
  </main>;
}

function StatCard({ icon, value, label, loading }: { icon: ReactNode; value: string; label: string; loading: boolean }) { return <article className="flex min-h-24 items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_22px_rgba(15,73,83,0.07)]"><span className="grid size-12 place-items-center rounded-2xl bg-[#dff3ef] text-[#0f766e]">{icon}</span><div><p className="text-2xl font-semibold tracking-tight text-slate-800">{loading ? '—' : value}</p><p className="text-sm font-medium text-slate-500">{label}</p></div></article>; }

function Overview({ regionsWithActivity, byRegion, onSelect }: { regionsWithActivity: RegionMeta[]; byRegion: Map<number, Charla[]>; onSelect: (code: number) => void }) { return <div className="flex h-full flex-col"><span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e0f3f0] text-[#0f766e]"><Hand className="size-6" /></span><h2 className="text-2xl font-semibold tracking-tight text-slate-800">Explora el mapa</h2><p className="mt-2 text-base leading-6 text-slate-600">Toca una región en el mapa o selecciónala desde esta lista.</p><div className="mt-6 grid gap-2 overflow-auto pr-1">{regionsWithActivity.map((region) => { const count = (byRegion.get(region.code) ?? []).length; return <button key={region.code} onClick={() => onSelect(region.code)} className="flex min-h-14 items-center justify-between rounded-xl border border-[#d9e7e7] px-4 text-left transition-colors hover:bg-[#eff9f7] active:bg-[#dff3ef] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"><span className="font-semibold text-slate-700">{region.name}</span><span className="flex items-center gap-2 text-sm font-medium text-[#0f766e]">{count} <span className="hidden sm:inline">charlas</span><ChevronRight className="size-5" /></span></button>; })}</div></div>; }

function RegionDetail({ region, charlas, students, schools, onClose }: { region: RegionMeta; charlas: Charla[]; students: number; schools: number; onClose: () => void }) { return <div className="flex h-full flex-col"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold tracking-[0.13em] text-[#0f766e] uppercase">Región seleccionada</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">{region.name}</h2></div><Button variant="outline" className="h-12 rounded-xl border-[#c7dcde] px-3 text-[#075985]" onClick={onClose} aria-label="Cerrar detalle de región"><RotateCcw className="size-5" /><span className="hidden sm:inline">Volver</span></Button></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#eff8f7] p-3 text-center"><MiniStat value={formatNumber(charlas.length)} label="charlas" /><MiniStat value={formatNumber(students)} label="alumnos" /><MiniStat value={formatNumber(schools)} label="colegios" /></div>{charlas.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-600">Aún no se registran charlas en esta región.</div> : <div className="mt-5 flex-1 overflow-auto pr-1"><h3 className="mb-3 text-base font-semibold text-slate-700">Charlas registradas</h3><div className="grid gap-3">{charlas.map((charla, index) => <article key={`${charla.ColegioLocacion}-${index}`} className="rounded-xl border border-[#dce8e8] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold leading-5 text-slate-800">{charla.ColegioLocacion}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-4 text-[#0f766e]" />{charla.Lugar}</p></div><span className="shrink-0 rounded-lg bg-[#dff3ef] px-2.5 py-1.5 text-sm font-semibold text-[#0f766e]">{formatNumber(charla.CantidaddeAlumnos)} alumnos</span></div></article>)}</div></div>}<div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Building2 className="size-4" />Datos cargados desde el archivo de charlas.</div></div>; }

function MiniStat({ value, label }: { value: string; label: string }) { return <div><p className="text-xl font-semibold text-slate-800">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>; }
