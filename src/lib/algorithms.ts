/* Algorithms instrumented to record every comparison and write as a frame. */

export interface Frame {
  array: number[];
  compare: number[];
  write: number[];
  sorted: number[];
  pivot: number | null;
  range: [number, number] | null;
  line: number; // pseudo-code line
  note: string;
  comparisons: number;
  writes: number;
}

export interface AlgoInfo {
  key: string;
  name: string;
  kind: 'sort' | 'search';
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean | null;
  code: string[];
  blurb: string;
}

class Recorder {
  frames: Frame[] = [];
  comparisons = 0;
  writes = 0;
  sorted = new Set<number>();
  constructor(public a: number[]) {
    this.snap({ line: 0, note: 'Start' });
  }
  snap(p: Partial<Omit<Frame, 'array' | 'sorted' | 'comparisons' | 'writes'>>) {
    this.frames.push({ array: [...this.a], compare: [], write: [], pivot: null, range: null, line: 0, note: '', ...p, sorted: [...this.sorted].sort((x, y) => x - y), comparisons: this.comparisons, writes: this.writes });
  }
  less(i: number, j: number, line: number, extra: Partial<Frame> = {}) {
    this.comparisons++;
    const r = this.a[i] < this.a[j];
    this.snap({ compare: [i, j], line, note: `Compare ${this.a[i]} and ${this.a[j]}`, ...extra });
    return r;
  }
  swap(i: number, j: number, line: number, extra: Partial<Frame> = {}) {
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.writes += 2;
    this.snap({ write: [i, j], line, note: `Swap ${this.a[j]} and ${this.a[i]}`, ...extra });
  }
  set(i: number, v: number, line: number, extra: Partial<Frame> = {}) {
    this.a[i] = v;
    this.writes++;
    this.snap({ write: [i], line, note: `Write ${v} at position ${i}`, ...extra });
  }
  done(note = 'Sorted') {
    this.a.forEach((_, i) => this.sorted.add(i));
    this.snap({ note, line: -1 });
    return this.frames;
  }
}

export function bubble(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  const n = r.a.length;
  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      if (r.less(i + 1, i, 2)) { r.swap(i, i + 1, 3); swapped = true; }
    }
    r.sorted.add(end);
    if (!swapped) { for (let k = 0; k < end; k++) r.sorted.add(k); r.snap({ note: 'No swaps in this pass — already sorted', line: 4 }); break; }
  }
  return r.done();
}

export function insertion(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  for (let i = 1; i < r.a.length; i++) {
    let j = i;
    while (j > 0 && r.less(j, j - 1, 2)) { r.swap(j, j - 1, 3); j--; }
  }
  return r.done();
}

export function selection(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  const n = r.a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) if (r.less(j, min, 3, { pivot: min })) min = j;
    if (min !== i) r.swap(i, min, 4);
    r.sorted.add(i);
  }
  return r.done();
}

export function merge(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  const sort = (lo: number, hi: number) => {
    if (hi - lo < 1) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    const left = r.a.slice(lo, mid + 1), right = r.a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      r.comparisons++;
      r.snap({ compare: [lo + i, mid + 1 + j], range: [lo, hi], line: 4, note: `Merge: compare ${left[i]} and ${right[j]}` });
      if (left[i] <= right[j]) r.set(k++, left[i++], 5, { range: [lo, hi] });
      else r.set(k++, right[j++], 6, { range: [lo, hi] });
    }
    while (i < left.length) r.set(k++, left[i++], 7, { range: [lo, hi] });
    while (j < right.length) r.set(k++, right[j++], 7, { range: [lo, hi] });
  };
  sort(0, r.a.length - 1);
  return r.done();
}

