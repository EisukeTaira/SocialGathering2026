const COURT_CONFIGS = [
  {
    id: 'A',
    name: 'Aコート',
    teams: [
      '青葉クラブ',
      '旭スパイカーズ',
      '潮見ウィンズ',
      '海風レッド',
      '桜台VBC',
      '西陵フェニックス',
      '東雲アタッカーズ',
    ],
  },
  {
    id: 'B',
    name: 'Bコート',
    teams: [
      '北星ブレイズ',
      '港南オーシャンズ',
      '緑ヶ丘スパーク',
      '若葉ホークス',
      '白鷺ユナイテッド',
      'さくらネッツ',
      '城南ブレイカーズ',
    ],
  },
  {
    id: 'C',
    name: 'Cコート',
    teams: [
      '山手ソニック',
      '富士見ストーム',
      '南台リバース',
      '高砂ライズ',
      '葵ドリームス',
      '久我山セブン',
      '三鷹チェイサーズ',
    ],
  },
  {
    id: 'D',
    name: 'Dコート',
    teams: [
      '大泉ファルコンズ',
      '平和台エース',
      '千川スプラッシュ',
      '杉並レジェンズ',
      '日野ウルフ',
      '立川フレア',
      '清瀬フォルテ',
    ],
  },
  {
    id: 'E',
    name: 'Eコート',
    teams: [
      '武蔵野サンダー',
      '調布クローバー',
      '町田シャイン',
      '府中アローズ',
      '羽村ブリーズ',
      '国立ノヴァ',
    ],
  },
  {
    id: 'F',
    name: 'Fコート',
    teams: [
      '多摩リーフ',
      '昭島アークス',
      '稲城スカイ',
      '狛江ブルーム',
      '小平スパークル',
      '福生レイヴンズ',
    ],
  },
];

const SCHEDULE_SLOTS = [
  '09:00',
  '09:25',
  '09:50',
  '10:15',
  '10:40',
  '11:05',
  '11:30',
  '11:55',
  '13:00',
  '13:25',
  '13:50',
  '14:15',
  '14:40',
  '15:05',
  '15:30',
  '15:55',
  '16:20',
  '16:45',
  '17:10',
  '17:35',
  '18:00',
];

const SCHEDULE_OVERVIEW = [
  { time: '08:30', label: '開場・代表者受付' },
  { time: '08:45', label: '審判ミーティング / コート確認' },
  { time: '09:00', label: '第1試合開始' },
  { time: '11:55', label: '午前最終試合開始' },
  { time: '12:20', label: '昼休憩 / 集計中間確認' },
  { time: '13:00', label: '午後試合開始' },
  { time: '15:55', label: '終盤カード開始' },
  { time: '17:35', label: '最終試合開始予定' },
  { time: '18:10', label: '表彰準備・撤収開始' },
];

const COURT_PROGRESS = {
  A: { completed: 3, inProgress: 1 },
  B: { completed: 2, inProgress: 1 },
  C: { completed: 4, inProgress: 1 },
  D: { completed: 3, inProgress: 1 },
  E: { completed: 2, inProgress: 1 },
  F: { completed: 2, inProgress: 1 },
};

function getMatchStatus(courtId, order) {
  const progress = COURT_PROGRESS[courtId];
  if (order <= progress.completed) {
    return 'completed';
  }
  if (order === progress.completed + 1) {
    return 'in_progress';
  }
  return 'scheduled';
}

function buildScore(order) {
  const losingScore = 14 + ((order * 3) % 7);
  return [21, losingScore];
}

function buildRoundRobinMatches(courtConfig, scheduleSlots = SCHEDULE_SLOTS) {
  const matches = [];
  let order = 1;

  for (let teamIndex = 0; teamIndex < courtConfig.teams.length; teamIndex += 1) {
    for (
      let opponentIndex = teamIndex + 1;
      opponentIndex < courtConfig.teams.length;
      opponentIndex += 1
    ) {
      matches.push({
        id: `${courtConfig.id}-${String(order).padStart(2, '0')}`,
        courtId: courtConfig.id,
        order,
        scheduledAt: scheduleSlots[(order - 1) % scheduleSlots.length],
        teamA: courtConfig.teams[teamIndex],
        teamB: courtConfig.teams[opponentIndex],
        status: getMatchStatus(courtConfig.id, order),
        winner: '',
        updatedAt: '2026-04-21 08:30',
        inputEnabled: true,
        scoreLocked: false,
      });
      order += 1;
    }
  }

  return matches;
}

function buildInitialScores(matches) {
  return matches
    .filter((match) => match.status === 'completed')
    .map((match) => {
      const [teamAScore, teamBScore] = buildScore(match.order);

      return {
        matchId: match.id,
        setNumber: 1,
        teamAScore,
        teamBScore,
      };
    });
}

export function regenerateCourtTournamentData(courtId, teams, scheduleSlots = SCHEDULE_SLOTS) {
  const courtConfig = {
    id: courtId,
    name: `${courtId}コート`,
    teams,
  };
  const matches = buildRoundRobinMatches(courtConfig, scheduleSlots);
  const scores = buildInitialScores(matches);
  const hydratedMatches = applyResults(matches, scores);

  return {
    matches: hydratedMatches,
    scores,
  };
}

function applyResults(matches, scores) {
  const scoreMap = new Map(scores.map((score) => [score.matchId, score]));

  return matches.map((match) => {
    const score = scoreMap.get(match.id);
    if (!score) {
      return match;
    }

    const winner = score.teamAScore > score.teamBScore ? match.teamA : match.teamB;
    const scoreLocked = match.status === 'completed';

    return {
      ...match,
      winner,
      scoreLocked,
      updatedAt: '2026-04-21 08:45',
    };
  });
}

const rawMatches = COURT_CONFIGS.flatMap(buildRoundRobinMatches);
const rawScores = buildInitialScores(rawMatches);
const matches = applyResults(rawMatches, rawScores);

export const tournamentData = {
  courts: COURT_CONFIGS.map((courtConfig) => ({
    id: courtConfig.id,
    name: courtConfig.name,
    assignedTeams: [...courtConfig.teams],
    scheduleSlots: [...SCHEDULE_SLOTS],
  })),
  matches,
  scores: rawScores,
  scheduleSlots: SCHEDULE_SLOTS,
  scheduleOverview: SCHEDULE_OVERVIEW,
};

export const initialState = {
  selectedPage: 'index',
  selectedCourtId: 'A',
  selectedMatchId: '',
  noticeMessage: '昼休憩後の再集合は12:50です。各コート代表は進行確認を行ってください。',
  lastUpdatedAt: '2026-04-21 08:45',
  debugMessage: '初期状態: index を表示予定',
  scoreInputEnabled: true,
  scoreFormMessage: '',
  scoreFormError: '',
  adminMessage: '',
  adminCourtMessage: '',
  adminScheduleMessage: '',
  adminEditingMatchId: '',
};