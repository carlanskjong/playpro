// =====================================================================
// Playpro settings: the only file you need to edit.
// Replace the values in quotes with your own keys (see README.md).
// These keys are safe to have in a website: the Supabase key only
// allows what the database rules in supabase/schema.sql allow.
// =====================================================================

export default {
  // Supabase -> Project Settings -> API (use the "anon" / "publishable" key)
  SUPABASE_URL: "https://ehcvlvcmvexyyqxbkyoo.supabase.co/rest/v1/",
  SUPABASE_ANON_KEY: "sb_publishable_CGmxmSKaOcWiyAXRtqvvdQ_TirSNK82",

  // themoviedb.org -> Settings -> API -> "API Key"
  TMDB_API_KEY: "ccf2943bb1806ea8b4812c2a88e67dab",

  // "Where to watch" data is for this country (Norway)
  COUNTRY: "NO",

  // Language for titles and descriptions, e.g. "en-US" or "nb-NO"
  LANGUAGE: "en-US",

  // Shown in the privacy notice. People must be able to contact you.
  OWNER_NAME: "Carl-Andreas Skjong",
  OWNER_EMAIL: "carlan.skjong@gmail.com",
};
