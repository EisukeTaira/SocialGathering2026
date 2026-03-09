# Google Apps Script & スプレッドシート 詳細仕様書

本システムを正しく動作させるために、Googleスプレッドシートに以下の3つのシート（タブ）を作成し、1行目に指定のヘッダーを設定してください。

---

## 📊 シート1: `Matches`（リアルタイム試合状況）
**役割**: トップページ（`index.html`）と個別コートページ（`court.html`）に表示する「現在の進行状況」を管理します。

| A: コート番号 | B: チームA | C: チームB | D: チームA得点 | E: チームB得点 | F: 審判 | G: 状況 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **説明** | 何番コートか | 左側のチーム | Aの現在の点 | Bの現在の点 | 審判担当 | 現在の状態 |
| **入力例** | 1 | Aチーム | 21 | 15 | Cチーム | 試合中 |

> [!NOTE]
> 「状況」欄には「試合中」「終了」「次の試合」などを入力してください。

---

## 🌲 シート2: `Bracket`（トーナメント表）
**役割**: トーナメント表（`bracket.html`）の描画と、勝者の自動勝ち上がりを制御します。

| A: ID | B: コート番号 | C: ラウンド | D: 試合順 | E: チームA | F: チームB | G: A得点 | H: B得点 | I: 勝者名 | J: 次の試合ID | K: 次の試合スロット | L: 敗者進む先のID | M: 敗者進むスロット |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | 1 | 1回戦 | 1 | チーム3 | チーム6 | | | | **M3** | **B** | **L1** | **A** |
| **M2** | 1 | 1回戦 | 2 | チーム4 | チーム5 | | | | **M4** | **B** | **L1** | **B** |
| **M3** | 1 | 準決勝 | 1 | チーム1 | (M1勝者) | | | | **M5** | **A** | **L2** | **A** |
| **M4** | 1 | 準決勝 | 2 | チーム2 | (M2勝者) | | | | **M5** | **B** | **L2** | **B** |
| **M5** | 1 | 決勝 | 1 | (M3勝者) | (M4勝者) | | | | | | | |

> [!TIP]
> 6チームの場合、シードチーム（1, 2）はM3, M4から開始するようにデータをセットします。
> 敗者復活戦（裏トーナメント）進む先の試合IDは L1, L2 のようにIDを区別して設定します。

---

## 📝 シート3: `ScoreInput`（得点入力・操作許可）
**役割**: 入力システムからの得点を一時保持し、Adminからの操作許可を管理します。

| A: コート番号 | B: チームA得点 | C: チームB得点 | D: 審判 | E: ステータス | F: 操作許可 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **説明** | 1〜6 | 数値 | 数値 | 名前 | 試合中/終了等 | OK または NG |

---

## 👥 シート4: `Teams`（出場チーム一覧）
**役割**: トーナメントページの下部に表示される、そのコートに参加する全チームのリストです。
(既存の仕様どおり)

| A: コート番号 | B: チーム名 | C: 備考 |
| :--- | :--- | :--- |
| **説明** | コート番号 | 参加するチーム名 | 自由記述 |
| **入力例** | 1 | Aチーム | 昨年度優勝 |
| **入力例** | 1 | Bチーム | |

---

## 🛠️ GAS（Google Apps Script）実装コード
スプレッドシートの「拡張機能」＞「Apps Script」に以下のコードを貼り付け、「デプロイ」＞「新しいデプロイ」で「ウェブアプリ」として公開してください。

