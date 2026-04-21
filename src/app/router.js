import { getState, setState } from './store.js?v=20260421-06';

export const ROUTES = {
  index: 'index',
  tournament: 'tournament',
  scoreInput: 'ref-entry-2026',
  admin: 'ops-room-2026',
};

const VALID_ROUTES = new Set(Object.values(ROUTES));

export function isScoreInputRoute(routeName) {
  return routeName === ROUTES.scoreInput;
}

export function isAdminRoute(routeName) {
  return routeName === ROUTES.admin;
}

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  return VALID_ROUTES.has(hash) ? hash : ROUTES.index;
}

export function syncRouteFromHash() {
  if (!window.location.hash) {
    window.location.hash = `#${ROUTES.index}`;
    setState({ selectedPage: ROUTES.index });
    return;
  }

  const selectedPage = parseHash();
  const state = getState();

  if (state.selectedPage !== selectedPage) {
    setState({ selectedPage });
  }
}

export function navigate(routeName) {
  const route = VALID_ROUTES.has(routeName) ? routeName : ROUTES.index;
  const nextHash = `#${route}`;

  if (getState().selectedPage !== route) {
    setState({ selectedPage: route });
  }

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }

  setState({ selectedPage: route });
}