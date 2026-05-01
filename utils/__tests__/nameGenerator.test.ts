import { generateGromadaName } from '../nameGenerator';

describe('generateGromadaName', () => {
  it('returns a non-empty string for pl', () => {
    expect(generateGromadaName('pl')).toBeTruthy();
  });

  it('returns a non-empty string for en', () => {
    const name = generateGromadaName('en');
    expect(name).toBeTruthy();
    expect(name.split(' ').length).toBeGreaterThanOrEqual(3);
  });

  it('returns a non-empty string for uk', () => {
    expect(generateGromadaName('uk')).toBeTruthy();
  });

  it('falls back for unknown language', () => {
    expect(generateGromadaName('de')).toBeTruthy();
  });

  it('defaults to pl', () => {
    expect(generateGromadaName()).toBeTruthy();
  });

  it('returns different names across calls', () => {
    const names = new Set(Array.from({ length: 20 }, () => generateGromadaName('en')));
    expect(names.size).toBeGreaterThan(1);
  });
});
