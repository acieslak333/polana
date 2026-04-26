import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button label="Press me" />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('has accessibilityRole="button"', () => {
    const { getByRole } = render(<Button label="OK" />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Disabled" disabled onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { getByTestId, queryByText, UNSAFE_getByType } = render(
      <Button label="Loading" loading />
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Loading" loading onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders all 4 variants without crashing', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'destructive'] as const) {
      const { getByText } = render(<Button label={variant} variant={variant} />);
      expect(getByText(variant)).toBeTruthy();
    }
  });

  it('renders all 3 sizes without crashing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { getByText } = render(<Button label={size} size={size} />);
      expect(getByText(size)).toBeTruthy();
    }
  });
});
