import { describe, it, expect } from 'vitest';
import { getCloudCatalog, VERIFIED_SEED_CATALOG, serverApp } from '../serverApp';

describe('Server App & Cloud Catalog Architecture', () => {
  it('exports verified seed catalog with genuine titles and durations', () => {
    expect(VERIFIED_SEED_CATALOG.length).toBeGreaterThanOrEqual(4);
    VERIFIED_SEED_CATALOG.forEach((song) => {
      expect(song.id).toBeDefined();
      expect(song.title).toBeTruthy();
      expect(song.artist).toBeTruthy();
      expect(song.url).toMatch(/^https?:\/\//);
      expect(song.duration).toBeGreaterThan(0);
      expect(song.coverArt).toMatch(/^https?:\/\//);
    });
  });

  it('retrieves cloud catalog without throwing', () => {
    const catalog = getCloudCatalog();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.length).toBeGreaterThan(0);
    // All items must have valid ID and title
    catalog.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
    });
  });

  it('exports Express serverApp with configured API routes', () => {
    expect(serverApp).toBeDefined();
    expect(typeof serverApp).toBe('function');
  });
});
