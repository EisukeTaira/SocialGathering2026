import { initialState, tournamentData } from '../data/mock-data.js?v=20260421-03';

function cloneData() {
  return {
    courts: tournamentData.courts.map((court) => ({
      ...court,
      assignedTeams: [...court.assignedTeams],
      scheduleSlots: [...court.scheduleSlots],
    })),
    matches: tournamentData.matches.map((match) => ({ ...match })),
    scores: tournamentData.scores.map((score) => ({ ...score })),
    scheduleSlots: [...tournamentData.scheduleSlots],
  };
}

const listeners = new Set();

const state = {
  ...initialState,
  data: cloneData(),
};

export function getState() {
  return state;
}

export function setState(partialState) {
  Object.assign(state, partialState, {
    lastUpdatedAt: new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateData(updater) {
  updater(state.data);
  setState({});
}