import { ROUTES } from '../app/router.js?v=20260421-05';

const NAV_ITEMS = [
  { id: ROUTES.index, label: 'Index', shortLabel: 'Index' },
  { id: ROUTES.tournament, label: 'Tournament', shortLabel: '試合' },
];

export function renderNavigation(selectedPage) {
  return `
    <nav class="site-nav" aria-label="ページ遷移">
      ${NAV_ITEMS.map(
        (item) => `
          <a
            href="#${item.id}"
            class="site-nav__button${selectedPage === item.id ? ' is-active' : ''}"
            data-route="${item.id}"
            aria-current="${selectedPage === item.id ? 'page' : 'false'}"
          >
            <span class="site-nav__label site-nav__label--short">${item.shortLabel}</span>
            <span class="site-nav__label site-nav__label--full">${item.label}</span>
          </a>
        `
      ).join('')}
    </nav>
  `;
}