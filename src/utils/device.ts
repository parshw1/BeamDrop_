import { DeviceType } from '../types';

export function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

const ADJECTIVES = [
  'Swift', 'Cosmic', 'Solar', 'Hyper', 'Neon', 'Lunar', 'Turbo', 'Breezy',
  'Zenith', 'Echo', 'Apex', 'Velox', 'Aurora', 'Vortex', 'Quasar', 'Sonic'
];

const NOUNS = [
  'Falcon', 'Fox', 'Otter', 'Cheetah', 'Osprey', 'Comet', 'Lynx', 'Dolphin',
  'Hawk', 'Panda', 'Ray', 'Eagle', 'Badger', 'Wolf', 'Panther', 'Spark'
];

export function generatePeerName(deviceType: DeviceType): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const typeLabel = deviceType === 'mobile' ? 'Phone' : deviceType === 'tablet' ? 'Pad' : 'Desk';
  return `${adj} ${noun} (${typeLabel})`;
}

export function generatePeerId(): string {
  return 'peer_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

export function generateRoomId(): string {
  // 6 uppercase alphanumeric characters (easy to type or speak aloud)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
