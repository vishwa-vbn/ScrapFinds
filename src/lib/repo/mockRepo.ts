import type { Item, ItemInput, Status } from '../../types/item';
import type { ItemsRepo, ListResult } from './types';

const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

// 10 diverse seeded items
const initialItems: Item[] = [
  {
    id: 'mock-1',
    title: 'Vintage Philips Wooden Stereo Radio',
    description: 'Classic AM/FM radio receiver in solid wood casing. Audio output is clear and tested. Minor cosmetic scuffs on top panel.',
    category: 'audio',
    condition: 'good',
    status: 'available',
    images: [{ url: '/mock/placeholder-1.svg', fileId: 'mock-file-1' }],
    createdAt: now - 1 * hour,
    updatedAt: now - 1 * hour,
  },
  {
    id: 'mock-2',
    title: 'Samsung Galaxy M31 (6GB/128GB) - Working',
    description: 'Black colour, factory reset, cameras and speaker working fine. Battery backup is around 1 full day. No cracks on screen.',
    category: 'phones',
    condition: 'good',
    status: 'available',
    images: [{ url: '/mock/placeholder-2.svg', fileId: 'mock-file-2' }],
    createdAt: now - 3 * hour,
    updatedAt: now - 3 * hour,
  },
  {
    id: 'mock-3',
    title: 'Hero Sprint 26T Mountain Bicycle',
    description: 'Single-speed MTB with front suspension and dual wire brakes. Tires have good tread left. Needs light chain lubrication.',
    category: 'bicycles',
    condition: 'fair',
    status: 'available',
    images: [
      { url: '/mock/placeholder-3.svg', fileId: 'mock-file-3a' },
      { url: '/mock/placeholder-4.svg', fileId: 'mock-file-3b' },
    ],
    createdAt: now - 6 * hour,
    updatedAt: now - 6 * hour,
  },
  {
    id: 'mock-4',
    title: 'Sony Bluetooth Party Speaker SRS-XB13',
    description: 'Compact portable waterproof speaker with extra bass. Original strap included. Tested and holds battery for 12 hours.',
    category: 'audio',
    condition: 'like_new',
    status: 'reserved',
    images: [{ url: '/mock/placeholder-5.svg', fileId: 'mock-file-4' }],
    createdAt: now - 12 * hour,
    updatedAt: now - 2 * hour,
  },
  {
    id: 'mock-5',
    title: 'Dell 22-inch Full HD LED Monitor',
    description: 'IPS panel with HDMI and VGA ports. Comes with power adapter and HDMI cable. Zero dead pixels, excellent for home office.',
    category: 'electronics',
    condition: 'good',
    status: 'available',
    images: [{ url: '/mock/placeholder-6.svg', fileId: 'mock-file-5' }],
    createdAt: now - 1 * day,
    updatedAt: now - 1 * day,
  },
  {
    id: 'mock-6',
    title: 'Bajaj Mixer Grinder 500W with 3 Jars',
    description: 'Heavy duty motor running smoothly. Includes chutney jar, dry grinding jar, and wet liquidizing jar. All lids intact.',
    category: 'appliances',
    condition: 'good',
    status: 'available',
    images: [{ url: '/mock/placeholder-7.svg', fileId: 'mock-file-6' }],
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: 'mock-7',
    title: 'Solid Teak Wood Coffee Table',
    description: 'Sturdy vintage square coffee table. Solid teak legs and polished surface with glass top inlay. Minor wear on edges.',
    category: 'furniture',
    condition: 'fair',
    status: 'available',
    images: [{ url: '/mock/placeholder-8.svg', fileId: 'mock-file-7' }],
    createdAt: now - 3 * day,
    updatedAt: now - 3 * day,
  },
  {
    id: 'mock-8',
    title: 'Bosch 500W Electric Drill Kit',
    description: 'Variable speed impact drill in original hard carrying case. Includes auxiliary handle and depth gauge. Motor runs strong.',
    category: 'tools',
    condition: 'like_new',
    status: 'available',
    images: [{ url: '/mock/placeholder-9.svg', fileId: 'mock-file-8' }],
    createdAt: now - 4 * day,
    updatedAt: now - 4 * day,
  },
  {
    id: 'mock-9',
    title: 'Hercules Adult Commuter Cycle with Carrier',
    description: 'Steel frame road cycle with rear cargo rack. Front brake pad needs replacement and pedal has slight wobble.',
    category: 'bicycles',
    condition: 'needs_repair',
    status: 'available',
    images: [{ url: '/mock/placeholder-10.svg', fileId: 'mock-file-9' }],
    createdAt: now - 5 * day,
    updatedAt: now - 5 * day,
  },
  {
    id: 'mock-10',
    title: 'Prestige Induction Cooktop 1900W',
    description: 'Touch control cooktop. Push buttons responsive, glass surface clean without cracks. Tested for heating water quickly.',
    category: 'appliances',
    condition: 'needs_repair',
    status: 'sold',
    soldPrice: 850,
    images: [{ url: '/mock/placeholder-7.svg', fileId: 'mock-file-10' }],
    createdAt: now - 6 * day,
    updatedAt: now - 1 * day,
  },
  {
    id: 'mock-11',
    title: 'Sony Wireless Bluetooth Headphones',
    description: 'Over-ear headphones with active noise cancellation. Clean ear pads, battery holds charge for 15+ hours.',
    category: 'audio',
    condition: 'good',
    status: 'sold',
    soldPrice: 1800,
    images: [{ url: '/mock/placeholder-1.svg', fileId: 'mock-file-11' }],
    createdAt: now - 7 * day,
    updatedAt: now - 2 * day,
  },
];

