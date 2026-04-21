import { escapeHtml, renderSectionTitle } from '../components/ui.js';

export function renderScoreInputPage(state) {
  const { courts, matches } = state.data;
  const availableMatches = matches.filter(
    (match) =>
      match.courtId === state.selectedCourtId &&
      (match.status === 'scheduled' || match.status === 'in_progress')
  );
  const selectedMatch =
    availableMatches.find((match) => match.id === state.selectedMatchId) || availableMatches[0] || null;

  return `
    <section class="page-hero page-hero--score-input">
      <div>
        <p class="page-hero__eyebrow">Referee Input</p>
        <h1 class="page-hero__title">審判入力</h1>
        <p class="page-hero__description">
          コートと対象試合を選択し、1セットマッチの結果を登録します。
        </p>
      </div>
      <aside class="hero-panel ${state.scoreInputEnabled ? '' : 'is-warning'}">
        <p class="hero-panel__label">入力受付状態</p>
        <p class="hero-panel__value">${state.scoreInputEnabled ? '受付中' : '停止中'}</p>
      </aside>
    </section>

    <section class="surface-block form-surface">
      ${renderSectionTitle(
        'Score Form',
        '結果入力フォーム',
        '対象試合を選択するとチーム名が自動表示されます。'
      )}
      <form class="form-grid" data-form="score-input">
        <label class="form-field">
          <span>コート名</span>
          <select name="courtId" data-role="score-court-select">
            ${courts
              .map(
                (court) => `
                  <option value="${court.id}" ${court.id === state.selectedCourtId ? 'selected' : ''}>
                    ${court.name}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>

        <label class="form-field">
          <span>対象試合</span>
          <select name="matchId" data-role="score-match-select">
            <option value="">試合を選択してください</option>
            ${availableMatches
              .map(
                (match) => `
                  <option value="${match.id}" ${selectedMatch?.id === match.id ? 'selected' : ''}>
                    第${match.order}試合 ${match.teamA} vs ${match.teamB}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>

        <div class="form-field is-readonly">
          <span>チームA</span>
          <p>${selectedMatch ? escapeHtml(selectedMatch.teamA) : '-'}</p>
        </div>

        <div class="form-field is-readonly">
          <span>チームB</span>
          <p>${selectedMatch ? escapeHtml(selectedMatch.teamB) : '-'}</p>
        </div>

        <label class="form-field">
          <span>チームAスコア</span>
          <input type="number" name="teamAScore" min="0" inputmode="numeric">
        </label>

        <label class="form-field">
          <span>チームBスコア</span>
          <input type="number" name="teamBScore" min="0" inputmode="numeric">
        </label>

        <div class="form-actions">
          <button type="submit" class="action-button" ${state.scoreInputEnabled ? '' : 'disabled'}>
            結果を送信
          </button>
        </div>
      </form>

      ${state.scoreFormError ? `<p class="feedback-message is-error">${escapeHtml(state.scoreFormError)}</p>` : ''}
      ${state.scoreFormMessage ? `<p class="feedback-message is-success">${escapeHtml(state.scoreFormMessage)}</p>` : ''}
    </section>
  `;
}