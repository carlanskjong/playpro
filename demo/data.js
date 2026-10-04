// Sample catalogue for the demo and the automatic tests. Ratings, dates and
// Norwegian availability are illustrative, not live data.

export const PROVIDERS = [
  { id: 8, name: "Netflix", hue: 0 },
  { id: 1899, name: "Max", hue: 250 },
  { id: 76, name: "Viaplay", hue: 330 },
  { id: 2269, name: "TV 2 Play", hue: 210 },
  { id: 2270, name: "NRK TV", hue: 195 },
  { id: 337, name: "Disney+", hue: 225 },
  { id: 119, name: "Prime Video", hue: 200 },
  { id: 1773, name: "SkyShowtime", hue: 280 },
  { id: 350, name: "Apple TV+", hue: 0, mono: true },
  { id: 2, name: "Apple TV Store", hue: 0, mono: true, store: true },
  { id: 3, name: "Google Play", hue: 140, store: true },
  { id: 423, name: "SF Anytime", hue: 20, store: true },
  { id: 424, name: "Blockbuster", hue: 45, store: true },
];

const RENT = [2, 3, 423];

// [id, type, title, year, genres, tmdb, imdb, runtime|seasons, stream[], overview, cast[[name, role]], hue, popularity]
const RAW = [
  [693134, "movie", "Dune: Part Two", 2024, [878, 12], 8.1, 8.5, 166, [1899], "Paul Atreides joins the Fremen and seeks revenge against the conspirators who destroyed his family, while trying to prevent a terrible future only he can foresee.", [["Timothée Chalamet", "Paul Atreides"], ["Zendaya", "Chani"], ["Rebecca Ferguson", "Lady Jessica"], ["Javier Bardem", "Stilgar"], ["Austin Butler", "Feyd-Rautha"], ["Florence Pugh", "Princess Irulan"]], 32, 98],
  [872585, "movie", "Oppenheimer", 2023, [18, 36], 8.1, 8.3, 180, [76], "The story of J. Robert Oppenheimer and the race to build the atomic bomb, and what it cost the man who led it.", [["Cillian Murphy", "J. Robert Oppenheimer"], ["Emily Blunt", "Kitty Oppenheimer"], ["Matt Damon", "Leslie Groves"], ["Robert Downey Jr.", "Lewis Strauss"], ["Florence Pugh", "Jean Tatlock"]], 18, 90],
  [792307, "movie", "Poor Things", 2023, [878, 10749, 35], 7.7, 7.8, 141, [337], "Brought back to life by an unorthodox scientist, Bella Baxter runs off on a whirlwind adventure across continents, free of the prejudices of her time.", [["Emma Stone", "Bella Baxter"], ["Mark Ruffalo", "Duncan Wedderburn"], ["Willem Dafoe", "Godwin Baxter"], ["Ramy Youssef", "Max McCandles"]], 300, 70],
  [660120, "movie", "The Worst Person in the World", 2021, [18, 10749, 35], 7.3, 7.7, 128, [8, 2270], "Four years and twelve chapters in the life of Julie, who navigates love and tries to find her path in Oslo.", [["Renate Reinsve", "Julie"], ["Anders Danielsen Lie", "Aksel"], ["Herbert Nordrum", "Eivind"]], 350, 55],
  [1124620, "movie", "Sentimental Value", 2025, [18], 7.9, 8.0, 133, [], "Sisters Nora and Agnes reunite with their estranged father, a once-celebrated director who wants Nora to star in his comeback film.", [["Renate Reinsve", "Nora"], ["Stellan Skarsgård", "Gustav"], ["Elle Fanning", "Rachel"]], 200, 88],
  [666277, "movie", "Past Lives", 2023, [18, 10749], 7.8, 7.8, 106, [76], "Two childhood friends are separated when one family emigrates from Seoul. Decades later they meet again in New York for one fateful week.", [["Greta Lee", "Nora"], ["Teo Yoo", "Hae Sung"], ["John Magaro", "Arthur"]], 220, 50],
  [81401, "movie", "Kon-Tiki", 2012, [12, 36, 18], 6.9, 7.2, 118, [8, 2269], "In 1947 Thor Heyerdahl and five companions cross the Pacific on a balsa-wood raft to prove his theory about Polynesian settlement.", [["Pål Sverre Hagen", "Thor Heyerdahl"], ["Anders Baasmo Christiansen", "Herman Watzinger"], ["Tobias Santelmann", "Knut Haugland"]], 190, 40],
  [331781, "movie", "The Wave", 2015, [28, 53, 18], 6.8, 6.7, 105, [2270, 76], "A geologist in Geiranger realises the mountain pass above the fjord is about to collapse and set off a tsunami, with only ten minutes to escape.", [["Kristoffer Joner", "Kristian"], ["Ane Dahl Torp", "Idun"]], 205, 38],
  [545611, "movie", "Everything Everywhere All at Once", 2022, [28, 12, 878, 35], 7.8, 7.8, 139, [119, 76], "A laundromat owner being audited by the tax office is swept into an adventure where only she can save the multiverse.", [["Michelle Yeoh", "Evelyn Wang"], ["Ke Huy Quan", "Waymond Wang"], ["Stephanie Hsu", "Joy Wang"], ["Jamie Lee Curtis", "Deirdre Beaubeirdre"]], 280, 60],
  [361743, "movie", "Top Gun: Maverick", 2022, [28, 18], 8.2, 8.2, 131, [1773], "After thirty years, Maverick is still pushing the limits as a test pilot, until he is sent to train a group of young graduates for a dangerous mission.", [["Tom Cruise", "Pete \"Maverick\" Mitchell"], ["Miles Teller", "Bradley \"Rooster\" Bradshaw"], ["Jennifer Connelly", "Penny Benjamin"]], 25, 72],
  [346698, "movie", "Barbie", 2023, [35, 12], 7.0, 6.8, 114, [1899], "Barbie and Ken are having the time of their lives in Barbieland. When they get a chance to go to the real world, they soon discover its joys and perils.", [["Margot Robbie", "Barbie"], ["Ryan Gosling", "Ken"], ["America Ferrera", "Gloria"]], 330, 75],
  [840430, "movie", "The Holdovers", 2023, [35, 18], 7.7, 7.9, 133, [1773], "A curmudgeonly teacher at a New England boarding school has to look after a handful of students who can't go home for Christmas.", [["Paul Giamatti", "Paul Hunham"], ["Da'Vine Joy Randolph", "Mary Lamb"], ["Dominic Sessa", "Angus Tully"]], 10, 45],
  [976893, "movie", "Perfect Days", 2023, [18], 7.8, 7.9, 124, [], "Hirayama cleans public toilets in Tokyo and finds quiet joy in a simple, structured life of music, books and trees.", [["Kōji Yakusho", "Hirayama"]], 150, 35],
  [736769, "movie", "Troll", 2022, [28, 14, 12], 6.4, 5.8, 101, [8], "Deep inside the Dovre mountain, something gigantic wakes up after a thousand years. A palaeontologist must stop it before it reaches Oslo.", [["Ine Marie Wilmann", "Nora Tidemann"], ["Kim Falck", "Andreas Isaksen"], ["Mads Sjøgård Pettersen", "Kristoffer Holm"]], 110, 52],
  [329865, "movie", "Arrival", 2016, [18, 878, 9648], 7.6, 7.9, 116, [8, 1773], "When mysterious spacecraft land around the world, a linguist is recruited to find out whether the visitors come in peace.", [["Amy Adams", "Louise Banks"], ["Jeremy Renner", "Ian Donnelly"], ["Forest Whitaker", "Colonel Weber"]], 185, 48],
  [496243, "movie", "Parasite", 2019, [35, 53, 18], 8.5, 8.5, 132, [1899, 76], "The unemployed Kim family schemes its way into the lives of the wealthy Parks, until an unexpected discovery changes everything.", [["Song Kang-ho", "Kim Ki-taek"], ["Choi Woo-shik", "Kim Ki-woo"], ["Park So-dam", "Kim Ki-jung"], ["Cho Yeo-jeong", "Park Yeon-kyo"]], 95, 58],
  [569094, "movie", "Spider-Man: Across the Spider-Verse", 2023, [16, 28, 12], 8.3, 8.5, 140, [8], "Miles Morales is catapulted across the multiverse, where he meets a team of Spider-People charged with protecting its very existence.", [["Shameik Moore", "Miles Morales"], ["Hailee Steinfeld", "Gwen Stacy"], ["Oscar Isaac", "Miguel O'Hara"]], 345, 66],
  [915935, "movie", "Anatomy of a Fall", 2023, [53, 9648, 18], 7.7, 7.7, 152, [76], "A woman is suspected of her husband's murder, and their partially sighted son faces a moral dilemma as the sole witness.", [["Sandra Hüller", "Sandra Voyter"], ["Swann Arlaud", "Vincent Renzi"], ["Milo Machado Graner", "Daniel"]], 40, 44],

  [126308, "tv", "Shōgun", 2024, [18, 10768], 8.6, 8.6, 1, [337], "Lord Yoshii Toranaga fights for his life as his enemies on the Council of Regents unite against him, when a mysterious European ship is found marooned nearby.", [["Hiroyuki Sanada", "Yoshii Toranaga"], ["Cosmo Jarvis", "John Blackthorne"], ["Anna Sawai", "Toda Mariko"]], 5, 92],
  [136315, "tv", "The Bear", 2022, [18, 35], 8.2, 8.5, 4, [337], "A young chef from the fine-dining world returns to Chicago to run his family's sandwich shop after a heartbreaking death.", [["Jeremy Allen White", "Carmy Berzatto"], ["Ebon Moss-Bachrach", "Richie Jerimovich"], ["Ayo Edebiri", "Sydney Adamu"]], 15, 86],
  [95396, "tv", "Severance", 2022, [18, 9648, 10765], 8.4, 8.7, 2, [350], "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.", [["Adam Scott", "Mark Scout"], ["Britt Lower", "Helly R."], ["John Turturro", "Irving Bailiff"], ["Patricia Arquette", "Harmony Cobel"]], 175, 89],
  [76331, "tv", "Succession", 2018, [18], 8.4, 8.8, 4, [1899], "The Roy family controls one of the biggest media empires in the world. Their lives change when their father steps back from the company.", [["Brian Cox", "Logan Roy"], ["Jeremy Strong", "Kendall Roy"], ["Sarah Snook", "Shiv Roy"], ["Kieran Culkin", "Roman Roy"]], 50, 64],
  [100088, "tv", "The Last of Us", 2023, [18, 10765, 10759], 8.5, 8.6, 2, [1899], "Twenty years after modern civilisation has been destroyed, Joel is hired to smuggle 14-year-old Ellie out of an oppressive quarantine zone.", [["Pedro Pascal", "Joel"], ["Bella Ramsey", "Ellie"]], 90, 80],
  [64439, "tv", "Skam", 2015, [18], 8.5, 8.6, 4, [2270], "Everyday life for teenagers at Hartvig Nissen school in Oslo, told in real time through clips, chats and posts.", [["Tarjei Sandvik Moe", "Isak Valtersen"], ["Josefine Frida Pettersen", "Noora Sætre"], ["Henrik Holm", "Even Bech Næsheim"], ["Lisa Teige", "Eva Kviig Mohn"]], 355, 54],
  [89901, "tv", "Exit", 2019, [18], 7.6, 7.9, 3, [2270], "Four finance men in Oslo live a life of excess, money and power, based on anonymous interviews with real people from the industry.", [], 40, 62],
  [91599, "tv", "Ragnarok", 2020, [18, 10765], 7.1, 7.5, 3, [8], "In a small Norwegian town plagued by climate change and industrial pollution, a teenager discovers he has powers from Norse mythology.", [["David Stakston", "Magne"], ["Jonas Strand Gravli", "Laurits"]], 195, 42],
  [39849, "tv", "Lilyhammer", 2012, [80, 18, 35], 7.6, 7.9, 3, [8, 2270], "A New York mobster enters witness protection and asks to be relocated to Lillehammer, where he soon falls back into old habits.", [["Steven Van Zandt", "Frank Tagliano"], ["Trond Fausa", "Torgeir Lien"]], 205, 34],
  [68716, "tv", "Norsemen", 2016, [35], 8.0, 8.2, 3, [8, 2270], "In the Viking village of Norheim around the year 790, the villagers struggle with raids, rivalries and very modern problems.", [], 25, 38],
  [106379, "tv", "Fallout", 2024, [10759, 10765, 18], 8.2, 8.3, 2, [119], "Two hundred years after the apocalypse, a gentle vault dweller ventures into a gloriously strange and violent wasteland.", [["Ella Purnell", "Lucy MacLean"], ["Walton Goggins", "The Ghoul"], ["Aaron Moten", "Maximus"]], 55, 77],
  [83867, "tv", "Andor", 2022, [10765, 10759, 18], 8.3, 8.5, 2, [337], "In an era filled with danger and deception, Cassian Andor sets out on the path that will turn him into a rebel hero.", [["Diego Luna", "Cassian Andor"], ["Stellan Skarsgård", "Luthen Rael"], ["Genevieve O'Reilly", "Mon Mothma"]], 20, 70],
  [95480, "tv", "Slow Horses", 2022, [18, 80], 8.0, 8.1, 5, [350], "A team of MI5 agents who have been exiled to Slough House for their career-ending mistakes are drawn into dangerous operations.", [["Gary Oldman", "Jackson Lamb"], ["Jack Lowden", "River Cartwright"], ["Kristin Scott Thomas", "Diana Taverner"]], 100, 61],
  [94954, "tv", "Hacks", 2021, [35, 18], 8.1, 8.2, 4, [1899], "A legendary Las Vegas comedian forms a dark mentorship with an entitled, outcast 25-year-old writer.", [["Jean Smart", "Deborah Vance"], ["Hannah Einbinder", "Ava Daniels"]], 320, 46],
  [241259, "tv", "Baby Reindeer", 2024, [18], 7.4, 7.6, 1, [8], "When a struggling comedian shows a kindness to a vulnerable woman, it sparks a suffocating obsession that threatens to wreck both their lives.", [["Richard Gadd", "Donny Dunn"], ["Jessica Gunning", "Martha Scott"]], 0, 57],
  [88048, "tv", "Beforeigners", 2019, [80, 10765], 6.8, 6.9, 2, [1899], "People from the past start showing up in present-day Oslo. A detective and her Viking-age partner investigate a murder.", [], 170, 30],
  [62227, "tv", "Occupied", 2015, [18, 10768], 7.0, 7.1, 3, [8], "In the near future Norway is occupied by Russia on behalf of the EU, after the country stops producing oil and gas.", [], 215, 28],
];

