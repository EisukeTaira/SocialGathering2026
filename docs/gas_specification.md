# Google Apps Script & スプレッドシート 詳細仕様書

本システムを正しく動作させるために、Googleスプレッドシートに以下の3つのシート（タブ）を作成し、1行目に指定のヘッダーを設定してください。

---

## 📊 シート1: `Matches`（リアルタイム試合状況）
**役割**: トップページ（`index.html`）と個別コートページ（`court.html`）に表示する「現在の進行状況」を管理します。

| A: コート番号 | B: チームA | C: チームB | D: スコア | E: 審判 | F: 状況 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **説明** | 何番コートか | 左側のチーム | 右側のチーム | 現在の得点 | 審判担当 | 現在の状態 |
| **入力例** | 1 | Aチーム | Bチーム | 21 - 15 | Cチーム | 試合中 |
| **入力例** | 2 | Dチーム | Eチーム | 0 - 0 | Fチーム | 次の試合 |

> [!NOTE]
> 「状況」欄には「試合中」「終了」「次の試合」などの文字を入力してください。

---

## 🌲 シート2: `Bracket`（トーナメント表）
**役割**: トーナメントページ（`bracket.html`）のツリー図を描画し、勝者の自動勝ち上がりを制御します。

| A: ID | B: コート番号 | C: ラウンド | D: 試合順 | E: チームA | F: チームB | G: スコア | H: 勝者ID | I: 次の試合ID | J: 次の試合スロット |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **説明** | 試合の識別子 | コート番号 | 1回戦, 決勝など | チーム名1 | チーム名2 | 最終結果 | A か B を入力 | 進む先のID | A か B を指定 |
| **入力例** | **M1** | 1 | 1回戦 | Aチーム | Bチーム | 21-15 | **A** | **M3** | **A** |
| **入力例** | **M2** | 1 | 1回戦 | Cチーム | Dチーム | 10-21 | **B** | **M3** | **B** |
| **入力例** | **M3** | 1 | 決勝 | (空欄) | (空欄) | | | | |

### 💡 勝者の自動反映ルール
- 試合 **M1** で **勝者ID** に「**A**」と入力すると、自動的に **M3**（次の試合ID）の **チームA**（次の試合スロット）に名前が表示されます。
- これにより、管理者が1箇所（勝者ID）を更新するだけで、トーナメント表が自動で進みます。

---

## 👥 シート3: `Teams`（出場チーム一覧）
**役割**: トーナメントページの下部に表示される、そのコートに参加する全チームのリストです。

| A: コート番号 | B: チーム名 | C: 備考 |
| :--- | :--- | :--- |
| **説明** | コート番号 | 参加するチーム名 | 自由記述 |
| **入力例** | 1 | Aチーム | 昨年度優勝 |
| **入力例** | 1 | Bチーム | |

---

## 🛠️ GAS（Google Apps Script）実装コード
スプレッドシートの「拡張機能」＞「Apps Script」に以下のコードを貼り付け、「デプロイ」＞「新しいデプロイ」で「ウェブアプリ」として公開してください。

```javascript
function doGet(e) {
  // パラメータ sheet が指定されていない場合は 'Matches' をデフォルトにする
  var sheetName = e.parameter.sheet || 'Matches';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({"error": "Sheet not found"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```
