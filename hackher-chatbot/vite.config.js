import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,           // 把port設定成80
    host: '0.0.0.0',    // 設定host成0.0.0.0，才能讓外網訪問
  },
})
