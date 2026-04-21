export function renderStatusBadge(status) {
  const labelMap = {
    scheduled: '未開始',
    in_progress: '進行中',
    completed: '終了',
    locked: '修正制限中',
  };

  return `<span class="status-badge is-${status}">${labelMap[status] || status}</span>`;
}

export function renderSectionTitle(eyebrow, title, description) {
  return `
    <header class="section-header">
      <p class="section-header__eyebrow">${eyebrow}</p>
      <h2 class="section-header__title">${title}</h2>
      <p class="section-header__description">${description}</p>
    </header>
  `;
}

export function getScoreLabel(score) {
  if (!score) {
    return '未入力';
  }

  return `${score.teamAScore} - ${score.teamBScore}`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}