let itemsStore: Item[] = [...initialItems];

export const mockRepo: ItemsRepo = {
  async list({ category, cursor }): Promise<ListResult> {
    // Filter visible statuses: available and reserved
    let filtered = itemsStore.filter(i => i.status === 'available' || i.status === 'reserved');
    if (category) {
      filtered = filtered.filter(i => i.category === category);
    }
    // Sort desc by createdAt
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (cursor) {
      filtered = filtered.filter(i => i.createdAt < cursor);
    }

    const PAGE_SIZE = 12;
    const pageItems = filtered.slice(0, PAGE_SIZE);
    const hasMore = filtered.length > PAGE_SIZE;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].createdAt : null;

    return {
      items: pageItems,
      nextCursor,
      fromCache: false,
    };
  },

  async get(id: string): Promise<Item | null> {
    const item = itemsStore.find(i => i.id === id);
    return item ? { ...item } : null;
  },

  async listAll(): Promise<Item[]> {
    return [...itemsStore].sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(input: ItemInput): Promise<string> {
    const id = 'mock-' + Date.now();
    const timestamp = Date.now();
    const newItem: Item = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    itemsStore.unshift(newItem);
    return id;
  },

  async update(id: string, input: ItemInput): Promise<void> {
    const idx = itemsStore.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    itemsStore[idx] = {
      ...input,
      id,
      createdAt: itemsStore[idx].createdAt,
      updatedAt: Date.now(),
    };
  },

  async setStatus(id: string, status: Status, soldPrice?: number): Promise<void> {
    const idx = itemsStore.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    itemsStore[idx] = {
      ...itemsStore[idx],
      status,
      soldPrice: status === 'sold' && typeof soldPrice === 'number' ? soldPrice : itemsStore[idx].soldPrice,
      updatedAt: Date.now(),
    };
  },

  async setSoldPrice(id: string, soldPrice: number | null): Promise<void> {
    const idx = itemsStore.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    const updated = { ...itemsStore[idx], updatedAt: Date.now() };
    if (soldPrice === null || soldPrice === undefined || soldPrice < 0) {
      delete updated.soldPrice;
    } else {
      updated.soldPrice = soldPrice;
    }
    itemsStore[idx] = updated;
  },

  async remove(id: string): Promise<void> {
    itemsStore = itemsStore.filter(i => i.id !== id);
  },
};
