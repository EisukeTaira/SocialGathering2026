import { getScoreLabel, renderSectionTitle, renderStatusBadge } from '../components/ui.js';

export function renderTournamentPage(state) {
  const { courts, matches, scores } = state.data;
  const selectedCourt = courts.find((court) => court.id === state.selectedCourtId) || courts[0];
  const courtMatches = matches.filter((match) => match.courtId === selectedCourt.id);
  const scoreMap = new Map(scores.map((score) => [score.matchId, score]));

  return `
    <section class="page-hero page-hero--tournament">
      <div>
        <p class="page-hero__eyebrow">Court Tournament</p>
        <h1 class="page-hero__title">${selectedCourt.name}の試合一覧</h1>
        <p class="page-hero__description">
          コート固定の総当たり戦を、試合順、スコア、勝敗、状態ごとに確認できます。
        </p>
      </div>
      <aside class="hero-panel">
        <p class="hero-panel__label">所属チーム</p>
        <p class="hero-panel__value">${selectedCourt.assignedTeams.join(' / ')}</p>
      </aside>
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Court Switch',
        'コート切り替え',
        'A〜Fコートを切り替えて試合進行を確認できます。'
      )}
      <div class="tab-row" role="tablist" aria-label="コート切り替え">
        ${courts
          .map(
            (court) => `
              <button
                type="button"
                role="tab"
                aria-selected="${court.id === selectedCourt.id}"
                class="tab-row__button${court.id === selectedCourt.id ? ' is-active' : ''}"
                data-select-court="${court.id}"
              >
                ${court.name}
              </button>
            `
          )
          .join('')}
      </div>
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Match Board',
        '試合ボード',
        '各試合の開始時刻、対戦カード、結果を一覧表示します。'
      )}
      <div class="match-card-list" aria-label="スマホ向け試合一覧">
        ${courtMatches
          .map((match) => {
            const score = scoreMap.get(match.id);
            const status = match.scoreLocked ? 'locked' : match.status;

            return `
              <article class="match-card">
                <header class="match-card__header">
                  <p class="match-card__order">第${String(match.order).padStart(2, '0')}試合</p>
                  ${renderStatusBadge(status)}
                </header>
                <p class="match-card__time">${match.scheduledAt}</p>
                <p class="match-card__teams">${match.teamA} vs ${match.teamB}</p>
                <dl class="match-card__meta">
                  <div>
                    <dt>スコア</dt>
                    <dd>${getScoreLabel(score)}</dd>
                  </div>
                  <div>
                    <dt>勝者</dt>
                    <dd>${match.winner || '-'}</dd>
                  </div>
                </dl>
              </article>
            `;
          })
          .join('')}
      </div>
      <div class="table-shell table-shell--desktop-only">
        <table class="match-table">
          <thead>
            <tr>
              <th scope="col">No</th>
              <th scope="col">時刻</th>
              <th scope="col">対戦カード</th>
              <th scope="col">スコア</th>
              <th scope="col">勝者</th>
              <th scope="col">状態</th>
            </tr>
          </thead>
          <tbody>
            ${courtMatches
              .map((match) => {
                const score = scoreMap.get(match.id);
                const status = match.scoreLocked ? 'locked' : match.status;
                return `
                  <tr>
                    <td>${String(match.order).padStart(2, '0')}</td>
                    <td>${match.scheduledAt}</td>
                    <td>
                      <strong>${match.teamA} vs ${match.teamB}</strong>
                    </td>
                    <td>${getScoreLabel(score)}</td>
                    <td>${match.winner || '-'}</td>
                    <td>${renderStatusBadge(status)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}