// index.ts - 수정된 버전
import axios from "axios";

// 환경에 따른 baseURL 설정
const getBaseURL = () => {
  // 개발환경에서는 로컬 백엔드 또는 프록시 사용
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE || 'http://localhost:8000';
  }
  // 프로덕션에서는 실제 백엔드 URL 사용
  return import.meta.env.VITE_API_BASE || 'duck-webapp-001-g0fhhmbzd3eyevc9.westus3-01.azurewebsites.net';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 1000,
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