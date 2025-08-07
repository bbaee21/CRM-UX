// index.ts - 수정된 버전
import axios from "axios";

// 환경에 따른 baseURL 설정
const getBaseURL = () => {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  // 개발환경에서는 로컬 백엔드 사용
  if (import.meta.env.DEV) {
    return apiBase || 'http://localhost:8000';
  }
  
  // 프로덕션에서는 반드시 https://로 시작하는 완전한 URL 사용
  if (apiBase && apiBase.startsWith('https://')) {
    return apiBase;
  }
  
  // fallback (실제 백엔드 URL로 교체 필요)
  console.warn('VITE_API_BASE가 올바르게 설정되지 않았습니다');
  return 'https://duck-webapp-001.azurewebsites.net'; // 실제 백엔드 URL로 교체
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 테스트 록
console.log('Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('VITE_API_BASE:', import.meta.env.VITE_API_BASE);
console.log('Final baseURL:', getBaseURL());

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);