import type { ItemsRepo } from './types';

let repo: ItemsRepo | null = null;

export async function getRepo(): Promise<ItemsRepo> {
  if (repo) return repo;
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const { mockRepo } = await import('./mockRepo');
    repo = mockRepo;
  } else {
    const { firestoreRepo } = await import('./firestoreRepo');
    repo = firestoreRepo;
  }
  return repo;
}

export type { ItemsRepo } from './types';
