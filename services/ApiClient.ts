import { Platform } from 'react-native'; 

const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api' 
  : 'http://172.31.57.139:3000/api';; // 실제 서버 주소로 변경

class ApiClient {
    private baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '요청 실패');
            }

            return data;
        } catch (error) {
            console.error('API 요청 실패:', error);
            throw error;
        }
    }

    async uploadImages(endpoint: string, formData: FormData) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '업로드 실패');
            }

            return data;
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            throw error;
        }
    }
}

export default new ApiClient();
