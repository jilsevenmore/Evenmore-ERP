/**
 * proofFileStore — blob storage for design proofs picked off the user's device.
 *
 * The project store persists to localStorage, which is far too small for real
 * drawings, so only the file's metadata (name, size, type, fileKey) rides along
 * on the document record. The bytes live here, in IndexedDB, under that key.
 *
 * IndexedDB is same-origin and survives a reload, which is what lets a generated
 * approval link open the actual drawing in a new tab. Every call resolves rather
 * than throws — a missing or blocked database degrades to the schematic preview.
 */

const DB_NAME = 'evenmore-pms-proofs';
const DB_VERSION = 1;
const STORE = 'files';

function openDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'fileKey' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function runTransaction(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        let tx;
        try {
          tx = db.transaction(STORE, mode);
        } catch {
          db.close();
          resolve(null);
          return;
        }
        let result = null;
        const request = work(tx.objectStore(STORE));
        if (request) request.onsuccess = () => { result = request.result ?? null; };
        tx.oncomplete = () => { db.close(); resolve(result); };
        tx.onerror = () => { db.close(); resolve(null); };
        tx.onabort = () => { db.close(); resolve(null); };
      })
  );
}

/** A key for a freshly picked file. Doubles as the IndexedDB primary key. */
export function makeFileKey() {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `pf_${random.slice(0, 24)}`;
}

/** Store a File/Blob. Resolves true when the bytes actually landed. */
export async function putProofFile(fileKey, file) {
  if (!fileKey || !file) return false;
  const record = {
    fileKey,
    blob: file,
    fileName: file.name ?? 'proof',
    mimeType: file.type || 'application/octet-stream',
    size: file.size ?? 0,
    storedAt: new Date().toISOString(),
  };
  // store.put resolves with the record's key, so a null here means it failed.
  const outcome = await runTransaction('readwrite', (store) => store.put(record));
  return outcome !== null;
}

/** The stored record, or null when nothing was attached (or storage is unavailable). */
export async function getProofFile(fileKey) {
  if (!fileKey) return null;
  return runTransaction('readonly', (store) => store.get(fileKey));
}

export async function deleteProofFile(fileKey) {
  if (!fileKey) return;
  await runTransaction('readwrite', (store) => store.delete(fileKey));
}

/** Human-readable size for the metadata strip. */
export function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** How the viewer should render a given file. */
export function previewKindFor(mimeType, fileName = '') {
  const type = String(mimeType || '').toLowerCase();
  const name = String(fileName || '').toLowerCase();
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) return 'image';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return 'file';
}
