import { renderNavigation } from '../components/navigation.js';
import { regenerateCourtTournamentData } from '../data/mock-data.js';
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

function parseTeamList(teamListText) {
  return teamListText
    .split(/\r?\n|,/)
    .map((team) => team.trim())
    .filter(Boolean);
}

function sortMatches(data) {
  data.matches.sort((left, right) => {
    if (left.courtId === right.courtId) {
      return left.order - right.order;
    }
    return left.courtId.localeCompare(right.courtId, 'ja');
  });
}

function syncMatchScheduleTimes(data) {
  data.matches.forEach((match) => {
    match.scheduledAt = data.scheduleSlots[(match.order - 1) % data.scheduleSlots.length];
  });

  data.courts.forEach((court) => {
    court.scheduleSlots = [...data.scheduleSlots];
  });
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

    sortMatches(data);
  });

  setState({
    adminEditingMatchId: '',
    adminCourtMessage: '',
    adminScheduleMessage: '',
    adminMessage: id ? '試合情報を更新しました。' : '試合を新規登録しました。',
  });
}

function handleAdminCourtTeamsSubmit(formElement) {
  const formData = new FormData(formElement);
  const courtId = String(formData.get('courtId') || '');
  const teamListText = String(formData.get('teamList') || '');
  const teams = parseTeamList(teamListText);

  if (!courtId || teams.length < 2) {
    setState({
      adminCourtMessage: '所属チームは2チーム以上入力してください。',
      adminMessage: '',
      adminScheduleMessage: '',
    });
    return;
  }

  const confirmed = window.confirm(
    `${courtId}コートの所属チームを更新すると、このコートの既存試合結果と対戦カードは削除され、` +
      '総当たり試合が再生成されます。続行しますか?'
  );

  if (!confirmed) {
    setState({
      adminCourtMessage: '所属チームの更新をキャンセルしました。',
      adminMessage: '',
      adminScheduleMessage: '',
    });
    return;
  }

  updateData((data) => {
    const court = data.courts.find((item) => item.id === courtId);
    if (!court) {
      return;
    }

    court.assignedTeams = teams;
    const regenerated = regenerateCourtTournamentData(courtId, teams, data.scheduleSlots);

    data.matches = data.matches.filter((match) => match.courtId !== courtId);
    data.scores = data.scores.filter((score) => !score.matchId.startsWith(`${courtId}-`));
    data.matches.push(...regenerated.matches);
    data.scores.push(...regenerated.scores);
    sortMatches(data);
  });

  setState({
    selectedCourtId: courtId,
    selectedMatchId: '',
    adminEditingMatchId: '',
    adminMessage: '',
    adminScheduleMessage: '',
    adminCourtMessage: `${courtId}コートの所属チームと総当たり試合を再生成しました。`,
  });
}

function handleAdminScheduleSubmit(formElement) {
  const formData = new FormData(formElement);
  const slots = getState().data.scheduleSlots.map((_, index) => String(formData.get(`slot-${index}`) || '').trim());
  const timePattern = /^\d{2}:\d{2}$/;
  const hasInvalidValue = slots.some((slot) => !timePattern.test(slot));
  const hasDuplicate = new Set(slots).size !== slots.length;

  if (hasInvalidValue) {
    setState({
      adminScheduleMessage: 'すべての時間枠を HH:MM 形式で入力してください。',
      adminMessage: '',
      adminCourtMessage: '',
    });
    return;
  }

  if (hasDuplicate) {
    setState({
      adminScheduleMessage: '同じ時刻は重複登録できません。',
      adminMessage: '',
      adminCourtMessage: '',
    });
    return;
  }

  updateData((data) => {
    data.scheduleSlots = slots;
    syncMatchScheduleTimes(data);
  });

  setState({
    adminMessage: '',
    adminCourtMessage: '',
    adminScheduleMessage: '固定タイムテーブルを更新し、全試合の開始時刻へ同期しました。',
  });
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const routeTrigger = event.target.closest('[data-route]');
    if (routeTrigger) {
      event.preventDefault();
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

    const adminCourtSelect = event.target.closest('[data-role="admin-court-select"]');
    if (adminCourtSelect) {
      setState({
        selectedCourtId: adminCourtSelect.value,
        adminCourtMessage: '',
      });
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
      return;
    }

    if (formElement.matches('[data-form="admin-court-teams"]')) {
      event.preventDefault();
      handleAdminCourtTeamsSubmit(formElement);
      return;
    }

    if (formElement.matches('[data-form="admin-schedule"]')) {
      event.preventDefault();
      handleAdminScheduleSubmit(formElement);
    }
  });
}

subscribe(renderApp);
window.addEventListener('hashchange', syncRouteFromHash);
bindEvents();
syncRouteFromHash();
renderApp(getState());