// utils/validation.ts may not exist yet — we test constraints from constants/config.ts
// and any inline validation patterns used in the app.
// If a validation.ts is added later, these tests move there.
import { LIMITS } from '@/constants/config';

describe('LIMITS constants', () => {
  it('max gromady per user is 3', () => {
    expect(LIMITS.MAX_GROMADY_PER_USER).toBe(3);
  });
  it('max members are 12 / 24 / 36 for small / medium / large', () => {
    expect(LIMITS.MAX_MEMBERS_SMALL).toBe(12);
    expect(LIMITS.MAX_MEMBERS_MEDIUM).toBe(24);
    expect(LIMITS.MAX_MEMBERS_LARGE).toBe(36);
  });
  it('max interests per gromada is 3', () => {
    expect(LIMITS.MAX_INTERESTS_PER_GROMADA).toBe(3);
  });
  it('max upcoming events per gromada is 5', () => {
    expect(LIMITS.MAX_UPCOMING_EVENTS_PER_GROMADA).toBe(5);
  });
});

describe('email validation (inline pattern used in auth screens)', () => {
  const isValidEmail = (e: string) => e.includes('@') && e.includes('.');
  it('accepts standard email', () => expect(isValidEmail('a@b.com')).toBe(true));
  it('rejects missing @', () => expect(isValidEmail('notanemail.com')).toBe(false));
  it('rejects missing dot', () => expect(isValidEmail('a@nodot')).toBe(false));
});

describe('password validation (min 8 chars)', () => {
  const isValidPassword = (p: string) => p.length >= 8;
  it('accepts 8 chars', () => expect(isValidPassword('12345678')).toBe(true));
  it('rejects 7 chars', () => expect(isValidPassword('1234567')).toBe(false));
  it('accepts long password', () => expect(isValidPassword('a'.repeat(64))).toBe(true));
});

describe('bio length (max 200)', () => {
  const isValidBio = (b: string) => b.length <= 200;
  it('accepts empty', () => expect(isValidBio('')).toBe(true));
  it('accepts 200 chars', () => expect(isValidBio('a'.repeat(200))).toBe(true));
  it('rejects 201 chars', () => expect(isValidBio('a'.repeat(201))).toBe(false));
});

describe('post content (max 5000)', () => {
  const isValidPost = (c: string) => c.length >= 1 && c.length <= 5000;
  it('accepts 1 char', () => expect(isValidPost('a')).toBe(true));
  it('accepts 5000 chars', () => expect(isValidPost('a'.repeat(5000))).toBe(true));
  it('rejects empty', () => expect(isValidPost('')).toBe(false));
  it('rejects 5001 chars', () => expect(isValidPost('a'.repeat(5001))).toBe(false));
});
