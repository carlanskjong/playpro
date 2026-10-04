// Line icons (24×24, drawn with the current text colour).
const svg = (d) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icon = {
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  bookmarkFilled: svg('<path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" fill="currentColor" stroke="none"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  share: svg('<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  upload: svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
  ticket: svg('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
  sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
};

// Little drawings for empty screens (outline style, current colour).
const art = (d) =>
  `<svg class="empty-art" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const drawing = {
  popcorn: art('<path d="M38 40h44l-6 42H44z"/><path d="M50 40l2 42M70 40l-2 42"/><circle cx="44" cy="32" r="8"/><circle cx="58" cy="27" r="9"/><circle cx="73" cy="32" r="8"/><circle cx="51" cy="20" r="6"/><circle cx="66" cy="18" r="6"/>'),
  sofa: art('<path d="M22 50V38a8 8 0 0 1 8-8h60a8 8 0 0 1 8 8v12"/><path d="M14 52a6 6 0 0 1 12 0v8h68v-8a6 6 0 0 1 12 0v18H14z"/><path d="M24 70v8M96 70v8"/><path d="M60 30v30"/>'),
  ticket: art('<path d="M18 26h84v12a8 8 0 0 0 0 16v12H18V54a8 8 0 0 0 0-16z"/><path d="M44 28v36" stroke-dasharray="4 5"/><path d="M58 40h28M58 50h20"/>'),
  friends: art('<circle cx="42" cy="34" r="11"/><circle cx="80" cy="34" r="11"/><path d="M22 76a20 20 0 0 1 40 0M60 76a20 20 0 0 1 40 0"/>'),
  reel: art('<circle cx="60" cy="45" r="30"/><circle cx="60" cy="45" r="5"/><circle cx="60" cy="27" r="7"/><circle cx="60" cy="63" r="7"/><circle cx="42" cy="45" r="7"/><circle cx="78" cy="45" r="7"/>'),
};
