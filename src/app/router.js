import { getState, setState } from './store.js?v=20260421-02';

const VALID_ROUTES = new Set(['index', 'tournament', 'score-input', 'admin']);

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  return VALID_ROUTES.has(hash) ? hash : 'index';
}

export function syncRouteFromHash() {
  if (!window.location.hash) {
    window.location.hash = '#index';
    setState({ selectedPage: 'index' });
    return;
  }

  const selectedPage = parseHash();
  const state = getState();

  if (state.selectedPage !== selectedPage) {
    setState({ selectedPage });
  }
}

export function navigate(routeName) {
  const route = VALID_ROUTES.has(routeName) ? routeName : 'index';
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