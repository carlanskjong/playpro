// Shared app state (who is logged in, their profile and their list).
export const state = {
  session: null,
  profile: null,
  entries: new Map(), // "movie:123" -> entry row
  avatars: new Map(), // username -> profile picture (filled by the profilepicture feature)
  nowStreaming: new Set(), // "movie:123" on your watchlist and on one of your services (nowstreaming feature)
  tappedPoster: null, // { href, src } of the poster just tapped, so the title page can open with it (view transition)
};

export const entryKey = (type, id) => `${type}:${id}`;

export function myEntry(type, id) {
  return state.entries.get(entryKey(type, id)) || null;
}
