import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore/lite';
import { db } from '../firebase';
import { itemSchema, type Item, type ItemInput, type Status } from '../../types/item';
import { getCached, getStale, setCached, clearCache, TTL } from '../cache';
import { canRead, recordReads } from '../readBudget';
import { meterRead } from '../readMeter';
import type { ItemsRepo, ListResult } from './types';

const PAGE_SIZE = 12;

function parseFirestoreDoc(id: string, data: DocumentData): Item {
  const createdAtMs =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toMillis()
      : typeof data.createdAt === 'number'
      ? data.createdAt
      : Date.now();

  const updatedAtMs =
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toMillis()
      : typeof data.updatedAt === 'number'
      ? data.updatedAt
      : Date.now();

  return itemSchema.parse({
    ...data,
    id,
    createdAt: createdAtMs,
    updatedAt: updatedAtMs,
  });
}

export const firestoreRepo: ItemsRepo = {
  async list({ category, cursor }): Promise<ListResult> {
    const cursorKey = cursor ? String(cursor) : 'first';
    const cacheKey = category
      ? `items:list:${category}:${cursorKey}`
      : `items:list:all:${cursorKey}`;

    // 1. Try cache
    const cached = getCached<ListResult>(cacheKey, TTL.list);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // 2. Check read budget
    if (!canRead(PAGE_SIZE)) {
      const stale = getStale<ListResult>(cacheKey);
      if (stale) {
        return { ...stale, fromCache: true };
      }
      throw new Error('Daily read budget reached. Showing saved list if available.');
    }

    try {
      let snap;
      try {
        // If category is provided, use the compound index (category + status + createdAt)
        // If no category, omit orderBy to avoid requiring a composite index, then sort in memory
        const constraints = [
          ...(category ? [where('category', '==', category)] : []),
          where('status', 'in', ['available', 'reserved']),
          ...(category ? [orderBy('createdAt', 'desc')] : []),
          ...(cursor && category ? [startAfter(Timestamp.fromMillis(cursor))] : []),
          limit(PAGE_SIZE),
        ];

        const q = query(collection(db, 'items'), ...constraints);
        snap = await getDocs(q);
      } catch (queryErr: unknown) {
        const errObj = queryErr as { code?: string; message?: string };
        // Fallback for missing composite index
        if (
          errObj?.code === 'failed-precondition' ||
          errObj?.message?.includes('index')
        ) {
          console.warn('[Firestore] Index missing for compound order; falling back to memory sort.');
          const fallbackQ = query(
            collection(db, 'items'),
            ...(category ? [where('category', '==', category)] : []),
            where('status', 'in', ['available', 'reserved']),
            limit(PAGE_SIZE)
          );
          snap = await getDocs(fallbackQ);
        } else {
          throw queryErr;
        }
      }

      const readCount = snap.docs.length;
      recordReads(readCount);
      meterRead(readCount, `list:${category ?? 'all'}`);

      const items: Item[] = snap.docs
        .map(d => parseFirestoreDoc(d.id, d.data()))
        .sort((a, b) => b.createdAt - a.createdAt);

      const nextCursor =
        snap.docs.length === PAGE_SIZE ? items[items.length - 1].createdAt : null;

      const result: ListResult = { items, nextCursor, fromCache: false };
      setCached(cacheKey, result);

      // Pre-cache individual items for free detail view
      for (const item of items) {
        setCached(`items:detail:${item.id}`, item);
      }

      return result;
    } catch (err) {
      const stale = getStale<ListResult>(cacheKey);
      if (stale) {
        return { ...stale, fromCache: true };
      }
      throw err;
    }
  },

  async get(id: string): Promise<Item | null> {
    const cacheKey = `items:detail:${id}`;
    const cached = getCached<Item>(cacheKey, TTL.item);
    if (cached) return cached;

    if (!canRead(1)) {
      const stale = getStale<Item>(cacheKey);
      if (stale) return stale;
      throw new Error('Daily read budget reached.');
    }

    try {
      const snap = await getDoc(doc(db, 'items', id));
      recordReads(1);
      meterRead(1, `get:${id}`);

      if (!snap.exists()) return null;

      const item = parseFirestoreDoc(snap.id, snap.data());
      setCached(cacheKey, item);
      return item;
    } catch (err) {
      const stale = getStale<Item>(cacheKey);
      if (stale) return stale;
      throw err;
    }
  },

  async listAll(): Promise<Item[]> {
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    recordReads(snap.docs.length);
    meterRead(snap.docs.length, 'listAll');
    return snap.docs.map(d => parseFirestoreDoc(d.id, d.data()));
  },

  async create(input: ItemInput): Promise<string> {
    const data: Record<string, any> = {
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      status: input.status,
      images: input.images,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (typeof input.soldPrice === 'number' && input.soldPrice >= 0) {
      data.soldPrice = input.soldPrice;
    }
    if (input.translations) {
      data.translations = input.translations;
    }
    const docRef = await addDoc(collection(db, 'items'), data);
    clearCache();
    return docRef.id;
  },

  async update(id: string, input: ItemInput): Promise<void> {
    const data: Record<string, any> = {
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      status: input.status,
      images: input.images,
      updatedAt: serverTimestamp(),
    };
    if (typeof input.soldPrice === 'number' && input.soldPrice >= 0) {
      data.soldPrice = input.soldPrice;
    }
    if (input.translations) {
      data.translations = input.translations;
    }
    await updateDoc(doc(db, 'items', id), data);
    clearCache();
  },

  async setStatus(id: string, status: Status, soldPrice?: number): Promise<void> {
    const updates: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (status === 'sold' && typeof soldPrice === 'number' && soldPrice >= 0) {
      updates.soldPrice = soldPrice;
    }
    await updateDoc(doc(db, 'items', id), updates);
    clearCache();
  },

  async setSoldPrice(id: string, soldPrice: number | null): Promise<void> {
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    if (soldPrice === null || soldPrice === undefined || soldPrice < 0) {
      updates.soldPrice = deleteField();
    } else {
      updates.soldPrice = soldPrice;
    }
    await updateDoc(doc(db, 'items', id), updates);
    clearCache();
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'items', id));
    clearCache();
  },
};
