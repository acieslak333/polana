// Shared helpers for building Supabase chainable mock responses.
// Usage:
//   (supabase.from as jest.Mock).mockReturnValueOnce(mockSuccess([post]));
//   (supabase.from as jest.Mock).mockReturnValueOnce(mockError('duplicate', '23505'));

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'in', 'is', 'not', 'or', 'and', 'filter',
  'order', 'limit', 'range',
] as const;

type Chain = Record<string, jest.Mock> & {
  then: <T>(resolve: (v: { data: unknown; error: null | { message: string; code: string } }) => T) => Promise<T>;
};

function buildChain(result: { data: unknown; error: null | { message: string; code: string } }): Chain {
  const chain = {} as Chain;
  CHAIN_METHODS.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain['single'] = jest.fn(() => Promise.resolve(result));
  chain['maybeSingle'] = jest.fn(() => Promise.resolve({ data: result.data ?? null, error: null }));
  chain['then'] = (resolve) => Promise.resolve(result).then(resolve);
  return chain;
}

export function mockSuccess<T>(data: T): Chain {
  return buildChain({ data, error: null });
}

export function mockError(message: string, code = 'UNKNOWN'): Chain {
  return buildChain({ data: null, error: { message, code } });
}

export function mockSingle<T>(data: T): Chain {
  const chain = buildChain({ data, error: null });
  // Override single() to return the item directly (not wrapped in array)
  chain['single'] = jest.fn(() => Promise.resolve({ data, error: null }));
  return chain;
}
