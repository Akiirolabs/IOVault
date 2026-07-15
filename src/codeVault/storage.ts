import type { CodeFile } from "./types";

const DB_NAME = "io-vault-code";
const DB_VERSION = 1;
const FILE_STORE = "files";
const MAX_CACHE_BYTES = 25 * 1024 * 1024;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        const store = db.createObjectStore(FILE_STORE, { keyPath: "id" });
        store.createIndex("workspaceId", "workspaceId");
        store.createIndex("lastOpenedAt", "lastOpenedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listWorkspaceFiles(workspaceId: string): Promise<CodeFile[]> {
  const db = await openDatabase();
  const tx = db.transaction(FILE_STORE, "readonly");
  const files = await requestResult(tx.objectStore(FILE_STORE).index("workspaceId").getAll(workspaceId));
  db.close();
  return files.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export async function saveCodeFile(file: CodeFile): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(FILE_STORE, "readwrite");
  tx.objectStore(FILE_STORE).put(file);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await evictCleanFiles();
}

export async function deleteCodeFile(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(FILE_STORE, "readwrite");
  tx.objectStore(FILE_STORE).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function evictCleanFiles() {
  const db = await openDatabase();
  const tx = db.transaction(FILE_STORE, "readwrite");
  const store = tx.objectStore(FILE_STORE);
  const files = await requestResult(store.getAll());
  let size = files.reduce((total, file) => total + file.content.length * 2, 0);
  if (size > MAX_CACHE_BYTES) {
    const candidates = files.filter((file) => !file.dirty).sort((a, b) => a.lastOpenedAt - b.lastOpenedAt);
    for (const file of candidates) {
      if (size <= MAX_CACHE_BYTES) break;
      store.delete(file.id);
      size -= file.content.length * 2;
    }
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

