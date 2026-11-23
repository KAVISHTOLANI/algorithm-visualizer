import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Field, Landing, NotFound, Notice, PageHead, Shell, usePersistentState, useRoute } from './shared/ui';
import { ALGOS, makeInput, parseInput, run, type Frame, type Preset } from './lib/algorithms';

const KEY = 'motion-sort:settings';
const NAV = [
  { to: '/', label: 'Overview' },
  { to: '/visualize', label: 'Visualise' },
  { to: '/race', label: 'Race' },
  { to: '/compare', label: 'Compare' },
];
const PRESETS: [Preset, string][] = [['random', 'Random'], ['nearly', 'Nearly sorted'], ['reversed', 'Reversed'], ['sorted', 'Already sorted'], ['few', 'Few unique values']];
const SORTS = ALGOS.filter((a) => a.kind === 'sort');
const SPEEDS: [number, string][] = [[600, 'Slow'], [220, 'Medium'], [60, 'Fast'], [12, 'Very fast']];

interface Settings {
  algo: string;
  size: number;
  preset: Preset;
  speed: number;
  raceA: string;
  raceB: string;
}

export default function App() {
  const [route] = useRoute();
  const [s, setS] = usePersistentState<Settings>(KEY, { algo: 'quick', size: 24, preset: 'random', speed: 220, raceA: 'insertion', raceB: 'merge' });
  let page: ReactNode;
  if (route === '/') page = <Home />;
  else if (route === '/visualize') page = <Visualize s={s} setS={setS} />;
  else if (route === '/race') page = <Race s={s} setS={setS} />;
  else if (route === '/compare') page = <Compare />;
  else page = <NotFound />;
  return (
    <Shell name="Motion Sort" wordmark={['Motion', 'Sort']} nav={NAV} route={route} cta={{ to: '/visualize', label: 'Open the visualiser' }} footerNote="Every frame comes from running the real algorithm on your data, in your browser.">
      {page}
    </Shell>
  );
}

/* ---------- Player ---------- */
function usePlayer(frames: Frame[], speed: number) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setI(0); setPlaying(false); }, [frames]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => { if (x >= frames.length - 1) { setPlaying(false); return x; } return x + 1; }), speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);
  return { i, setI, playing, setPlaying, frame: frames[Math.min(i, frames.length - 1)], last: frames.length - 1 };
}

export function Bars({ frame, compact, label }: { frame: Frame; compact?: boolean; label: string }) {
  const max = Math.max(1, ...frame.array);
  return (
    <div className={`bars-viz ${compact ? 'is-compact' : ''}`} role="img" aria-label={`${label}: ${frame.array.join(', ')}`}>
      {frame.array.map((v, k) => {
        const cls = frame.write.includes(k) ? 'w' : frame.compare.includes(k) ? 'c' : frame.pivot === k ? 'p' : frame.sorted.includes(k) ? 's' : frame.range && (k < frame.range[0] || k > frame.range[1]) ? 'o' : '';
        return <span key={k} className={`b ${cls}`} style={{ height: `${Math.max(2, (v / max) * 100)}%` }}>{!compact && frame.array.length <= 24 && <i>{v}</i>}</span>;
      })}
    </div>
  );
}

function Legend() {
  return <p className="legend"><span><i className="k-c" />Comparing</span><span><i className="k-w" />Writing / swapping</span><span><i className="k-p" />Pivot / current minimum</span><span><i className="k-s" />In final place</span><span><i className="k-o" />Outside the active range</span></p>;
}

function HeroPreview() {
  const frames = useMemo(() => run('quick', makeInput(28, 'random', mulberry(7))), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setI(frames.length - 1); return; }
    const t = setInterval(() => setI((x) => (x >= frames.length - 1 ? 0 : x + 1)), 70);
    return () => clearInterval(t);
  }, [frames]);
  const f = frames[i];
  return (
    <div className="hero-ms">
      <div className="row-between"><strong className="hero-ms-title">Quicksort</strong><span className="mono small">{f.comparisons} comparisons · {f.writes} writes</span></div>
      <Bars frame={f} compact label="Quicksort animation on demo data" />
      <p className="small muted hero-note">{f.note}</p>
    </div>
  );
}

