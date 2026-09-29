// =====================================================================
// Playpro settings: the only file you need to edit.
// Replace the values in quotes with your own keys (see README.md).
// These keys are safe to have in a website: the Supabase key only
// allows what the database rules in supabase/schema.sql allow.
// =====================================================================

export default {
  // Supabase -> Project Settings -> API (use the "anon" / "publishable" key)
  SUPABASE_URL: "https://YOUR-PROJECT-ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-SUPABASE-ANON-OR-PUBLISHABLE-KEY",

  // themoviedb.org -> Settings -> API -> "API Key"
  TMDB_API_KEY: "YOUR-TMDB-API-KEY",

  // Optional: shows IMDb ratings. Free key from omdbapi.com (leave "" to hide)
  OMDB_API_KEY: "",

  // "Where to watch" data is for this country (Norway)
  COUNTRY: "NO",

  // Language for titles and descriptions, e.g. "en-US" or "nb-NO"
  LANGUAGE: "en-US",

  // Shown in the privacy notice. People must be able to contact you.
  OWNER_NAME: "Your Name",
  OWNER_EMAIL: "you@example.com",
};
