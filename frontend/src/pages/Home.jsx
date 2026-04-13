import React from 'react'

export default function Home({ courts }) {
  const items = courts && courts.length ? courts : Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Court ${i + 1}`, status: 'idle' }))
  return (
    <div className="container">
      <header>
        <h1>新入生歓迎会 — 6コート</h1>
      </header>
      <main className="grid">
        {items.map((c) => (
          <a className="card" key={c.id} href={`#/court/${c.id}`}>
            <h2>{c.name}</h2>
            <p>{c.status || '待機中'}</p>
          </a>
        ))}
      </main>
    </div>
  )
}
