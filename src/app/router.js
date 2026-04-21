import { getState, setState } from './store.js';

const VALID_ROUTES = new Set(['index', 'tournament', 'score-input', 'admin']);

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  return VALID_ROUTES.has(hash) ? hash : 'index';
}

export function syncRouteFromHash() {
  const selectedPage = parseHash();
  const state = getState();

  if (state.selectedPage !== selectedPage) {
    setState({ selectedPage });
  }
}

export function navigate(routeName) {
  const route = VALID_ROUTES.has(routeName) ? routeName : 'index';
  if (window.location.hash !== `#${route}`) {
    window.location.hash = route;
    return;
  }
  setState({ selectedPage: route });
}