import React, { useState } from 'react'
import { API_BASE } from '../config'

export default function ScoreInput({ courtId }) {
  const [teamA, setTeamA] = useState('A')
  const [teamB, setTeamB] = useState('B')
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  async function submit(e) {
    e.preventDefault()
    setStatus('送信中...')
    try {
      const url = API_BASE ? `${API_BASE}/api/courts/${courtId}/score` : `/api/courts/${courtId}/score`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA, teamB, scoreA: Number(scoreA), scoreB: Number(scoreB), password })
      })
      if (!res.ok) throw new Error('server')
      setStatus('送信完了')
    } catch (err) {
      setStatus('送信失敗')
    }
    setTimeout(() => setStatus(''), 2000)
  }

  return (
    <form onSubmit={submit} className="score-form">
      <div className="row">
        <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="Team A" />
        <input type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
      </div>
      <div className="row">
        <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="Team B" />
        <input type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
      </div>
      <div className="row">
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="共有パスワード" />
      </div>
      <div className="row">
        <button type="submit">スコア登録</button>
        <span className="status">{status}</span>
      </div>
    </form>
  )
}
