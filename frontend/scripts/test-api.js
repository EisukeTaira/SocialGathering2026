const fetch = require('node-fetch')
const { execSync } = require('child_process')
const path = require('path')

// Reads API_BASE from src/config.js
const cfgPath = path.resolve(__dirname, '..', 'src', 'config.js')
const cfg = require(cfgPath)
const API_BASE = cfg.API_BASE || ''

if (!API_BASE) {
  console.error('API_BASE is not set in frontend/src/config.js')
  process.exit(2)
}

async function main(){
  try{
    console.log('Testing GET', `${API_BASE}/api/courts`)
    const res = await fetch(`${API_BASE}/api/courts`)
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', text)
  }catch(err){
    console.error('Request failed:', err.message)
    process.exit(1)
  }
}

main()
