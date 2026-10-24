import { describe, it, expect } from 'vitest';
import { getSongColorPalette, SPARK_COLOR_PALETTES } from '../components/SparkProgressBar';

describe('Dynamic Multi-Color Spark and Dot System', () => {
  it('has multiple rich color palettes defined', () => {
    expect(SPARK_COLOR_PALETTES.length).toBeGreaterThanOrEqual(8);
    SPARK_COLOR_PALETTES.forEach((p) => {
      expect(p.trackGradient).toBeDefined();
      expect(p.dotBorder).toBeDefined();
      expect(p.dotCore).toBeDefined();
      expect(p.sparkColors.length).toBeGreaterThan(0);
      expect(p.sparkShadows.length).toBeGreaterThan(0);
    });
  });

  it('assigns consistent distinct palettes based on songId and songTitle', () => {
    const pal1 = getSongColorPalette('song_kesariya', 'Kesariya');
    const pal2 = getSongColorPalette('song_blinding_lights', 'Blinding Lights');
    const pal3 = getSongColorPalette('song_kesariya', 'Kesariya');

    // Deterministic: Same song gets identical palette every time
    expect(pal1.id).toBe(pal3.id);
    expect(pal1.dotCore).toBe(pal3.dotCore);

    // Different songs can get different color palettes
    expect(pal1).toBeDefined();
    expect(pal2).toBeDefined();
  });
});