function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function Home() {
  return (
    <Landing
      eyebrow="Algorithm visualiser"
      title={<>Watch the algorithm <em>think.</em></>}
      lead="Six sorting algorithms and two searches, run on real data and recorded one comparison at a time. Step through them, read the line of pseudocode that’s running, and race two side by side."
      primary={{ href: '#/visualize', label: 'Open the visualiser' }}
      secondary={{ href: '#/race', label: 'Race two algorithms' }}
      previewLabel="Quicksort — running live"
      preview={<HeroPreview />}
      compact
      steps={[
        { title: 'Choose', body: 'Bubble, insertion, selection, merge, quick or heap sort — or a linear or binary search.' },
        { title: 'Shape the data', body: 'Random, nearly sorted, reversed, already sorted, few unique values, or your own numbers.' },
        { title: 'Step or play', body: 'Pause anywhere, step back, and watch the comparison and write counters climb.' },
      ]}
      features={[
        { title: 'Real counts', body: 'Comparisons and writes are counted from the actual run, so you can see O(n²) versus O(n log n).' },
        { title: 'Pseudocode in sync', body: 'The line being executed is highlighted next to the bars.' },
        { title: 'Best and worst cases', body: 'Try quicksort on already-sorted data, or insertion sort on nearly-sorted data.' },
        { title: 'Keyboard control', body: 'Space plays and pauses; the arrow keys step one frame.' },
      ]}
      note="Colours are paired with a legend and a text description of each step."
      closing={{ title: <>Sorting, <em>slowed right down.</em></>, action: { href: '#/visualize', label: 'Start visualising' } }}
    />
  );
}

