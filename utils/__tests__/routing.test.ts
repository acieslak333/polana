import { buildDeepLink, resolveDeepLink, resolveParam } from '../routing';

describe('buildDeepLink', () => {
  it('builds gromada link', () => {
    expect(buildDeepLink({ type: 'gromada', id: 'abc123' })).toBe('polana://gromada/abc123');
  });
  it('builds event link', () => {
    expect(buildDeepLink({ type: 'event', id: 'evt-1' })).toBe('polana://event/evt-1');
  });
  it('builds profile link', () => {
    expect(buildDeepLink({ type: 'profile', id: 'usr-99' })).toBe('polana://profile/usr-99');
  });
  it('builds invite link using code field', () => {
    expect(buildDeepLink({ type: 'invite', code: 'abc123def' })).toBe('polana://invite/abc123def');
  });
});

describe('resolveDeepLink', () => {
  it('resolves polana:// gromada', () => {
    expect(resolveDeepLink('polana://gromada/abc')).toEqual({ type: 'gromada', id: 'abc' });
  });
  it('resolves polana:// event', () => {
    expect(resolveDeepLink('polana://event/evt1')).toEqual({ type: 'event', id: 'evt1' });
  });
  it('resolves polana:// profile', () => {
    expect(resolveDeepLink('polana://profile/usr1')).toEqual({ type: 'profile', id: 'usr1' });
  });
  it('resolves polana:// invite', () => {
    expect(resolveDeepLink('polana://invite/code99')).toEqual({ type: 'invite', code: 'code99' });
  });
  it('resolves https://polana.app/ gromada', () => {
    expect(resolveDeepLink('https://polana.app/gromada/abc')).toEqual({ type: 'gromada', id: 'abc' });
  });
  it('returns null for unknown scheme', () => {
    expect(resolveDeepLink('https://example.com/gromada/abc')).toBeNull();
  });
  it('returns null for unknown path type', () => {
    expect(resolveDeepLink('polana://unknown/abc')).toBeNull();
  });
  it('returns null for malformed URL', () => {
    expect(resolveDeepLink('not-a-url')).toBeNull();
  });
  it('round-trips: buildDeepLink → resolveDeepLink', () => {
    const target = { type: 'gromada' as const, id: 'round-trip-id' };
    expect(resolveDeepLink(buildDeepLink(target))).toEqual(target);
  });
});

describe('resolveParam', () => {
  it('returns single string as-is', () => {
    expect(resolveParam('hello')).toBe('hello');
  });
  it('returns first element of array', () => {
    expect(resolveParam(['first', 'second'])).toBe('first');
  });
  it('returns empty string for undefined', () => {
    expect(resolveParam(undefined)).toBe('');
  });
  it('returns empty string for empty array', () => {
    expect(resolveParam([])).toBe('');
  });
});
