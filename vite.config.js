import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: en producción la web vive en https://USUARIO.github.io/KorbaxPrueb/
// En dev (npm run dev) queda en '/'. Cambia '/KorbaxPrueb/' si renombras el repo.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/KorbaxPrueb/' : '/',
  plugins: [react()],
}))