export function quick(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) { if (lo === hi) r.sorted.add(lo); return; }
    const p = r.a[hi];
    let i = lo;
    r.snap({ pivot: hi, range: [lo, hi], line: 2, note: `Pivot ${p} (last element)` });
    for (let j = lo; j < hi; j++) {
      if (r.less(j, hi, 4, { pivot: hi, range: [lo, hi] })) { if (i !== j) r.swap(i, j, 5, { pivot: hi, range: [lo, hi] }); i++; }
    }
    if (i !== hi) r.swap(i, hi, 6, { pivot: i, range: [lo, hi] });
    r.sorted.add(i);
    sort(lo, i - 1);
    sort(i + 1, hi);
  };
  sort(0, r.a.length - 1);
  return r.done();
}

export function heap(input: number[]): Frame[] {
  const r = new Recorder([...input]);
  const n = r.a.length;
  const sift = (start: number, end: number) => {
    let root = start;
    for (;;) {
      const child = 2 * root + 1;
      if (child > end) return;
      let big = child;
      if (child + 1 <= end && r.less(child, child + 1, 3)) big = child + 1;
      if (r.less(root, big, 4)) { r.swap(root, big, 5); root = big; } else return;
    }
  };
  for (let s = Math.floor(n / 2) - 1; s >= 0; s--) sift(s, n - 1);
  for (let end = n - 1; end > 0; end--) {
    r.swap(0, end, 7);
    r.sorted.add(end);
    sift(0, end - 1);
  }
  return r.done();
}

export function linearSearch(input: number[], target: number): Frame[] {
  const r = new Recorder([...input]);
  for (let i = 0; i < r.a.length; i++) {
    r.comparisons++;
    r.snap({ compare: [i], line: 2, note: `Is ${r.a[i]} equal to ${target}?` });
    if (r.a[i] === target) { r.sorted.add(i); r.snap({ note: `Found ${target} at position ${i}`, line: 3 }); return r.frames; }
  }
  r.snap({ note: `${target} is not in the list`, line: 4 });
  return r.frames;
}

/** Binary search; the input is sorted first (and that is shown as the starting state). */
export function binarySearch(input: number[], target: number): Frame[] {
  const r = new Recorder([...input].sort((a, b) => a - b));
  let lo = 0, hi = r.a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    r.comparisons++;
    r.snap({ compare: [mid], range: [lo, hi], line: 3, note: `Middle of ${lo}–${hi} is ${r.a[mid]}` });
    if (r.a[mid] === target) { r.sorted.add(mid); r.snap({ range: [mid, mid], note: `Found ${target} at position ${mid}`, line: 4 }); return r.frames; }
    if (r.a[mid] < target) { lo = mid + 1; r.snap({ range: [lo, hi], note: `${r.a[mid]} < ${target}: search the right half`, line: 5 }); }
    else { hi = mid - 1; r.snap({ range: [lo, hi], note: `${r.a[mid]} > ${target}: search the left half`, line: 6 }); }
  }
  r.snap({ note: `${target} is not in the list`, line: 7 });
  return r.frames;
}

