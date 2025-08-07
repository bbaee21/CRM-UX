import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }: { mode: string }) => {
  // mode 가 'production' 이면 .env.production 을, 
  // 'development' 면 .env.development 을 로드
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});