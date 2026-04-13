/*
  Apps Script Web App skeleton for SocialGathering2026
  - Deploy as Web App (Execute as: Me, Access: Anyone)
  - Configure script property SHARED_PASSWORD
  - Create a Google Sheet and note its ID; set SHEET_ID property

  Endpoints (GET/POST routing uses pathInfo when available):
  GET  /api/courts
  GET  /api/courts/{id}
  POST /api/courts/{id}/score
*/

const JSON_MIME = ContentService.MimeType.JSON;

function doGet(e) {
  const path = _getPath(e)
  return handleRequest('GET', path, e, null)
}

function doPost(e) {
  const path = _getPath(e)
  let body = {}
  try { body = JSON.parse(e.postData.contents) } catch (err) { body = {} }
  return handleRequest('POST', path, e, body)
}

function _getPath(e) {
  if (e && e.pathInfo) return e.pathInfo
  if (e && e.parameter && e.parameter.path) return e.parameter.path
  return '/' 
}

function handleRequest(method, path, e, body) {
  try {
    if (method === 'GET' && path === '/api/courts') return getCourts()
    if (method === 'GET' && path.indexOf('/api/courts/') === 0) return getCourt(path)
    if (method === 'POST' && path.indexOf('/api/courts/') === 0 && path.endsWith('/score')) return postScore(path, body)
    return jsonResponse({ error: 'not_found' }, 404)
  } catch (err) {
    return jsonResponse({ error: 'server_error', message: String(err) }, 500)
  }
}

function getCourts() {
  const rows = _readScoreRows()
  const latest = _latestByCourt(rows)
  // Ensure 6 courts
  const courts = Array.from({length:6}, (_,i) => {
    const id = String(i+1)
    return Object.assign({ id, name: `Court ${id}`, status: 'idle' }, latest[id] || {})
  })
  return jsonResponse(courts)
}

function getCourt(path) {
  const parts = path.split('/')
  const id = parts[3]
  const rows = _readScoreRows()
  const latest = _latestByCourt(rows)
  const court = Object.assign({ id, name: `Court ${id}`, status: 'idle' }, latest[id] || {})
  return jsonResponse(court)
}

function postScore(path, body) {
  const parts = path.split('/')
  const id = parts[3]
  const props = PropertiesService.getScriptProperties()
  const shared = props.getProperty('SHARED_PASSWORD') || 'changeme'
  if (!body || body.password !== shared) return jsonResponse({ error: 'unauthorized' }, 401)

  const ssId = props.getProperty('SHEET_ID')
  if (!ssId) return jsonResponse({ error: 'server_error', message: 'SHEET_ID not set' }, 500)

  const sheet = SpreadsheetApp.openById(ssId).getSheetByName('scores') || SpreadsheetApp.openById(ssId).insertSheet('scores')
  // If new sheet, write header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp','courtId','teamA','teamB','scoreA','scoreB','updatedBy'])
  }

  const now = new Date()
  const row = [now.toISOString(), id, body.teamA||'', body.teamB||'', body.scoreA||0, body.scoreB||0, body.updatedBy||'web']
  sheet.appendRow(row)
  return jsonResponse({ ok: true })
}

function _readScoreRows() {
  const props = PropertiesService.getScriptProperties()
  const ssId = props.getProperty('SHEET_ID')
  if (!ssId) return []
  try {
    const sheet = SpreadsheetApp.openById(ssId).getSheetByName('scores')
    if (!sheet) return []
    const data = sheet.getDataRange().getValues()
    // data[0] is header
    const rows = []
    for (let i = 1; i < data.length; i++) {
      const r = data[i]
      rows.push({
        timestamp: r[0], courtId: String(r[1]), teamA: r[2], teamB: r[3], scoreA: r[4], scoreB: r[5], updatedBy: r[6]
      })
    }
    return rows
  } catch (err) {
    return []
  }
}

function _latestByCourt(rows) {
  const map = {}
  rows.forEach(r => {
    map[r.courtId] = r
  })
  return map
}

function jsonResponse(obj, code) {
  const out = ContentService.createTextOutput(JSON.stringify(obj))
  out.setMimeType(JSON_MIME)
  return out
}