export const ALGOS: AlgoInfo[] = [
  { key: 'bubble', name: 'Bubble sort', kind: 'sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, blurb: 'Repeatedly swaps neighbours that are out of order; stops early if a pass makes no swaps.', code: ['bubbleSort(a):', '  for end = n−1 down to 1:', '    for i = 0 to end−1:', '      if a[i+1] < a[i]: swap', '    if no swaps: stop early'] },
  { key: 'insertion', name: 'Insertion sort', kind: 'sort', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true, blurb: 'Takes each element and slides it left into place — fast on nearly sorted data.', code: ['insertionSort(a):', '  for i = 1 to n−1:', '    while j > 0 and a[j] < a[j−1]:', '      swap a[j], a[j−1]; j−−'] },
  { key: 'selection', name: 'Selection sort', kind: 'sort', best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false, blurb: 'Finds the smallest remaining element and puts it next — few swaps, many comparisons.', code: ['selectionSort(a):', '  for i = 0 to n−2:', '    min = i', '    for j = i+1 to n−1: if a[j] < a[min]: min = j', '    swap a[i], a[min]'] },
  { key: 'merge', name: 'Merge sort', kind: 'sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true, blurb: 'Splits the list in half, sorts each half, then merges them in order.', code: ['mergeSort(lo, hi):', '  mid = (lo + hi) / 2', '  mergeSort(lo, mid); mergeSort(mid+1, hi)', '  merge:', '    compare heads of both halves', '    take left if ≤ right', '    otherwise take right', '    copy any leftovers'] },
  { key: 'quick', name: 'Quicksort (Lomuto)', kind: 'sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false, blurb: 'Picks a pivot, moves smaller items before it, then sorts each side. Worst case on already sorted input with this pivot choice.', code: ['quickSort(lo, hi):', '  if lo ≥ hi: return', '  pivot = a[hi]; i = lo', '  for j = lo to hi−1:', '    if a[j] < pivot:', '      swap a[i], a[j]; i++', '  swap a[i], a[hi]; recurse on both sides'] },
  { key: 'heap', name: 'Heapsort', kind: 'sort', best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false, blurb: 'Builds a max-heap, then repeatedly moves the largest item to the end.', code: ['heapSort(a):', '  build max-heap', '  sift down:', '    pick larger child', '    if root < child:', '      swap, continue down', '  repeat:', '    swap a[0] with last; shrink heap; sift down'] },
  { key: 'linear', name: 'Linear search', kind: 'search', best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)', stable: null, blurb: 'Checks each element in turn. Works on unsorted data.', code: ['linearSearch(a, x):', '  for i = 0 to n−1:', '    if a[i] == x:', '      return i', '  return not found'] },
  { key: 'binary', name: 'Binary search', kind: 'search', best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)', stable: null, blurb: 'Halves a sorted list each step. The list is sorted first.', code: ['binarySearch(a, x):', '  lo = 0; hi = n−1', '  while lo ≤ hi:', '    mid = (lo + hi) / 2', '    if a[mid] == x: return mid', '    if a[mid] < x: lo = mid + 1', '    else: hi = mid − 1', '  return not found'] },
];

export function run(key: string, input: number[], target = 0): Frame[] {
  switch (key) {
    case 'bubble': return bubble(input);
    case 'insertion': return insertion(input);
    case 'selection': return selection(input);
    case 'merge': return merge(input);
    case 'quick': return quick(input);
    case 'heap': return heap(input);
    case 'linear': return linearSearch(input, target);
    case 'binary': return binarySearch(input, target);
    default: throw new Error(`Unknown algorithm ${key}`);
  }
}

export type Preset = 'random' | 'sorted' | 'reversed' | 'nearly' | 'few';
export function makeInput(n: number, preset: Preset, rand: () => number = Math.random): number[] {
  const base = Array.from({ length: n }, (_, i) => Math.round(5 + (i * 90) / Math.max(1, n - 1)));
  if (preset === 'sorted') return base;
  if (preset === 'reversed') return [...base].reverse();
  if (preset === 'few') return Array.from({ length: n }, () => [20, 45, 70, 95][Math.floor(rand() * 4)]);
  const a = [...base];
  const swaps = preset === 'nearly' ? Math.max(1, Math.floor(n / 10)) : n * 2;
  for (let s = 0; s < swaps; s++) { const i = Math.floor(rand() * n), j = preset === 'nearly' ? Math.min(n - 1, i + 1) : Math.floor(rand() * n); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function parseInput(text: string): { values?: number[]; error?: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length < 2) return { error: 'Enter at least two numbers.' };
  if (parts.length > 64) return { error: 'Use at most 64 numbers so the bars stay readable.' };
  const values = parts.map(Number);
  if (values.some((v) => !Number.isFinite(v))) return { error: 'Use numbers only, separated by commas or spaces.' };
  if (values.some((v) => v < 0 || v > 999)) return { error: 'Keep values between 0 and 999.' };
  return { values };
}
