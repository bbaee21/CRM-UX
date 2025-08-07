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
  
  // fallback - 실제 백엔드 URL (https:// 포함)
  console.warn('VITE_API_BASE가 올바르게 설정되지 않았습니다');
  return 'https://duck-webapp-001-g0fhhmbzd3eyevc9.westus3-01.azurewebsites.net/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);