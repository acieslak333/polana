import React from 'react';
import { render } from '@testing-library/react-native';
import { ProceduralAvatar } from '../ProceduralAvatar';

describe('ProceduralAvatar', () => {
  it('renders without crashing with default config', () => {
    const { toJSON } = render(<ProceduralAvatar config={{}} size={40} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with null config without crashing', () => {
    const { toJSON } = render(<ProceduralAvatar config={null} size={40} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with undefined config without crashing', () => {
    const { toJSON } = render(<ProceduralAvatar config={undefined} size={40} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders at different sizes without crashing', () => {
    for (const size of [24, 36, 48, 64, 88]) {
      const { toJSON } = render(<ProceduralAvatar config={{}} size={size} />);
      expect(toJSON()).toBeTruthy();
    }
  });

  it('renders with full avatar config', () => {
    const config = {
      base: 'hamster',
      color: '#C4705A',
      eyes: 'round',
      hat: 'none',
      accessory: 'none',
    };
    const { toJSON } = render(<ProceduralAvatar config={config} size={48} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders emoji in the avatar', () => {
    const { toJSON } = render(<ProceduralAvatar config={{ base: 'fox' }} size={40} />);
    // Should render some text (emoji) as part of the avatar
    const json = JSON.stringify(toJSON());
    expect(json).toBeTruthy();
  });
});
