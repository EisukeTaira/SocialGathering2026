const NAV_ITEMS = [
  { id: 'index', label: 'Index', shortLabel: 'ホーム' },
  { id: 'tournament', label: 'Tournament', shortLabel: '試合' },
  { id: 'score-input', label: 'ScoreInput', shortLabel: '入力' },
  { id: 'admin', label: 'Admin', shortLabel: '管理' },
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
            <span class="site-nav__label site-nav__label--short">${item.shortLabel}</span>
            <span class="site-nav__label site-nav__label--full">${item.label}</span>
          </button>
        `
      ).join('')}
    </nav>
  `;
}