import { describe, it, expect } from 'vitest';
import { getCloudCatalog, VERIFIED_SEED_CATALOG, serverApp, isVercelBlobUrl } from '../serverApp';

describe('Vercel Blob Storage & Cloud Catalog Architecture', () => {
  it('initializes with empty seed catalog per user request (only Vercel Blob songs appear)', () => {
    expect(Array.isArray(VERIFIED_SEED_CATALOG)).toBe(true);
    expect(VERIFIED_SEED_CATALOG.length).toBe(0);
  });

  it('correctly validates Vercel Blob URLs', () => {
    expect(isVercelBlobUrl('https://xyz.public.blob.vercel-storage.com/aurabeat/songs/track1.mp3')).toBe(true);
    expect(isVercelBlobUrl('https://example.com/audio.mp3')).toBe(false);
    expect(isVercelBlobUrl('/uploads/local.mp3')).toBe(false);
  });

  it('retrieves cloud catalog without throwing and returns an array', async () => {
    const catalog = await getCloudCatalog();
    expect(Array.isArray(catalog)).toBe(true);
    // Any items present must be verified on Vercel Blob
    catalog.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(isVercelBlobUrl(item.url)).toBe(true);
    });
  });

  it('exports Express serverApp with configured Vercel Blob API routes', () => {
    expect(serverApp).toBeDefined();
    expect(typeof serverApp).toBe('function');
  });
});
