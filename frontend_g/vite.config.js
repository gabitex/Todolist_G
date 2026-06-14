import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('../todolist_g/key.pem'),
      cert: fs.readFileSync('../todolist_g/cert.pem')
    }
  }
})