import { generateGromadaName } from '../nameGenerator';

describe('generateGromadaName', () => {
  it('returns a string of exactly 3 space-separated words', () => {
    const name = generateGromadaName();
    const parts = name.split(' ');
    expect(parts).toHaveLength(3);
    parts.forEach((p) => expect(p.length).toBeGreaterThan(0));
  });

  it('produces different values across multiple calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateGromadaName()));
    // With 18×18×15 = 4860 combinations, 20 draws should give > 1 unique value
    expect(names.size).toBeGreaterThan(1);
  });

  it('returns only Polish characters in the output', () => {
    for (let i = 0; i < 10; i++) {
      const name = generateGromadaName();
      expect(name).toMatch(/^[\wÀ-ſ\s]+$/);
    }
  });
});
