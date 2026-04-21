import { escapeHtml, renderSectionTitle, renderStatusBadge } from '../components/ui.js';

function buildAdminFormValues(state) {
  const editingMatch = state.data.matches.find((match) => match.id === state.adminEditingMatchId);
  if (!editingMatch) {
    return {
      id: '',
      courtId: state.selectedCourtId,
      order: '',
      scheduledAt: state.data.scheduleSlots[0],
      teamA: '',
      teamB: '',
      status: 'scheduled',
      teamAScore: '',
      teamBScore: '',
    };
  }

  const score = state.data.scores.find((item) => item.matchId === editingMatch.id);
  return {
    id: editingMatch.id,
    courtId: editingMatch.courtId,
    order: editingMatch.order,
    scheduledAt: editingMatch.scheduledAt,
    teamA: editingMatch.teamA,
    teamB: editingMatch.teamB,
    status: editingMatch.status,
    teamAScore: score?.teamAScore ?? '',
    teamBScore: score?.teamBScore ?? '',
  };
}

function buildCourtTeamValues(state) {
  const selectedCourt =
    state.data.courts.find((court) => court.id === state.selectedCourtId) || state.data.courts[0];

  return {
    selectedCourt,
    teamText: selectedCourt.assignedTeams.join('\n'),
  };
}

