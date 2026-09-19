import fs from 'node:fs/promises';
import path from 'node:path';
import { newId } from '../lib/ids.js';

/**
 * Zero-dependency persistence so the project runs on a fresh machine without a
 * database. Deliberately small: shallow equality filters and whole-file writes
 * are all this app's access patterns need.
 */
export async function createFileStore({ dataDir }) {
  await fs.mkdir(dataDir, { recursive: true });

  const cache = new Map();
  const writeQueue = new Map();

  const fileFor = (name) => path.join(dataDir, `${name}.json`);

  async function load(name) {
    if (cache.has(name)) return cache.get(name);
    let rows = [];
    try {
      rows = JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
      if (!Array.isArray(rows)) rows = [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    cache.set(name, rows);
    return rows;
  }

  // Serialise writes per collection and swap via rename so a crash mid-write
  // cannot leave a half-written file behind.
  function persist(name) {
    const previous = writeQueue.get(name) ?? Promise.resolve();
    const next = previous.then(async () => {
      const target = fileFor(name);
      const temp = `${target}.tmp`;
      await fs.writeFile(temp, JSON.stringify(cache.get(name) ?? [], null, 2), 'utf8');
      await fs.rename(temp, target);
    });
    writeQueue.set(name, next.catch(() => {}));
    return next;
  }

  const matches = (row, filter) =>
    Object.entries(filter).every(([key, value]) =>
      Array.isArray(value) ? value.includes(row[key]) : row[key] === value,
    );

  const sortRows = (rows, sort) => {
    if (!sort) return rows;
    const [[key, direction]] = Object.entries(sort);
    return [...rows].sort((a, b) => {
      if (a[key] === b[key]) return 0;
      return (a[key] > b[key] ? 1 : -1) * (direction < 0 ? -1 : 1);
    });
  };

  return {
    kind: 'file',
    collection(name) {
      return {
        async insert(doc) {
          const rows = await load(name);
          const record = { _id: doc._id ?? newId(), ...doc };
          rows.push(record);
          await persist(name);
          return record;
        },
        async find(filter = {}, { sort } = {}) {
          const rows = await load(name);
          return sortRows(rows.filter((row) => matches(row, filter)), sort);
        },
        async findOne(filter = {}) {
          const rows = await load(name);
          return rows.find((row) => matches(row, filter)) ?? null;
        },
        async findById(id) {
          const rows = await load(name);
          return rows.find((row) => row._id === id) ?? null;
        },
        async updateById(id, patch) {
          const rows = await load(name);
          const index = rows.findIndex((row) => row._id === id);
          if (index === -1) return null;
          rows[index] = { ...rows[index], ...patch };
          await persist(name);
          return rows[index];
        },
        async deleteById(id) {
          const rows = await load(name);
          const index = rows.findIndex((row) => row._id === id);
          if (index === -1) return false;
          rows.splice(index, 1);
          await persist(name);
          return true;
        },
        async deleteMany(filter = {}) {
          const rows = await load(name);
          const kept = rows.filter((row) => !matches(row, filter));
          const removed = rows.length - kept.length;
          cache.set(name, kept);
          await persist(name);
          return removed;
        },
      };
    },
    async close() {
      await Promise.all([...writeQueue.values()]);
    },
  };
}
