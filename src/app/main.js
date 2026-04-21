import { renderNavigation } from '../components/navigation.js';
import { renderAdminPage } from '../pages/admin-page.js';
import { renderIndexPage } from '../pages/index-page.js';
import { renderScoreInputPage } from '../pages/score-input-page.js';
import { renderTournamentPage } from '../pages/tournament-page.js';
import { navigate, syncRouteFromHash } from './router.js';
import { getState, setState, subscribe, updateData } from './store.js';

const appElement = document.querySelector('#app');

function renderCurrentPage(state) {
  switch (state.selectedPage) {
    case 'tournament':
      return renderTournamentPage(state);
    case 'score-input':
      return renderScoreInputPage(state);
    case 'admin':
      return renderAdminPage(state);
    case 'index':
    default:
      return renderIndexPage(state);
  }
}

function renderApp(state) {
  appElement.innerHTML = `
    <div class="site-shell">
      <header class="site-header">
        <div>
          <p class="site-header__eyebrow">SocialGathering2026</p>
          <h1 class="site-header__title">バレー大会 Webアプリ</h1>
        </div>
        <p class="site-header__meta">最終更新: ${state.lastUpdatedAt}</p>
      </header>
      ${renderNavigation(state.selectedPage)}
      <main class="site-main">
        ${renderCurrentPage(state)}
      </main>
    </div>
  `;
}

function updateSelectedCourt(courtId) {
  setState({
    selectedCourtId: courtId,
    selectedMatchId: '',
    scoreFormError: '',
    scoreFormMessage: '',
  });
}

function upsertScore(data, matchId, teamAScore, teamBScore) {
  const scoreIndex = data.scores.findIndex((score) => score.matchId === matchId);
  const nextScore = { matchId, setNumber: 1, teamAScore, teamBScore };

  if (scoreIndex >= 0) {
    data.scores.splice(scoreIndex, 1, nextScore);
    return;
  }

  data.scores.push(nextScore);
}

