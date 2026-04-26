import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Silence React's error boundary console.error output in tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error from component');
  return <Text testID="child">Child content</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('renders fallback UI when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('common:error_boundary_title')).toBeTruthy();
  });

  it('renders custom fallbackLabel when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallbackLabel="Niestandardowy błąd">
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Niestandardowy błąd')).toBeTruthy();
  });

  it('renders retry button in fallback state', () => {
    const { getByRole } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('resets error state on retry press', () => {
    // After pressing retry, hasError=false → children render again
    // Use a component that only throws the first time
    let throwCount = 0;
    function ConditionalThrow() {
      if (throwCount === 0) { throwCount++; throw new Error('First render error'); }
      return <Text testID="recovered">Recovered</Text>;
    }

    const { getByRole, getByTestId } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );
    // Currently showing error state — press retry
    fireEvent.press(getByRole('button'));
    expect(getByTestId('recovered')).toBeTruthy();
  });
});
