// =====================================================================
// FEATURE SWITCHBOARD
//
// Each line below switches on one feature.
//   - To switch a feature OFF: put // in front of its line.
//   - To add a new feature: copy the folder js/features/_template,
//     rename it, and add a line here. See docs/FEATURES.md.
// =====================================================================

import "./features/tonight/index.js";         // "What should we watch tonight?" ticket on the home screen
import "./features/nowstreaming/index.js";    // Watchlist titles that arrived on your services
import "./features/streaming/index.js";       // Norwegian streaming: where to watch, your services, Browse page
import "./features/discover/index.js";        // Trending banner and rows, cast, "more like this"
import "./features/recommendations/index.js"; // "Picked for you", from what you rated highly
import "./features/upcoming/index.js";        // Coming to your services, newest on your services
import "./features/cinema/index.js";          // Norwegian cinemas: showing now, premieres, showtimes and tickets
import "./features/search/index.js";          // Search page
import "./features/mylist/index.js";          // Watchlist, "seen it" and your 1-10 ratings
import "./features/lists/index.js";           // Your own lists, shared with friends
import "./features/stats/index.js";           // "Your year": what you watched, per month and genre
import "./features/importer/index.js";        // Bring your ratings from IMDb or Letterboxd
import "./features/friends/index.js";         // Friends, their ratings, comments and reactions (needs mylist)
import "./features/share/index.js";           // Share button on title pages
import "./features/invites/index.js";         // Administrator: create personal invite codes in Settings
import "./features/profilepicture/index.js";  // Upload a profile picture in Settings
import "./features/imdb/index.js";            // IMDb ratings on posters and title pages (needs the ratings import)
import "./features/rottentomatoes/index.js";  // Rotten Tomatoes score via Wikidata (needs the ratings import)