export const GENRES = {
  movie: [[28, "Action"], [12, "Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [18, "Drama"], [14, "Fantasy"], [36, "History"], [9648, "Mystery"], [10749, "Romance"], [878, "Science Fiction"], [53, "Thriller"]].map(([id, name]) => ({ id, name })),
  tv: [[10759, "Action & Adventure"], [35, "Comedy"], [80, "Crime"], [18, "Drama"], [9648, "Mystery"], [10765, "Sci-Fi & Fantasy"], [10768, "War & Politics"]].map(([id, name]) => ({ id, name })),
};
const genreName = new Map([...GENRES.movie, ...GENRES.tv].map((g) => [g.id, g.name]));

export const TITLES = RAW.map(([id, type, title, year, genres, tmdb, imdb, length, stream, overview, cast, hue, popularity], i) => ({
  id, type, title, year, genres, tmdb, imdb, length, stream, overview, cast, hue, popularity,
  // new releases also rent/buy; older titles are mostly rentable too
  rent: stream.length && i % 3 === 0 ? [] : RENT.filter((_, k) => (i + k) % 2 === 0 || k === 0),
  buy: i % 4 === 1 ? [] : [2, 3],
  imdbId: `tt${String(1000000 + id).padStart(7, "0")}`,
}));

export const RT = new Map(Object.entries({"693134":[92,"2025-03-10"],"872585":[93,"2024-11-02"],"792307":[92,"2024-06-20"],"660120":[96,"2023-01-15"],"1124620":[96,"2025-11-20"],"666277":[95,"2024-02-01"],"81401":[81,"2021-08-30"],"331781":[83,"2022-04-11"],"545611":[94,"2024-01-09"],"361743":[96,"2023-05-05"],"346698":[88,"2024-08-19"],"840430":[97,"2024-07-01"],"976893":[96,"2024-09-12"],"736769":[72,"2023-02-02"],"329865":[94,"2022-10-10"],"496243":[99,"2023-03-03"],"569094":[95,"2024-04-04"],"915935":[96,"2024-05-05"],"126308":[99,"2025-01-20"],"136315":[99,"2024-12-12"],"95396":[97,"2025-05-05"],"76331":[95,"2023-12-01"],"100088":[96,"2025-06-01"],"91599":[67,"2022-02-02"],"106379":[93,"2024-10-10"],"83867":[96,"2025-07-07"],"95480":[97,"2025-02-14"],"94954":[99,"2025-06-20"],"241259":[98,"2024-09-09"]}).map(([id, [score, asOf]]) => [Number(id), { score, as_of: asOf }]));

export const byKey = new Map(TITLES.map((t) => [`${t.type}:${t.id}`, t]));

// Raw TMDB-shaped objects, as the real API returns them.
export function tmdbListItem(t) {
  const date = `${t.year}-03-01`;
  return {
    id: t.id,
    media_type: t.type,
    [t.type === "movie" ? "title" : "name"]: t.title,
    [t.type === "movie" ? "release_date" : "first_air_date"]: date,
    poster_path: `/poster/${t.type}/${t.id}`,
    backdrop_path: `/backdrop/${t.type}/${t.id}`,
    vote_average: t.tmdb,
    vote_count: 1000 + t.popularity * 40,
    overview: t.overview,
    genre_ids: t.genres,
    popularity: t.popularity,
  };
}

const prov = (id) => {
  const p = PROVIDERS.find((x) => x.id === id);
  return { provider_id: p.id, provider_name: p.name, logo_path: `/logo/${p.id}`, display_priority: PROVIDERS.indexOf(p) };
};

export function tmdbDetails(t) {
  const similar = TITLES.filter((x) => x.type === t.type && x.id !== t.id)
    .map((x) => [x, x.genres.filter((g) => t.genres.includes(g)).length * 10 + x.popularity / 10])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([x]) => tmdbListItem(x));
  return {
    ...tmdbListItem(t),
    tagline: "",
    runtime: t.type === "movie" ? t.length : undefined,
    number_of_seasons: t.type === "tv" ? t.length : undefined,
    genres: t.genres.map((id) => ({ id, name: genreName.get(id) })),
    imdb_id: t.type === "movie" ? t.imdbId : undefined,
    external_ids: { imdb_id: t.imdbId },
    credits: { cast: t.cast.map(([name, character], k) => ({ name, character, profile_path: `/person/${t.id}/${k}` })) },
    recommendations: { results: similar },
    videos: { results: [] },
    ...(t.type === "movie" ? { release_dates: releaseDatesOf(t.id) } : {}),
    ...(COMING_SEASONS.find((c) => c.id === t.id) ? { next_episode_to_air: { season_number: COMING_SEASONS.find((c) => c.id === t.id).season, episode_number: 1, air_date: COMING_SEASONS.find((c) => c.id === t.id).date } } : {}),
    networks: [],
    "watch/providers": {
      results: {
        NO: {
          link: "https://www.justwatch.com/no",
          flatrate: t.stream.map(prov),
          rent: t.rent.map(prov),
          buy: t.buy.map(prov),
        },
      },
    },
  };
}

export const providerList = () => PROVIDERS.map((p) => ({ ...prov(p.id), display_priorities: { NO: PROVIDERS.indexOf(p) } }));

// Coming to cinemas (sample dates, counted from today so the row is never empty).
const soon = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
export const UPCOMING = [
  [900001, "The Hunger Games: Sunrise on the Reaping", 12, 200],
  [900002, "Jumanji 3", 30, 120],
  [900003, "Dune: Part Three", 45, 35],
  [900004, "Avengers: Doomsday", 46, 0],
  [900005, "The Chronicles of Narnia", 60, 150],
].map(([id, title, days, hue]) => ({ id, title, date: soon(days), hue }));

// Everything with a date: films coming to (or just opened in) cinemas, films
// coming to stream or rent, and brand-new series.
export const SOON = [
  ...UPCOMING.map((u) => ({ ...u, type: "movie", kind: "cinema" })),
  ...[[900011, "The Odyssey", -12, 30], [900012, "Kon-Tiki: The Return", -5, 190]].map(([id, title, days, hue]) => ({ id, title, date: soon(days), hue, type: "movie", kind: "cinema" })),
  ...[[900021, "Wicked: For Good", 18, 300], [900022, "Sinners", 25, 10]].map(([id, title, days, hue]) => ({ id, title, date: soon(days), hue, type: "movie", kind: "digital" })),
  ...[[900031, "Fjord Noir", 15, 200, 8]].map(([id, title, days, hue, provider]) => ({ id, title, date: soon(days), hue, type: "tv", kind: "series", provider })),
];
export const soonItem = (s) => ({
  id: s.id, media_type: s.type, [s.type === "movie" ? "title" : "name"]: s.title, [s.type === "movie" ? "release_date" : "first_air_date"]: s.date,
  poster_path: `/poster/${s.type}/${s.id}`, backdrop_path: null, vote_average: 0, vote_count: 0, overview: "", genre_ids: [], popularity: 50,
});
export const releaseDatesOf = (id) => {
  const s = SOON.find((x) => x.id === id);
  const t = byKey.get(`movie:${id}`);
  const when = s ? { type: s.kind === "digital" ? 4 : 3, release_date: `${s.date}T00:00:00.000Z`, note: "" } : t ? { type: 3, release_date: `${t.year}-02-01T00:00:00.000Z`, note: "" } : null;
  return { results: when ? [{ iso_3166_1: "NO", release_dates: [when] }] : [] };
};
// New seasons soon: [series id, season, in how many days]
export const COMING_SEASONS = [[91599, 4, 9], [100088, 3, 20], [64439, 5, 33]].map(([id, season, days]) => ({ id, season, date: soon(days) }));
