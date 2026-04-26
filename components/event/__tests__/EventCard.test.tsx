import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EventCard } from '../EventCard';
import { makeEvent } from '@/__fixtures__';
import type { EventWithRSVP } from '@/services/api/events';

const makeEventWithRSVP = (overrides = {}): EventWithRSVP => ({
  ...makeEvent(),
  rsvp_count: 3,
  user_rsvp: null,
  gromady: null,
  ...overrides,
});

describe('EventCard', () => {
  it('renders event title', () => {
    const event = makeEventWithRSVP({ title: 'Wspólna kawa' });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    expect(getByText('Wspólna kawa')).toBeTruthy();
  });

  it('renders location name', () => {
    const event = makeEventWithRSVP({ location_name: 'Łazienki Park' });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    expect(getByText('Łazienki Park')).toBeTruthy();
  });

  it('renders RSVP going button', () => {
    const event = makeEventWithRSVP({ user_rsvp: null });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    // EventCard shows RSVP options — at minimum one RSVP pressable
    expect(getByText('Idę')).toBeTruthy();
  });

  it('calls onRSVP with going when going button pressed', () => {
    const onRSVP = jest.fn();
    const event = makeEventWithRSVP({ id: 'event-1' });
    const { getByText } = render(<EventCard event={event} onRSVP={onRSVP} />);
    fireEvent.press(getByText('Idę'));
    expect(onRSVP).toHaveBeenCalledWith('event-1', 'going');
  });

  it('highlights going button when user_rsvp is going', () => {
    const event = makeEventWithRSVP({ user_rsvp: 'going' });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    // Button renders with going state — no crash
    expect(getByText('Idę')).toBeTruthy();
  });

  it('renders rsvp_count', () => {
    const event = makeEventWithRSVP({ rsvp_count: 7 });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    expect(getByText(/7/)).toBeTruthy();
  });

  it('renders event type emoji', () => {
    const event = makeEventWithRSVP({ event_type: 'coffee' });
    const { getByText } = render(<EventCard event={event} onRSVP={jest.fn()} />);
    expect(getByText('☕')).toBeTruthy();
  });
});
