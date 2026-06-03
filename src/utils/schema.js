import {
  CHILD_PROFILE_SCHEMA_VERSION,
  DEFAULT_BACKUP_STATUS,
  DEFAULT_CHILD_PROFILE,
  FUTURE_LETTER_SCHEMA_VERSION,
  MEMORY_SCHEMA_VERSION,
} from "../constants/schema.js";

export function normalizeChildProfile(profile = {}) {
  const now = Date.now();
  return {
    ...profile,
    id: profile.id || DEFAULT_CHILD_PROFILE.id,
    name: profile.name || DEFAULT_CHILD_PROFILE.name,
    createdAt: profile.createdAt || now,
    updatedAt: profile.updatedAt || now,
    schemaVersion: CHILD_PROFILE_SCHEMA_VERSION,
  };
}

export function normalizeFutureLetter(letter = {}) {
  const now = Date.now();
  const createdAt = letter.createdAt || letter.created_at || now;
  return {
    ...letter,
    id: letter.id || `letter_${now}`,
    schemaVersion: FUTURE_LETTER_SCHEMA_VERSION,
    childId: letter.childId || DEFAULT_CHILD_PROFILE.id,
    title: letter.title || "Thu gui con tuong lai",
    targetAge: letter.targetAge || "",
    targetDate: letter.targetDate || "",
    body: letter.body || "",
    createdAt,
    updatedAt: letter.updatedAt || letter.updated_at || createdAt,
  };
}

export function normalizeMemory(memory = {}) {
  const now = Date.now();
  const createdAt = memory.createdAt || memory.created_at || now;
  const updatedAt = memory.updatedAt || memory.updated_at || createdAt;
  return {
    ...memory,
    schemaVersion: MEMORY_SCHEMA_VERSION,
    childId: memory.childId || DEFAULT_CHILD_PROFILE.id,
    parentNote: memory.parentNote || "",
    childQuote: memory.childQuote || "",
    location: memory.location || "",
    people: Array.isArray(memory.people) ? memory.people : [],
    backupStatus: memory.backupStatus || DEFAULT_BACKUP_STATUS,
    createdAt,
    updatedAt,
  };
}
