import { renderSectionTitle, renderStatusBadge } from '../components/ui.js';

function parseTodayTime(timeText) {
  if (typeof timeText !== 'string' || !timeText.includes(':')) {
    return null;
  }

  const [hours, minutes] = timeText.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getRemainingText(nextMatch) {
  if (!nextMatch) {
    return '次試合未登録';
  }

  const scheduledDate = parseTodayTime(nextMatch.scheduledAt);
  if (!scheduledDate) {
    return '開始時刻未設定';
  }

  const diffMinutes = Math.round((scheduledDate - new Date()) / 60000);
  if (diffMinutes > 0) {
    return `開始まであと${diffMinutes}分`;
  }
  if (diffMinutes === 0) {
    return 'まもなく開始';
  }
  return '開始時刻を過ぎています';
}

function buildCourtSummary(court, matches) {
  const currentMatch =
    matches.find((match) => match.status === 'in_progress') ||
    matches.find((match) => match.status === 'scheduled') ||
    matches[0];
  const nextMatch = matches.find(
    (match) => match.order > (currentMatch?.order || 0) && match.status === 'scheduled'
  );

  return { currentMatch, nextMatch };
}

export function renderIndexPage(state) {
  const { courts, matches, scheduleOverview, scheduleSlots } = state.data;
  const completedCount = matches.filter((match) => match.status === 'completed').length;
  const inProgressCount = matches.filter((match) => match.status === 'in_progress').length;
  const eventNotes = scheduleOverview || [];

  return `
    <section class="page-hero page-hero--dashboard">
      <div>
        <p class="page-hero__eyebrow">Index Page / Tournament Dashboard</p>
        <h1 class="page-hero__title">大会全体の進行を一画面で確認</h1>
        <p class="page-hero__description">
          固定タイムテーブル、各コートの現在試合、次試合、入力受付状態をまとめて表示します。
        </p>
      </div>
      <aside class="hero-panel">
        <p class="hero-panel__label">運営メッセージ</p>
        <p class="hero-panel__value">${state.noticeMessage}</p>
      </aside>
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Time Schedule',
        '固定タイムテーブル',
        '全コート共通の試合開始時刻です。Admin で変更するとここへ反映されます。'
      )}
      <div class="schedule-strip" role="list" aria-label="固定タイムテーブル">
        ${scheduleSlots
          .map(
            (slot, index) => `
              <article class="schedule-slot" role="listitem">
                <p class="schedule-slot__time">${slot}</p>
                <p class="schedule-slot__meta">第${index + 1}枠</p>
              </article>
            `
          )
          .join('')}
      </div>
      ${eventNotes.length
        ? `
          <div class="schedule-note-list">
            ${eventNotes
              .map(
                (item) => `
                  <p class="schedule-note-list__item">${item.time} | ${item.label}</p>
                `
              )
              .join('')}
          </div>
        `
        : ''}
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Summary',
        '全体サマリー',
        '試合進行の全体像と入力受付状態を表示します。'
      )}
      <div class="summary-grid summary-grid--dashboard">
        <article class="summary-card">
          <p class="summary-card__label">進行中試合</p>
          <p class="summary-card__value">${inProgressCount}</p>
        </article>
        <article class="summary-card">
          <p class="summary-card__label">終了試合</p>
          <p class="summary-card__value">${completedCount}</p>
        </article>
        <article class="summary-card">
          <p class="summary-card__label">入力受付</p>
          <p class="summary-card__value">${state.scoreInputEnabled ? '受付中' : '停止中'}</p>
        </article>
      </div>
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Court Overview',
        'コート状況一覧',
        '各コートの現在試合と次試合をカード形式で確認できます。'
      )}
      <div class="court-grid court-grid--dashboard">
        ${courts
          .map((court) => {
            const courtMatches = matches.filter((match) => match.courtId === court.id);
            const { currentMatch, nextMatch } = buildCourtSummary(court, courtMatches);
            const remainingMatchCount = courtMatches.filter(
              (match) => match.status === 'scheduled' || match.status === 'in_progress'
            ).length;

            return `
              <button
                type="button"
                class="court-card"
                data-route="tournament"
                data-select-court="${court.id}"
              >
                <span class="court-card__header">
                  <span>
                    <span class="court-card__eyebrow">${court.name}</span>
                    <strong class="court-card__title">${court.assignedTeams.length}チーム所属</strong>
                    <span class="court-card__submeta">残り${remainingMatchCount}試合</span>
                  </span>
                  ${renderStatusBadge(currentMatch?.status || 'scheduled')}
                </span>
                <span class="court-card__body">
                  <span class="court-card__label">現在試合</span>
                  <strong class="court-card__match">
                    ${currentMatch ? `${currentMatch.teamA} vs ${currentMatch.teamB}` : '待機中'}
                  </strong>
                  <span class="court-card__meta">
                    ${currentMatch ? `${currentMatch.scheduledAt} / 第${currentMatch.order}試合` : '試合未登録'}
                  </span>
                </span>
                <span class="court-card__footer">
                  <span class="court-card__label">次試合</span>
                  <span class="court-card__meta">
                    ${nextMatch ? `${nextMatch.teamA} vs ${nextMatch.teamB}` : '予定未登録'}
                  </span>
                  <span class="court-card__countdown">${getRemainingText(nextMatch)}</span>
                </span>
                <span class="court-card__link">タップして試合一覧へ</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
}