export function renderAdminPage(state) {
  const formValues = buildAdminFormValues(state);
  const courtTeamValues = buildCourtTeamValues(state);
  const { courts, matches, scheduleSlots } = state.data;

  return `
    <section class="page-hero page-hero--admin">
      <div>
        <p class="page-hero__eyebrow">Operations Control</p>
        <h1 class="page-hero__title">運営管理</h1>
        <p class="page-hero__description">
          入力受付の切り替え、試合登録、スコア修正をこの画面で行います。
        </p>
      </div>
      <aside class="hero-panel">
        <p class="hero-panel__label">入力受付</p>
        <p class="hero-panel__value">${state.scoreInputEnabled ? '受付中' : '停止中'}</p>
      </aside>
    </section>

    <section class="surface-block surface-block--stack">
      ${renderSectionTitle(
        'Operations',
        '運営設定',
        '入力受付の開始・停止と、運営メッセージの表示を管理します。'
      )}
      <div class="admin-toolbar">
        <button type="button" class="action-button" data-admin-toggle="enable">受付開始</button>
        <button type="button" class="action-button is-secondary" data-admin-toggle="disable">
          受付停止
        </button>
      </div>
      <p class="feedback-message is-neutral">${escapeHtml(state.noticeMessage)}</p>
    </section>

    <section class="admin-grid">
      <section class="surface-block">
        ${renderSectionTitle(
          'Match List',
          '試合一覧',
          '全コートの試合を一覧表示し、編集対象を選択できます。'
        )}
        <div class="table-shell table-shell--compact">
          <table class="match-table match-table--compact">
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">コート</th>
                <th scope="col">時刻</th>
                <th scope="col">対戦</th>
                <th scope="col">状態</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              ${matches
                .slice(0, 18)
                .map(
                  (match) => `
                    <tr>
                      <td>${String(match.order).padStart(2, '0')}</td>
                      <td>${match.courtId}</td>
                      <td>${match.scheduledAt}</td>
                      <td>${match.teamA} vs ${match.teamB}</td>
                      <td>${renderStatusBadge(match.scoreLocked ? 'locked' : match.status)}</td>
                      <td>
                        <button
                          type="button"
                          class="table-action"
                          data-admin-edit="${match.id}"
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="surface-block">
        ${renderSectionTitle(
          'Match Form',
          '編集フォーム',
          '新規登録とスコア修正を共通フォームで行います。'
        )}
        <form class="form-grid" data-form="admin">
          <input type="hidden" name="id" value="${formValues.id}">
          <label class="form-field">
            <span>コート名</span>
            <select name="courtId">
              ${courts
                .map(
                  (court) => `
                    <option value="${court.id}" ${court.id === formValues.courtId ? 'selected' : ''}>
                      ${court.name}
                    </option>
                  `
                )
                .join('')}
            </select>
          </label>
          <label class="form-field">
            <span>試合順</span>
            <input type="number" name="order" min="1" value="${formValues.order}">
          </label>
          <label class="form-field">
            <span>開始予定時刻</span>
            <select name="scheduledAt">
              ${scheduleSlots
                .map(
                  (slot) => `
                    <option value="${slot}" ${slot === formValues.scheduledAt ? 'selected' : ''}>
                      ${slot}
                    </option>
                  `
                )
                .join('')}
            </select>
          </label>
          <label class="form-field">
            <span>チームA</span>
            <input type="text" name="teamA" value="${escapeHtml(formValues.teamA)}">
          </label>
          <label class="form-field">
            <span>チームB</span>
            <input type="text" name="teamB" value="${escapeHtml(formValues.teamB)}">
          </label>
          <label class="form-field">
            <span>状態</span>
            <select name="status">
              <option value="scheduled" ${formValues.status === 'scheduled' ? 'selected' : ''}>未開始</option>
              <option value="in_progress" ${formValues.status === 'in_progress' ? 'selected' : ''}>進行中</option>
              <option value="completed" ${formValues.status === 'completed' ? 'selected' : ''}>終了</option>
            </select>
          </label>
          <label class="form-field">
            <span>スコアA</span>
            <input type="number" name="teamAScore" min="0" value="${formValues.teamAScore}">
          </label>
          <label class="form-field">
            <span>スコアB</span>
            <input type="number" name="teamBScore" min="0" value="${formValues.teamBScore}">
          </label>
          <div class="form-actions form-actions--split">
            <button type="submit" class="action-button">保存</button>
            <button type="button" class="action-button is-secondary" data-admin-clear="true">
              クリア
            </button>
          </div>
        </form>
        ${state.adminMessage ? `<p class="feedback-message is-success">${escapeHtml(state.adminMessage)}</p>` : ''}
      </section>
    </section>

    <section class="admin-grid admin-grid--secondary">
      <section class="surface-block">
        ${renderSectionTitle(
          'Court Teams',
          'コート所属チーム編集',
          '選択したコートの所属チームを改行区切りで編集できます。'
        )}
        <form class="form-grid" data-form="admin-court-teams">
          <label class="form-field">
            <span>編集対象コート</span>
            <select name="courtId" data-role="admin-court-select">
              ${courts
                .map(
                  (court) => `
                    <option value="${court.id}" ${court.id === courtTeamValues.selectedCourt.id ? 'selected' : ''}>
                      ${court.name}
                    </option>
                  `
                )
                .join('')}
            </select>
          </label>
          <label class="form-field form-field--full">
            <span>所属チーム一覧</span>
            <textarea name="teamList" rows="10">${escapeHtml(courtTeamValues.teamText)}</textarea>
          </label>
          <div class="form-actions form-actions--split">
            <button type="submit" class="action-button">所属チームを保存</button>
          </div>
        </form>
        ${state.adminCourtMessage ? `<p class="feedback-message is-success">${escapeHtml(state.adminCourtMessage)}</p>` : ''}
      </section>

      <section class="surface-block">
        ${renderSectionTitle(
          'Schedule Slots',
          '固定タイムテーブル編集',
          '全コート共通で使用する試合時刻を一括編集できます。9:30から15:00の範囲で保存時に既存試合へ同期します。'
        )}
        <form class="schedule-editor" data-form="admin-schedule">
          ${scheduleSlots
            .map(
              (slot, index) => `
                <label class="schedule-editor__row">
                  <span class="schedule-editor__label">第${index + 1}枠</span>
                  <input type="time" name="slot-${index}" value="${slot}" min="09:30" max="15:00">
                </label>
              `
            )
            .join('')}
          <div class="form-actions form-actions--split">
            <button type="submit" class="action-button">タイムテーブルを保存</button>
          </div>
        </form>
        ${state.adminScheduleMessage ? `<p class="feedback-message is-success">${escapeHtml(state.adminScheduleMessage)}</p>` : ''}
      </section>
    </section>

    <section class="surface-block">
      ${renderSectionTitle(
        'Court Teams Snapshot',
        'コート所属チーム一覧',
        '現在登録されている固定所属チームの確認用一覧です。'
      )}
      <div class="team-lists">
        ${courts
          .map(
            (court) => `
              <article class="team-list-card">
                <h3>${court.name}</h3>
                <p>${court.assignedTeams.join(', ')}</p>
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}