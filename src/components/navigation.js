const NAV_ITEMS = [
  { id: 'index', label: 'Index' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'score-input', label: 'ScoreInput' },
  { id: 'admin', label: 'Admin' },
];

export function renderNavigation(selectedPage) {
  return `
    <nav class="site-nav" aria-label="ページ遷移">
      ${NAV_ITEMS.map(
        (item) => `
          <button
            type="button"
            class="site-nav__button${selectedPage === item.id ? ' is-active' : ''}"
            data-route="${item.id}"
          >
            ${item.label}
          </button>
        `
      ).join('')}
    </nav>
  `;
}