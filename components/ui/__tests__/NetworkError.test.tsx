import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NetworkError } from '../NetworkError';

describe('NetworkError', () => {
  it('renders offline banner text', () => {
    const { getByText } = render(<NetworkError onRetry={jest.fn()} />);
    // useTranslation mock returns the key — check for the key
    expect(getByText('common:offline_banner')).toBeTruthy();
  });

  it('renders retry button', () => {
    const { getByText } = render(<NetworkError onRetry={jest.fn()} />);
    expect(getByText('common:offline_retry')).toBeTruthy();
  });

  it('calls onRetry when retry is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<NetworkError onRetry={onRetry} />);
    fireEvent.press(getByText('common:offline_retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has accessibilityRole="alert" on the container', () => {
    const { getByRole } = render(<NetworkError onRetry={jest.fn()} />);
    expect(getByRole('alert')).toBeTruthy();
  });
});
