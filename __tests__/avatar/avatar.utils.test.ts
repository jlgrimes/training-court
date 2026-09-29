import { getAvatarSrc } from '@/components/avatar/avatar.utils';
import { fetchAvatarImages } from '@/components/avatar/avatar.server.utils';

describe('avatar image paths', () => {
  it.each([
    ['nate.png', '/assets/trainers/nate.png'],
    ['/assets/trainers/nate.png', '/assets/trainers/nate.png'],
    ['\\assets\\trainers\\nate.png', '/assets/trainers/nate.png'],
    ['https://example.com/nate.png', 'https://example.com/nate.png'],
    ['ace trainer.png', '/assets/trainers/ace trainer.png'],
  ])('resolves %s to a usable image URL', (stored, expected) => {
    expect(getAvatarSrc(stored)).toBe(expected);
  });

  it('returns public URLs regardless of the server operating system', () => {
    const images = fetchAvatarImages();
    expect(images).toContain('/assets/trainers/nate.png');
    expect(images.every(image => image.startsWith('/assets/trainers/') && !image.includes('\\'))).toBe(true);
  });

  it.each(fetchAvatarImages())(
    'loads %s as a static asset from every tournament route', (imagePath) => {
      const filename = imagePath.split('/').pop()!;
      for (const route of ['/tournaments', '/ptcg/tournaments', '/pocket/tournaments']) {
        const pageUrl = `https://example.com${route}/74f0efbb-35ca-482c-a2ad-6cfe402dbec9`;
        // Both stored filenames and full public paths must bypass dynamic routes.
        for (const storedValue of [filename, imagePath]) {
          const request = new URL(getAvatarSrc(storedValue), pageUrl);
          expect(decodeURIComponent(request.pathname)).toBe(imagePath);
          expect(request.origin).toBe('https://example.com');
        }
      }
    }
  );
});
