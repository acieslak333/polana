// Typed Supabase client mock — shared across all test files.
// Individual tests override specific methods via jest.spyOn or mockResolvedValueOnce.

type QueryResult<T> = { data: T | null; error: null | { message: string; code: string } };

// Chainable query builder mock
function makeChain<T = unknown>(defaultResult: QueryResult<T>) {
  const result = { ...defaultResult };
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'in', 'is', 'not', 'or', 'and', 'filter',
    'order', 'limit', 'range', 'maybeSingle',
  ];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  // terminal: .single() and direct await
  chain['single'] = jest.fn(() => Promise.resolve(result));
  chain['maybeSingle'] = jest.fn(() => Promise.resolve({ data: result.data ?? null, error: null }));
  chain['then'] = (resolve: (v: QueryResult<T>) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

const storageFileMock = {
  upload: jest.fn(() => Promise.resolve({ data: { path: 'test/path.jpg' }, error: null })),
  getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.example.com/test/path.jpg' } })),
  remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

export const supabase = {
  from: jest.fn((table: string) => {
    void table;
    return makeChain({ data: [], error: null });
  }),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    updateUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    exchangeCodeForSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  },
  storage: {
    from: jest.fn(() => storageFileMock),
  },
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
};