```javascript
/**
 * GETリクエスト: データの取得
 */
function doGet(e) {
  var sheetName = e.parameter.sheet || 'Matches';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return createJsonResponse({"error": "Sheet not found"});
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = data.slice(1).map(row => {
    var obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  return createJsonResponse(result);
}

/**
 * POSTリクエスト: データの更新・試合終了処理
 */
function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var action = params.action; // 'updateScore', 'finishMatch', 'setPermission'
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'updateScore') {
    return updateScore(ss, params);
  } else if (action === 'finishMatch') {
    return finishMatch(ss, params);
  } else if (action === 'setPermission') {
    return setPermission(ss, params);
  }
  
  return createJsonResponse({"success": false, "message": "Unknown action"});
}

function updateScore(ss, params) {
  var sheet = ss.getSheetByName('ScoreInput');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == params.court) {
      if (data[i][5] !== 'OK') return createJsonResponse({"success": false, "message": "Permission denied"});
      sheet.getRange(i + 1, 2, 1, 2).setValues([[params.scoreA, params.scoreB]]);
      // Matchesシートも連動更新
      updateMatchesSheet(ss, params.court, params.scoreA, params.scoreB);
      return createJsonResponse({"success": true});
    }
  }
}

function updateMatchesSheet(ss, court, scoreA, scoreB) {
  var sheet = ss.getSheetByName('Matches');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == court) {
      sheet.getRange(i + 1, 4, 1, 2).setValues([[scoreA, scoreB]]);
      break;
    }
  }
}

function finishMatch(ss, params) {
  var court = params.court;
  var scoreInputSheet = ss.getSheetByName('ScoreInput');
  var bracketSheet = ss.getSheetByName('Bracket');
  var matchesSheet = ss.getSheetByName('Matches');
  
  // 1. ScoreInputから最終データ取得
  var scoreInputData = scoreInputSheet.getDataRange().getValues();
  var matchData = null;
  var rowIndexInput = -1;
  
  for (var i = 1; i < scoreInputData.length; i++) {
    if (scoreInputData[i][0] == court) {
      matchData = scoreInputData[i];
      rowIndexInput = i + 1;
      break;
    }
  }
  
  if (!matchData) return createJsonResponse({"success": false, "message": "Court not found"});
  
  var scoreA = matchData[1];
  var scoreB = matchData[2];
  
  // 2. Matchesシートの該当試合を特定 (チーム名取得のため)
  var matchesData = matchesSheet.getDataRange().getValues();
  var teamA = "", teamB = "", rowIndexMatch = -1;
  for (var i = 1; i < matchesData.length; i++) {
    if (matchesData[i][0] == court && matchesData[i][6] === '試合中') {
      teamA = matchesData[i][1];
      teamB = matchesData[i][2];
      rowIndexMatch = i + 1;
      break;
    }
  }
  
  var winnerName = scoreA > scoreB ? teamA : teamB;

  // 3. Bracketシートの該当試合を探して更新
  var bracketData = bracketSheet.getDataRange().getValues();
  for (var i = 1; i < bracketData.length; i++) {
    // チーム名が一致する現在の試合を特定
    if (bracketData[i][4] === teamA && bracketData[i][5] === teamB) {
      bracketSheet.getRange(i + 1, 7, 1, 3).setValues([[scoreA, scoreB, winnerName]]);
      
      // 次の試合へ勝利者を送る
      var nextMatchId = bracketData[i][9]; // J: 次の試合ID
      var nextSlot = bracketData[i][10];   // K: 次の試合スロット (A or B)
      
      if (nextMatchId) {
        updateNextMatch(ss, bracketSheet, bracketData, nextMatchId, nextSlot, winnerName);
      }

      // 次の試合へ敗者を送る
      var loserName = scoreA > scoreB ? teamB : teamA;
      var loserNextMatchId = bracketData[i][11]; // L: 敗者進む先のID
      var loserNextSlot = bracketData[i][12];    // M: 敗者進むスロット (A or B)

      if (loserNextMatchId) {
        updateNextMatch(ss, bracketSheet, bracketData, loserNextMatchId, loserNextSlot, loserName);
      }
      break;
    }
  }

  // (以下、MatchesとScoreInputの更新は既存コード通り)
  if (rowIndexMatch > 0) {
    matchesSheet.getRange(rowIndexMatch, 7).setValue('終了');
  }
  scoreInputSheet.getRange(rowIndexInput, 2, 1, 5).setValues([[0, 0, "", "終了", "NG"]]);

  return createJsonResponse({"success": true, "message": "Match refined and teams propagated."});
}

function updateNextMatch(ss, sheet, data, matchId, slot, teamName) {
  for (var j = 1; j < data.length; j++) {
    if (data[j][0] === matchId) {
      var colIndex = slot === 'A' ? 5 : 6; // E: チームA, F: チームB
      sheet.getRange(j + 1, colIndex).setValue(teamName);
      break;
    }
  }
}

function setPermission(ss, params) {
  var sheet = ss.getSheetByName('ScoreInput');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == params.court) {
      sheet.getRange(i + 1, 6).setValue(params.permission); // 'OK' or 'NG'
      return createJsonResponse({"success": true});
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```
