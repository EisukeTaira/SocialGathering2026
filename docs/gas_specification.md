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

| A: ID | B: コート番号 | C: ラウンド | D: 試合順 | E: チームA | F: チームB | G: A得点 | H: B得点 | I: 勝者名 | J: 次の試合ID | K: 次の試合スロット |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **説明** | 試合ID | コート番号 | 1回戦... | チーム名1 | チーム名2 | Aの最終点 | Bの最終点 | 勝者名 | 進む先のID | A か B を指定 |
| **入力例** | **M1** | 1 | 1回戦 | Aチーム | Bチーム | 21 | 15 | Aチーム | **M3** | **A** |

### 💡 勝者の自動反映（サーバーサイド）
- 試合終了時、勝者の名前が自動的に `次の試合ID` で指定された試合の `チームA` または `チームB`（次の試合スロットで指定）に書き込まれます。

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
  // 1. Bracketシートの更新
  // 2. 勝者を次の試合IDのスロットへ移動
  // 3. Matchesシートを「終了」に更新
  // 4. ScoreInputの許可を「NG」に戻す
  // (詳細なロジックは実装フェーズで構築)
  return createJsonResponse({"success": true, "message": "Match results reflected"});
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
