import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import Court from './pages/Court'
import { API_BASE } from './config'

export default function App() {
  const [courts, setCourts] = useState([])

  useEffect(() => {
    let mounted = true
    async function fetchCourts() {
      try {
        const url = API_BASE ? `${API_BASE}/api/courts` : '/api/courts'
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setCourts(data)
      } catch (e) {
        // ignore for now
      }
    }
    fetchCourts()
    const iv = setInterval(fetchCourts, 3000)
    return () => {
      mounted = false
      clearInterval(iv)
    }
  }, [])

  const [route, setRoute] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route.startsWith('#/court/')) {
    const id = route.replace('#/court/', '')
    return <Court id={id} courts={courts} />
  }
  return <Home courts={courts} />
}
