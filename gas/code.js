/**
 * VolleyManager GAS バックエンド
 * 
 * 使用シート: Matches, Bracket, ScoreInput, Teams
 */

function doGet(e) {
  const sheetName = e.parameter.sheet || 'Matches';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return createJsonResponse({"error": "シートが見つかりません: " + sheetName});
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const result = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      // JSON用に Date オブジェクトを ISO 文字列に変換
      let val = row[i];
      if (val instanceof Date) val = val.toISOString();
      obj[header] = val;
    });
    return obj;
  });
  
  return createJsonResponse(result);
}

function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({"success": false, "message": "不正なJSON形式です"});
  }
  
  const action = params.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  switch (action) {
    case 'updateScore':
      return handleUpdateScore(ss, params);
    case 'finishMatch':
      return handleFinishMatch(ss, params);
    case 'setPermission':
      return handleSetPermission(ss, params);
    case 'initializeTournament':
      return handleInitializeTournament(ss, params);
    default:
      return createJsonResponse({"success": false, "message": "不明なアクション: " + action});
  }
}

/**
 * リアルタイム・スコアの更新
 */
function handleUpdateScore(ss, params) {
  const { court, scoreA, scoreB } = params;
  const scoreSheet = ss.getSheetByName('ScoreInput');
  const data = scoreSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == court) {
      if (data[i][5] !== 'OK') {
        return createJsonResponse({"success": false, "message": "入力許可がありません (ステータス: " + data[i][5] + ")"});
      }
      
      scoreSheet.getRange(i + 1, 2, 1, 2).setValues([[scoreA, scoreB]]);
      syncToMatches(ss, court, scoreA, scoreB);
      return createJsonResponse({"success": true});
    }
  }
  return createJsonResponse({"success": false, "message": "コートが見つかりません"});
}

function syncToMatches(ss, court, scoreA, scoreB) {
  const matchesSheet = ss.getSheetByName('Matches');
  const data = matchesSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == court) {
      matchesSheet.getRange(i + 1, 4, 1, 2).setValues([[scoreA, scoreB]]);
      break;
    }
  }
}

/**
 * 勝者の確定とトーナメント表への反映
 */
function handleFinishMatch(ss, params) {
  const { court } = params;
  const scoreSheet = ss.getSheetByName('ScoreInput');
  const matchesSheet = ss.getSheetByName('Matches');
  const bracketSheet = ss.getSheetByName('Bracket');
  
  // 1. 現在のチーム名とスコアを取得
  const matchesData = matchesSheet.getDataRange().getValues();
  let matchInfo = null;
  let matchRowIndex = -1;
  
  for (let i = 1; i < matchesData.length; i++) {
    if (matchesData[i][0] == court && matchesData[i][6] === '試合中') {
      matchInfo = {
        teamA: matchesData[i][1],
        teamB: matchesData[i][2],
        scoreA: matchesData[i][3],
        scoreB: matchesData[i][4]
      };
      matchRowIndex = i + 1;
      break;
    }
  }
  
  if (!matchInfo) return createJsonResponse({"success": false, "message": "第 " + court + " コートに進行中の試合が見つかりません"});
  
  const winner = matchInfo.scoreA > matchInfo.scoreB ? matchInfo.teamA : matchInfo.teamB;
  const loser = matchInfo.scoreA > matchInfo.scoreB ? matchInfo.teamB : matchInfo.teamA;

  // 2. Bracket（トーナメント表）シートの更新
  const bracketData = bracketSheet.getDataRange().getValues();
  for (let i = 1; i < bracketData.length; i++) {
    if (bracketData[i][4] === matchInfo.teamA && bracketData[i][5] === matchInfo.teamB) {
      // 結果を書き込み: G:A得点, H:B得点, I:勝者名
      bracketSheet.getRange(i + 1, 7, 1, 3).setValues([[matchInfo.scoreA, matchInfo.scoreB, winner]]);
      
      // 勝者を次の試合へ送る
      const nextId = bracketData[i][9];
      const nextSlot = bracketData[i][10];
      if (nextId) updateBracketSlot(bracketSheet, nextId, nextSlot, winner);
      
      // 敗者を順位決定戦などの次スロットへ送る
      const loserId = bracketData[i][11];
      const loserSlot = bracketData[i][12];
      if (loserId) updateBracketSlot(bracketSheet, loserId, loserSlot, loser);
      break;
    }
  }

  // 3. 「終了」ステータスとタイムスタンプを設定
  matchesSheet.getRange(matchRowIndex, 7, 1, 2).setValues([['終了', new Date()]]);
  
  // ScoreInput をリセット
  const scoreData = scoreSheet.getDataRange().getValues();
  for (let i = 1; i < scoreData.length; i++) {
    if (scoreData[i][0] == court) {
      scoreSheet.getRange(i + 1, 2, 1, 5).setValues([[0, 0, "", "終了", "NG"]]);
      break;
    }
  }

  return createJsonResponse({"success": true});
}

function updateBracketSlot(sheet, id, slot, teamName) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const col = (slot === 'A' || slot === 'A勝者') ? 5 : 6; // E列 または F列
      sheet.getRange(i + 1, col).setValue(teamName);
      break;
    }
  }
}

/**
 * スコア入力の許可/禁止を切り替え
 */
function handleSetPermission(ss, params) {
  const { court, permission } = params; // permission: 'OK' または 'NG'
  const sheet = ss.getSheetByName('ScoreInput');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == court) {
      sheet.getRange(i + 1, 6).setValue(permission);
      return createJsonResponse({"success": true});
    }
  }
  return createJsonResponse({"success": false});
}

/**
 * 初期化処理（現在はプレースホルダー）
 */
function handleInitializeTournament(ss, params) {
  // TeamsシートからBracketを生成するロジック
  return createJsonResponse({"success": true, "message": "現在は手動での初期設定を推奨します。"});
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
