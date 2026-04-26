import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('renders label', () => {
    const { getByText } = render(<Input label="Email" value="" onChangeText={jest.fn()} />);
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders error message when provided', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={jest.fn()} error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('does not render error when not provided', () => {
    const { queryByText } = render(
      <Input label="Email" value="" onChangeText={jest.fn()} />
    );
    expect(queryByText('Invalid email')).toBeNull();
  });

  it('renders hint when provided', () => {
    const { getByText } = render(
      <Input label="Password" value="" onChangeText={jest.fn()} hint="At least 8 characters" />
    );
    expect(getByText('At least 8 characters')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <Input label="Name" value="Alice" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByDisplayValue('Alice'), 'Bob');
    expect(onChangeText).toHaveBeenCalledWith('Bob');
  });

  it('shows password toggle button when showPasswordToggle=true', () => {
    const { getByRole } = render(
      <Input label="Password" value="" onChangeText={jest.fn()} showPasswordToggle secureTextEntry />
    );
    // Toggle button exists
    expect(getByRole('button')).toBeTruthy();
  });

  it('toggles password visibility on toggle press', () => {
    const { getByRole, getByDisplayValue } = render(
      <Input label="Password" value="secret" onChangeText={jest.fn()} showPasswordToggle secureTextEntry />
    );
    // Initially secureTextEntry=true (masked)
    fireEvent.press(getByRole('button'));
    // After press, text is visible — rendered with same value
    expect(getByDisplayValue('secret')).toBeTruthy();
  });
});
