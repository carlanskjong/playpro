// Shared app state (who is logged in, their profile and their list).
export const state = {
  session: null,
  profile: null,
  entries: new Map(), // "movie:123" -> entry row
  avatars: new Map(), // username -> profile picture (filled by the profilepicture feature)
};

export const entryKey = (type, id) => `${type}:${id}`;

export function myEntry(type, id) {
  return state.entries.get(entryKey(type, id)) || null;
}
