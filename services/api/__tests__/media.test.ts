import { supabase } from '@/services/supabase';
import { uploadPostImage, uploadAvatar } from '../media';

const STORAGE = supabase.storage.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('uploadPostImage', () => {
  it('uploads to post-media bucket and returns public URL', async () => {
    STORAGE.mockReturnValue({
      upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.example.com/u1/123.jpg' } })),
    });
    const url = await uploadPostImage('u1', 'file:///local/image.jpg');
    expect(url).toContain('storage.example.com');
    expect(STORAGE).toHaveBeenCalledWith('post-media');
  });

  it('throws when upload fails', async () => {
    STORAGE.mockReturnValue({
      upload: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Upload failed' } })),
      getPublicUrl: jest.fn(),
    });
    await expect(uploadPostImage('u1', 'file:///img.jpg')).rejects.toThrow();
  });

  it('throws when fetch of local URI fails', async () => {
    // fetch is not mocked in jest environment — it will fail
    STORAGE.mockReturnValue({
      upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://x.com/img.jpg' } })),
    });
    // The function tries to fetch the URI — will throw in test env
    await expect(uploadPostImage('u1', 'invalid-uri')).rejects.toThrow();
  });
});

describe('uploadAvatar', () => {
  it('uploads to avatars bucket with upsert=true', async () => {
    const uploadMock = jest.fn(() => Promise.resolve({ data: {}, error: null }));
    STORAGE.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.example.com/u1/avatar.jpg' } })),
    });
    const url = await uploadAvatar('u1', 'file:///avatar.jpg');
    expect(url).toContain('avatar');
    expect(STORAGE).toHaveBeenCalledWith('avatars');
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining('avatar'),
      expect.anything(),
      expect.objectContaining({ upsert: true }),
    );
  });
});
