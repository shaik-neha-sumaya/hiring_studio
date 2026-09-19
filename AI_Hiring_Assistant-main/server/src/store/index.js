import { config } from '../config/env.js';
import { createFileStore } from './fileStore.js';
import { createMongoStore } from './mongoStore.js';

let store = null;

export async function initStore() {
  if (store) return store;

  if (config.mongo.enabled) {
    try {
      store = await createMongoStore(config.mongo);
    } catch (error) {
      console.warn(`[store] MongoDB unreachable (${error.message}); using local file store instead.`);
    }
  }

  store ??= await createFileStore({ dataDir: config.dataDir });
  return store;
}

const lazy = (name) => {
  const handle = () => {
    if (!store) throw new Error('Store accessed before initStore()');
    return store.collection(name);
  };
  return new Proxy({}, { get: (_target, method) => (...args) => handle()[method](...args) });
};

export const users = lazy('users');
export const roles = lazy('roles');
export const candidates = lazy('candidates');
export const interviews = lazy('interviews');
export const knowledgeDocs = lazy('knowledgeDocs');

export const storeKind = () => store?.kind ?? 'uninitialised';
export const closeStore = () => store?.close();
