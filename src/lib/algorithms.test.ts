import { describe, expect, it } from 'vitest';
import { ALGOS, binarySearch, bubble, insertion, linearSearch, makeInput, parseInput, run, selection } from './algorithms';

const sample = [5, 1, 4, 2, 8, 2, 9, 0, 7];
const sorted = [...sample].sort((a, b) => a - b);

describe('sorting algorithms', () => {
  for (const a of ALGOS.filter((x) => x.kind === 'sort')) {
    it(`${a.name} sorts and ends with every index marked sorted`, () => {
      const frames = run(a.key, sample);
      const last = frames[frames.length - 1];
      expect(last.array).toEqual(sorted);
      expect(last.sorted).toEqual(sample.map((_, i) => i));
      expect(frames[0].array).toEqual(sample);
      expect(frames.every((f) => f.array.length === sample.length)).toBe(true);
    });
  }
  it('handles empty, single and duplicate-only inputs', () => {
    for (const a of ALGOS.filter((x) => x.kind === 'sort')) {
      expect(run(a.key, []).at(-1)!.array).toEqual([]);
      expect(run(a.key, [3]).at(-1)!.array).toEqual([3]);
      expect(run(a.key, [2, 2, 2]).at(-1)!.array).toEqual([2, 2, 2]);
    }
  });
});

describe('counting', () => {
  it('bubble sort stops after one pass on sorted input', () => {
    const f = bubble([1, 2, 3, 4, 5]).at(-1)!;
    expect(f.comparisons).toBe(4);
    expect(f.writes).toBe(0);
  });
  it('matches textbook comparison counts', () => {
    expect(selection([5, 4, 3, 2, 1]).at(-1)!.comparisons).toBe(10); // n(n−1)/2
    expect(insertion([5, 4, 3, 2, 1]).at(-1)!.comparisons).toBe(10);
    expect(insertion([1, 2, 3, 4, 5]).at(-1)!.comparisons).toBe(4);
  });
  it('counts never decrease between frames', () => {
    const f = run('quick', sample);
    for (let i = 1; i < f.length; i++) { expect(f[i].comparisons).toBeGreaterThanOrEqual(f[i - 1].comparisons); expect(f[i].writes).toBeGreaterThanOrEqual(f[i - 1].writes); }
  });
});

describe('searching', () => {
  it('linear search finds the first match or reports absence', () => {
    expect(linearSearch(sample, 2).at(-1)!.note).toBe('Found 2 at position 3');
    expect(linearSearch(sample, 6).at(-1)!.note).toBe('6 is not in the list');
  });
  it('binary search sorts first and halves the range', () => {
    const f = binarySearch(sample, 7);
    expect(f[0].array).toEqual(sorted);
    expect(f.at(-1)!.note).toMatch(/Found 7 at position 6/);
    expect(f.at(-1)!.comparisons).toBeLessThanOrEqual(Math.ceil(Math.log2(sample.length + 1)));
    expect(binarySearch(sample, 3).at(-1)!.note).toBe('3 is not in the list');
  });
});

describe('inputs', () => {
  it('builds preset inputs of the requested size', () => {
    expect(makeInput(5, 'sorted')).toEqual([5, 28, 50, 73, 95]);
    expect(makeInput(5, 'reversed')).toEqual([95, 73, 50, 28, 5]);
    expect(makeInput(20, 'random', () => 0.3)).toHaveLength(20);
    expect(new Set(makeInput(30, 'few', Math.random)).size).toBeLessThanOrEqual(4);
  });
  it('parses custom input with helpful errors', () => {
    expect(parseInput('3, 1 2')).toEqual({ values: [3, 1, 2] });
    expect(parseInput('3').error).toMatch(/at least two/);
    expect(parseInput('a b').error).toMatch(/numbers only/);
    expect(parseInput('1 1000').error).toMatch(/0 and 999/);
  });
});
