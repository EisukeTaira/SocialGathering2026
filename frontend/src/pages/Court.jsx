import React from 'react'
import ScoreInput from '../components/ScoreInput'

export default function Court({ id, courts }) {
  const court = courts && courts.find((c) => String(c.id) === String(id))
  return (
    <div className="container">
      <header>
        <h1>{court?.name || `Court ${id}`}</h1>
        <a className="back" href="#/">← 戻る</a>
      </header>
      <main>
        <section className="card">
          <h3>現在の対戦状況</h3>
          <pre>{JSON.stringify(court || { id }, null, 2)}</pre>
        </section>
        <section className="card">
          <h3>スコア入力</h3>
          <ScoreInput courtId={id} />
        </section>
      </main>
    </div>
  )
}