function handleScoreSubmit(formElement) {
  const state = getState();
  if (!state.scoreInputEnabled) {
    setState({ scoreFormError: '現在は入力受付中ではありません。', scoreFormMessage: '' });
    return;
  }

  const formData = new FormData(formElement);
  const courtId = formData.get('courtId');
  const matchId = formData.get('matchId');
  const teamAScore = Number(formData.get('teamAScore'));
  const teamBScore = Number(formData.get('teamBScore'));

  if (!courtId) {
    setState({ scoreFormError: 'コートを選択してください。', scoreFormMessage: '' });
    return;
  }
  if (!matchId) {
    setState({ scoreFormError: '試合を選択してください。', scoreFormMessage: '' });
    return;
  }
  if (Number.isNaN(teamAScore) || Number.isNaN(teamBScore)) {
    setState({ scoreFormError: '数値で入力してください。', scoreFormMessage: '' });
    return;
  }
  if (teamAScore === teamBScore) {
    setState({ scoreFormError: '勝敗が決まるスコアを入力してください。', scoreFormMessage: '' });
    return;
  }

  updateData((data) => {
    const match = data.matches.find((item) => item.id === matchId);
    if (!match) {
      return;
    }

    upsertScore(data, matchId, teamAScore, teamBScore);
    match.status = 'completed';
    match.winner = teamAScore > teamBScore ? match.teamA : match.teamB;
    match.scoreLocked = true;
    match.updatedAt = new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  setState({
    selectedCourtId: courtId,
    selectedMatchId: '',
    scoreFormError: '',
    scoreFormMessage: '試合結果を登録しました。',
  });
}

function handleAdminSubmit(formElement) {
  const formData = new FormData(formElement);
  const id = formData.get('id');
  const courtId = formData.get('courtId');
  const order = Number(formData.get('order'));
  const scheduledAt = formData.get('scheduledAt');
  const teamA = String(formData.get('teamA')).trim();
  const teamB = String(formData.get('teamB')).trim();
  const status = formData.get('status');
  const teamAScoreRaw = formData.get('teamAScore');
  const teamBScoreRaw = formData.get('teamBScore');

  if (!courtId || !order || !scheduledAt || !teamA || !teamB) {
    setState({ adminMessage: '必須項目を入力してください。' });
    return;
  }

  const hasScores = teamAScoreRaw !== '' && teamBScoreRaw !== '';
  const teamAScore = Number(teamAScoreRaw);
  const teamBScore = Number(teamBScoreRaw);

  if (hasScores && teamAScore === teamBScore) {
    setState({ adminMessage: '同点スコアは登録できません。' });
    return;
  }

  updateData((data) => {
    const existingMatch = data.matches.find((match) => match.id === id);
    const winner = hasScores ? (teamAScore > teamBScore ? teamA : teamB) : '';

    if (existingMatch) {
      existingMatch.courtId = courtId;
      existingMatch.order = order;
      existingMatch.scheduledAt = scheduledAt;
      existingMatch.teamA = teamA;
      existingMatch.teamB = teamB;
      existingMatch.status = status;
      existingMatch.winner = winner;
      existingMatch.scoreLocked = status === 'completed' && hasScores;
      existingMatch.updatedAt = new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      data.matches.push({
        id: `${courtId}-${String(order).padStart(2, '0')}-N`,
        courtId,
        order,
        scheduledAt,
        teamA,
        teamB,
        status,
        winner,
        updatedAt: new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        inputEnabled: true,
        scoreLocked: status === 'completed' && hasScores,
      });
    }

    if (hasScores) {
      upsertScore(data, existingMatch ? existingMatch.id : `${courtId}-${String(order).padStart(2, '0')}-N`, teamAScore, teamBScore);
    }

    data.matches.sort((left, right) => {
      if (left.courtId === right.courtId) {
        return left.order - right.order;
      }
      return left.courtId.localeCompare(right.courtId, 'ja');
    });
  });

  setState({
    adminEditingMatchId: '',
    adminMessage: id ? '試合情報を更新しました。' : '試合を新規登録しました。',
  });
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const routeTrigger = event.target.closest('[data-route]');
    if (routeTrigger) {
      const nextCourt = routeTrigger.getAttribute('data-select-court');
      if (nextCourt) {
        updateSelectedCourt(nextCourt);
      }
      navigate(routeTrigger.getAttribute('data-route'));
      return;
    }

    const courtTrigger = event.target.closest('[data-select-court]');
    if (courtTrigger) {
      updateSelectedCourt(courtTrigger.getAttribute('data-select-court'));
      if (getState().selectedPage !== 'tournament') {
        navigate('tournament');
      }
      return;
    }

    const editTrigger = event.target.closest('[data-admin-edit]');
    if (editTrigger) {
      setState({
        selectedPage: 'admin',
        adminEditingMatchId: editTrigger.getAttribute('data-admin-edit'),
        adminMessage: '',
      });
      navigate('admin');
      return;
    }

    const toggleTrigger = event.target.closest('[data-admin-toggle]');
    if (toggleTrigger) {
      const enabled = toggleTrigger.getAttribute('data-admin-toggle') === 'enable';
      setState({
        scoreInputEnabled: enabled,
        adminMessage: enabled ? '入力受付を開始しました。' : '入力受付を停止しました。',
      });
      return;
    }

    const clearTrigger = event.target.closest('[data-admin-clear]');
    if (clearTrigger) {
      setState({ adminEditingMatchId: '', adminMessage: '' });
    }
  });

  document.addEventListener('change', (event) => {
    const courtSelect = event.target.closest('[data-role="score-court-select"]');
    if (courtSelect) {
      updateSelectedCourt(courtSelect.value);
      return;
    }

    const matchSelect = event.target.closest('[data-role="score-match-select"]');
    if (matchSelect) {
      setState({ selectedMatchId: matchSelect.value, scoreFormError: '', scoreFormMessage: '' });
    }
  });

  document.addEventListener('submit', (event) => {
    const formElement = event.target;
    if (!(formElement instanceof HTMLFormElement)) {
      return;
    }

    if (formElement.matches('[data-form="score-input"]')) {
      event.preventDefault();
      handleScoreSubmit(formElement);
      return;
    }

    if (formElement.matches('[data-form="admin"]')) {
      event.preventDefault();
      handleAdminSubmit(formElement);
    }
  });
}

subscribe(renderApp);
window.addEventListener('hashchange', syncRouteFromHash);
bindEvents();
syncRouteFromHash();
renderApp(getState());