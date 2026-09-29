// =====================================================================
// FEATURE SWITCHBOARD
//
// Each line below switches on one feature.
//   - To switch a feature OFF: put // in front of its line.
//   - To add a new feature: copy the folder js/features/_template,
//     rename it, and add a line here. See docs/FEATURES.md.
// =====================================================================

import "./features/streaming/index.js"; // Norwegian streaming: where to watch, your services, Browse page
import "./features/discover/index.js";  // Home hero + trending rows, cast, "more like this"
import "./features/search/index.js";    // Search page
import "./features/mylist/index.js";    // Watchlist, "seen it" + your 1-10 ratings
import "./features/friends/index.js";   // Friends, their ratings, activity feed (needs mylist)
import "./features/imdb/index.js";      // IMDb ratings on posters and title pages (needs the ratings import)
import "./features/rottentomatoes/index.js"; // Rotten Tomatoes score via Wikidata (needs the ratings import)
