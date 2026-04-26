import React from 'react';
import { render } from '@testing-library/react-native';
import { WarmthIndicator } from '../WarmthIndicator';

describe('WarmthIndicator', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <WarmthIndicator meetingsThisMonth={0} favorsExchanged={0} memberCount={0} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('shows ❄️ for cold gromada (score 0)', () => {
    const { getByText } = render(
      <WarmthIndicator meetingsThisMonth={0} favorsExchanged={0} memberCount={0} />
    );
    expect(getByText('❄️')).toBeTruthy();
  });

  it('shows 🌱 for low warmth (score ~10)', () => {
    // score = 1*3 + 0*2 + 3 = 6  → 🌱
    const { getByText } = render(
      <WarmthIndicator meetingsThisMonth={1} favorsExchanged={0} memberCount={3} />
    );
    expect(getByText('🌱')).toBeTruthy();
  });

  it('shows 🌿 for medium warmth (score ~50)', () => {
    // score = 10*3 + 5*2 + 10 = 50
    const { getByText } = render(
      <WarmthIndicator meetingsThisMonth={10} favorsExchanged={5} memberCount={10} />
    );
    expect(getByText('🌿')).toBeTruthy();
  });

  it('shows 🔥 for high warmth (score ≥ 80)', () => {
    // score = 20*3 + 10*2 + 20 = 100
    const { getByText } = render(
      <WarmthIndicator meetingsThisMonth={20} favorsExchanged={10} memberCount={20} />
    );
    expect(getByText('🔥')).toBeTruthy();
  });

  it('renders in compact mode without crashing', () => {
    const { toJSON } = render(
      <WarmthIndicator meetingsThisMonth={5} favorsExchanged={2} memberCount={8} compact />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('caps score at 100', () => {
    // Very active gromada — score should not exceed 100
    const { getByText } = render(
      <WarmthIndicator meetingsThisMonth={100} favorsExchanged={100} memberCount={100} />
    );
    expect(getByText('🔥')).toBeTruthy();
  });
});
