import { DEFAULT_CHILD_PROFILE } from "../constants/schema.js";
import {
  normalizeChildProfile,
  normalizeFutureLetter,
  normalizeMemory,
} from "../utils/schema.js";

export const DB_NAME = "khobaukyuc_db_v1";
export const DB_VERSION = 3;
const MEMORY_STORE = "memories";
const PROFILE_STORE = "profiles";
const LETTER_STORE = "futureLetters";

let db;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;
      let memoryStore;
      if (!database.objectStoreNames.contains(MEMORY_STORE)) {
        memoryStore = database.createObjectStore(MEMORY_STORE, { keyPath: "id" });
      } else {
        memoryStore = transaction.objectStore(MEMORY_STORE);
      }
      let profileStore;
      if (!database.objectStoreNames.contains(PROFILE_STORE)) {
        profileStore = database.createObjectStore(PROFILE_STORE, { keyPath: "id" });
      } else {
        profileStore = transaction.objectStore(PROFILE_STORE);
      }
      if (!database.objectStoreNames.contains(LETTER_STORE)) {
        database.createObjectStore(LETTER_STORE, { keyPath: "id" });
      }
      profileStore.put(normalizeChildProfile(DEFAULT_CHILD_PROFILE));
      memoryStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) return;
        cursor.update(normalizeMemory(cursor.value));
        cursor.continue();
      };
    };
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database upgrade is blocked by another open tab"));
  });
}

function objectStore(storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

export function getAllMemories() {
  return new Promise((resolve, reject) => {
    const request = objectStore(MEMORY_STORE).getAll();
    request.onsuccess = () => resolve((request.result || []).map(normalizeMemory));
    request.onerror = () => reject(request.error);
  });
}

export function putMemory(memory) {
  return new Promise((resolve, reject) => {
    const request = objectStore(MEMORY_STORE, "readwrite").put(normalizeMemory(memory));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function deleteMemory(id) {
  return new Promise((resolve, reject) => {
    const request = objectStore(MEMORY_STORE, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getAllProfiles() {
  return new Promise((resolve, reject) => {
    const request = objectStore(PROFILE_STORE).getAll();
    request.onsuccess = () =>
      resolve((request.result || []).map(normalizeChildProfile));
    request.onerror = () => reject(request.error);
  });
}

export function putProfile(profile) {
  return new Promise((resolve, reject) => {
    const request = objectStore(PROFILE_STORE, "readwrite").put(
      normalizeChildProfile(profile),
    );
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getAllFutureLetters() {
  return new Promise((resolve, reject) => {
    const request = objectStore(LETTER_STORE).getAll();
    request.onsuccess = () =>
      resolve((request.result || []).map(normalizeFutureLetter));
    request.onerror = () => reject(request.error);
  });
}

export function putFutureLetter(letter) {
  return new Promise((resolve, reject) => {
    const request = objectStore(LETTER_STORE, "readwrite").put(
      normalizeFutureLetter(letter),
    );
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function deleteFutureLetter(id) {
  return new Promise((resolve, reject) => {
    const request = objectStore(LETTER_STORE, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function importData(memories, profiles, futureLetters = []) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [MEMORY_STORE, PROFILE_STORE, LETTER_STORE],
      "readwrite",
    );
    const memoryStore = transaction.objectStore(MEMORY_STORE);
    const profileStore = transaction.objectStore(PROFILE_STORE);
    const letterStore = transaction.objectStore(LETTER_STORE);
    for (const profile of profiles) profileStore.put(normalizeChildProfile(profile));
    for (const memory of memories) memoryStore.put(normalizeMemory(memory));
    for (const letter of futureLetters) {
      letterStore.put(normalizeFutureLetter(letter));
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