/* ---------- Visualise ---------- */
function DataControls({ s, setS, custom, setCustom, err, onApply }: { s: Settings; setS: (x: Settings) => void; custom: string; setCustom: (x: string) => void; err: string | null; onApply: () => void }) {
  return (
    <div className="card stack">
      <div className="filters">
        <Field label="Data">{(p) => <select {...p} value={s.preset} onChange={(e) => setS({ ...s, preset: e.target.value as Preset })}>{PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
        <Field label={`Size: ${s.size}`}>{(p) => <input {...p} type="range" min={5} max={64} value={s.size} onChange={(e) => setS({ ...s, size: Number(e.target.value) })} />}</Field>
        <Field label="Speed">{(p) => <select {...p} value={s.speed} onChange={(e) => setS({ ...s, speed: Number(e.target.value) })}>{SPEEDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
      </div>
      <form className="filters" onSubmit={(e) => { e.preventDefault(); onApply(); }}>
        <Field label="Or use your own numbers" className="grow" hint="2–64 values from 0 to 999" error={err}>{(p) => <input {...p} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 42, 7, 19, 3, 88" />}</Field>
        <button className="btn" type="submit">Use these</button>
      </form>
    </div>
  );
}

function Controls({ p }: { p: ReturnType<typeof usePlayer> }) {
  return (
    <div className="controls row">
      <button type="button" className="btn btn-sm" aria-label="First step" onClick={() => p.setI(0)} disabled={p.i === 0}>⏮</button>
      <button type="button" className="btn btn-sm" aria-label="Previous step" onClick={() => p.setI(Math.max(0, p.i - 1))} disabled={p.i === 0}>◀</button>
      <button type="button" className="btn btn-primary" onClick={() => { if (p.i >= p.last) p.setI(0); p.setPlaying(!p.playing); }}>{p.playing ? 'Pause' : p.i >= p.last ? 'Replay' : 'Play'}</button>
      <button type="button" className="btn btn-sm" aria-label="Next step" onClick={() => p.setI(Math.min(p.last, p.i + 1))} disabled={p.i >= p.last}>▶</button>
      <button type="button" className="btn btn-sm" aria-label="Last step" onClick={() => p.setI(p.last)} disabled={p.i >= p.last}>⏭</button>
      <label className="scrub"><span className="sr-only">Step</span><input type="range" min={0} max={p.last} value={p.i} onChange={(e) => { p.setPlaying(false); p.setI(Number(e.target.value)); }} /></label>
      <span className="mono small" data-testid="step">Step {p.i} / {p.last}</span>
    </div>
  );
}

function Visualize({ s, setS }: { s: Settings; setS: (x: Settings) => void }) {
  const [custom, setCustom] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [own, setOwn] = useState<number[] | null>(null);
  const [seed, setSeed] = useState(1);
  const [target, setTarget] = useState<number | null>(null);
  const info = ALGOS.find((a) => a.key === s.algo)!;
  const input = useMemo(() => own ?? makeInput(s.size, s.preset, mulberry(seed)), [own, s.size, s.preset, seed]);
  const tgt = target ?? input[Math.floor(input.length / 3)];
  const frames = useMemo(() => run(s.algo, input, tgt), [s.algo, input, tgt]);
  const p = usePlayer(frames, s.speed);
  const f = p.frame;
  function onKey(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).closest('input, select, textarea')) return;
    if (e.key === ' ') { e.preventDefault(); p.setPlaying(!p.playing); }
    if (e.key === 'ArrowRight') { e.preventDefault(); p.setI(Math.min(p.last, p.i + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); p.setI(Math.max(0, p.i - 1)); }
  }
  function apply() {
    const r = parseInput(custom);
    setErr(r.error ?? null);
    if (r.values) setOwn(r.values);
  }
  return (
    <div className="stack" onKeyDown={onKey}>
      <PageHead eyebrow={info.kind === 'sort' ? 'Sorting' : 'Searching'} title={<>{info.name}</>} description={info.blurb} actions={<button type="button" className="btn" onClick={() => { setOwn(null); setSeed(seed + 1); }}>New data</button>} />
      <div className="algo-pick" role="radiogroup" aria-label="Algorithm">
        {ALGOS.map((a) => <button key={a.key} type="button" role="radio" aria-checked={s.algo === a.key} className="btn btn-sm" onClick={() => setS({ ...s, algo: a.key })}>{a.name}</button>)}
      </div>
      <DataControls s={s} setS={(x) => { setOwn(null); setS(x); }} custom={custom} setCustom={setCustom} err={err} onApply={apply} />
      {own && <Notice kind="info">Using your {own.length} numbers. Change “Data” or press “New data” to go back to generated data.</Notice>}
      {info.kind === 'search' && <div className="card filters"><Field label="Search for">{(x) => <select {...x} value={tgt} onChange={(e) => setTarget(Number(e.target.value))}>{[...new Set(input)].sort((a, b) => a - b).map((v) => <option key={v} value={v}>{v}</option>)}<option value={1000}>1000 (not in list)</option></select>}</Field></div>}
      <div className="layout-main">
        <section className="card stack" aria-labelledby="viz-t">
          <h2 id="viz-t" className="sr-only">Visualisation</h2>
          <Bars frame={f} label={`Step ${p.i}`} />
          <p className="step-note" aria-live="polite" data-testid="note">{f.note}</p>
          <Controls p={p} />
          <Legend />
        </section>
        <aside className="card stack">
          <div className="stats mini">
            <div className="stat"><span className="stat-label">Comparisons</span><span className="stat-value" data-testid="cmp">{f.comparisons}</span></div>
            <div className="stat"><span className="stat-label">Writes</span><span className="stat-value">{f.writes}</span></div>
          </div>
          <div className="code" role="list" aria-label="Pseudocode">{info.code.map((l, k) => <code key={k} role="listitem" className={k === f.line ? 'on' : ''} aria-current={k === f.line ? 'step' : undefined}>{l}</code>)}</div>
          <dl className="cx"><dt>Best</dt><dd>{info.best}</dd><dt>Average</dt><dd>{info.average}</dd><dt>Worst</dt><dd>{info.worst}</dd><dt>Extra space</dt><dd>{info.space}</dd>{info.stable != null && <><dt>Stable</dt><dd>{info.stable ? 'Yes' : 'No'}</dd></>}</dl>
          <p className="small muted">Space: play/pause · ← →: step</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Race ---------- */
function Race({ s, setS }: { s: Settings; setS: (x: Settings) => void }) {
  const [seed, setSeed] = useState(1);
  const sorts = SORTS;
  const input = useMemo(() => makeInput(s.size, s.preset, mulberry(seed)), [s.size, s.preset, seed]);
  const fa = useMemo(() => run(s.raceA, input), [s.raceA, input]);
  const fb = useMemo(() => run(s.raceB, input), [s.raceB, input]);
  const longest = useMemo(() => Array.from({ length: Math.max(fa.length, fb.length) }, (_, k) => fa[Math.min(k, fa.length - 1)]), [fa, fb]);
  const p = usePlayer(longest, s.speed);
  const A = fa[Math.min(p.i, fa.length - 1)], B = fb[Math.min(p.i, fb.length - 1)];
  const doneA = p.i >= fa.length - 1, doneB = p.i >= fb.length - 1;
  const name = (k: string) => ALGOS.find((a) => a.key === k)!.name;
  return (
    <div className="stack">
      <PageHead eyebrow="Race" title={<>Same data, <em>two algorithms.</em></>} description="Each tick is one recorded step. The one with fewer steps finishes first." actions={<button type="button" className="btn" onClick={() => setSeed(seed + 1)}>New data</button>} />
      <div className="card filters">
        <Field label="Left">{(x) => <select {...x} value={s.raceA} onChange={(e) => setS({ ...s, raceA: e.target.value })}>{sorts.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>}</Field>
        <Field label="Right">{(x) => <select {...x} value={s.raceB} onChange={(e) => setS({ ...s, raceB: e.target.value })}>{sorts.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>}</Field>
        <Field label="Data">{(x) => <select {...x} value={s.preset} onChange={(e) => setS({ ...s, preset: e.target.value as Preset })}>{PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
        <Field label={`Size: ${s.size}`}>{(x) => <input {...x} type="range" min={5} max={64} value={s.size} onChange={(e) => setS({ ...s, size: Number(e.target.value) })} />}</Field>
      </div>
      <div className="grid-2">
        {[[s.raceA, A, doneA, fa], [s.raceB, B, doneB, fb]].map(([k, f, done, all], n) => (
          <section key={n} className={`card stack race ${done ? 'is-done' : ''}`} aria-label={name(k as string)}>
            <div className="row-between"><h2 className="h3">{name(k as string)}</h2>{done && <span className="badge badge-ok">Finished in {(all as Frame[]).length - 1} steps</span>}</div>
            <Bars frame={f as Frame} compact label={name(k as string)} />
            <p className="mono small" data-testid={`race-${n}`}>{(f as Frame).comparisons} comparisons · {(f as Frame).writes} writes</p>
          </section>
        ))}
      </div>
      <div className="card"><Controls p={p} /></div>
      {doneA && doneB && <Notice kind="success">{fa.length === fb.length ? 'A tie on steps.' : `${name(fa.length < fb.length ? s.raceA : s.raceB)} finished first — ${Math.abs(fa.length - fb.length)} fewer steps.`}</Notice>}
    </div>
  );
}

/* ---------- Compare ---------- */
function Compare() {
  const [n, setN] = useState(32);
  const [tip, setTip] = useState<string | null>(null);
  const sorts = SORTS;
  const data = useMemo(() => PRESETS.map(([k, label]) => ({ k, label, input: makeInput(n, k, mulberry(11)) })), [n]);
  const results = useMemo(() => sorts.map((a) => ({ a, counts: data.map((d) => run(a.key, d.input).at(-1)!.comparisons) })), [data, sorts]);
  const max = Math.max(...results.flatMap((r) => r.counts));
  const nn = n * n, nlogn = Math.round(n * Math.log2(n));
  return (
    <div className="stack">
      <PageHead eyebrow="Compare" title={<>Comparisons <em>by input shape.</em></>} description={`Measured by running each algorithm on ${n} values. For reference: n² = ${nn.toLocaleString()}, n log₂ n ≈ ${nlogn.toLocaleString()}.`} actions={<Field label="n">{(p) => <select {...p} value={n} onChange={(e) => setN(Number(e.target.value))}>{[16, 32, 64].map((v) => <option key={v}>{v}</option>)}</select>}</Field>} />
      <section className="card stack" aria-labelledby="cmp-t">
        <h2 id="cmp-t" className="h3">Comparisons made</h2>
        <div className="cmp-grid" onMouseLeave={() => setTip(null)}>
          <span />{data.map((d) => <span key={d.k} className="cmp-h small">{d.label}</span>)}
          {results.map((r) => (
            <div key={r.a.key} className="cmp-row">
              <span className="cmp-name">{r.a.name}</span>
              {r.counts.map((c, k) => { const text = `${r.a.name}, ${data[k].label}: ${c.toLocaleString()} comparisons`; return <span key={k} className="cmp-cell" tabIndex={0} aria-label={text} onMouseEnter={() => setTip(text)} onFocus={() => setTip(text)} onBlur={() => setTip(null)}><span className="cmp-bar" style={{ width: `${(c / max) * 100}%` }} /><span className="mono small">{c.toLocaleString()}</span></span>; })}
            </div>
          ))}
        </div>
        <p className="small" aria-live="polite">{tip ?? 'Bar length is relative to the largest count in the table.'}</p>
      </section>
      <div className="card">
        <div className="table-wrap"><table className="table">
          <caption className="sr-only">Complexity of each algorithm</caption>
          <thead><tr><th scope="col">Algorithm</th><th scope="col">Best</th><th scope="col">Average</th><th scope="col">Worst</th><th scope="col">Extra space</th><th scope="col">Stable</th></tr></thead>
          <tbody>{ALGOS.map((a) => <tr key={a.key}><th scope="row">{a.name}</th><td>{a.best}</td><td>{a.average}</td><td>{a.worst}</td><td>{a.space}</td><td>{a.stable == null ? '—' : a.stable ? 'Yes' : 'No'}</td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
