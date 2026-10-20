import { Song } from '../types';

/**
 * Creator published songs that are bundled with the web app build
 * so they are immediately available on Vercel, Netlify, and all static deployments
 * without requiring a running Node.js backend.
 */
export const BUNDLED_PUBLISHED_SONGS: Song[] = [
  {
    id: 'local_1792434880509_wnas',
    title: 'Kitab Haryanvi',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 182,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792493437569,
  },
  {
    id: 'local_1792436226002_l5on',
    title: 'Alphuliya',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 259,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792492801391,
  },
  {
    id: 'local_1792436238277_idhk',
    title: 'Tiposi Mon',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 253,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792492761373,
  },
  {
    id: 'local_1792491453038_66e8',
    title: 'Tuk Dekhi Mur Ga (PenduJatt.Com.Se)',
    artist: 'My Local Music',
    album: 'Uploaded Tracks',
    duration: 274,
    genre: 'Custom Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    isCloudShared: true,
    addedAt: 1792491759152,
  },
];
