import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PostCard } from '../PostCard';
import { makePost } from '@/__fixtures__';

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'author-1' } }),
}));

// PostCard uses ActionSheetIOS and Alert for the menu — mock them
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    ActionSheetIOS: { showActionSheetWithOptions: jest.fn() },
    Alert: { alert: jest.fn() },
  };
});

const mockReact = jest.fn();
const mockDelete = jest.fn();

describe('PostCard', () => {
  it('renders post content', () => {
    const post = makePost({ content: 'Hello Gromada!' });
    const { getByText } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    expect(getByText('Hello Gromada!')).toBeTruthy();
  });

  it('renders author name', () => {
    const post = makePost({
      author_id: 'author-1',
      profiles: { id: 'author-1', first_name: 'Alice', nickname: null, avatar_config: {} },
    });
    const { getByText } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders single image when media_urls has one item', () => {
    const post = makePost({ media_urls: ['https://storage.example.com/img1.jpg'] });
    const { UNSAFE_getAllByType } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('renders up to 4 images in grid', () => {
    const post = makePost({
      media_urls: [
        'https://x.com/1.jpg',
        'https://x.com/2.jpg',
        'https://x.com/3.jpg',
        'https://x.com/4.jpg',
        'https://x.com/5.jpg', // 5th should be ignored
      ],
    });
    const { UNSAFE_getAllByType } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);
    // Avatar image + up to 4 media images = max 5, but we cap at 4 media
    expect(images.length).toBeLessThanOrEqual(5);
  });

  it('renders without media when media_urls is empty', () => {
    const post = makePost({ media_urls: [] });
    const { toJSON } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders reaction bar', () => {
    const post = makePost({ reactions: [{ emoji: '❤️', user_id: 'u2' }] });
    const { getByText } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    expect(getByText('❤️')).toBeTruthy();
  });

  it('renders ⋯ menu button for own post', () => {
    const post = makePost({ author_id: 'author-1' });
    const { toJSON } = render(
      <PostCard post={post} onReact={mockReact} onDelete={mockDelete} />
    );
    const json = JSON.stringify(toJSON());
    expect(json).toContain('⋯');
  });
});
