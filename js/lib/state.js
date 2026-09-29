// Shared app state (who is logged in, their profile and their list).
export const state = {
  session: null,
  profile: null,
  entries: new Map(), // "movie:123" -> entry row
};

export const entryKey = (type, id) => `${type}:${id}`;

export function myEntry(type, id) {
  return state.entries.get(entryKey(type, id)) || null;
}
