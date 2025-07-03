import ApiClient from './ApiClient';

export interface GPSCoordinate {
    lat: number;
    lng: number;
    type: 'START' | 'WAYPOINT' | 'END';
    order?: number;
    name?: string;
}

export interface SaveGPSRecordRequest {
    pathName?: string;
    pathDescription?: string;
    pathTagNo?: number;
    coordinates: GPSCoordinate[];
    totalDistance?: number;
    estimatedTime?: number;
}

export interface MyPath {
    pathNo: number;
    pathName: string;
    pathDescription: string;
    totalDistance: number;
    estimatedTime: number;
    createdDate: string;
    pathTagName: string;
    startLatitude: number;
    startLongitude: number;
}

class PathService {
    // GPS 기록 종료 후 저장
    async saveGPSRecord(data: SaveGPSRecordRequest) {
        return await ApiClient.request('/paths/save-gps-record', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // 나의 산책길 목록 조회
    async getMyPaths(): Promise<{ success: boolean; paths: MyPath[] }> {
        return await ApiClient.request('/paths/my-paths');
    }

    // 특정 경로의 상세 좌표 조회
    async getPathDetails(pathNo: number) {
        return await ApiClient.request(`/paths/${pathNo}/details`);
    }

    // 경로 태그 목록 조회
    async getPathTags() {
        return await ApiClient.request('/paths/tags');
    }
}

export default new PathService();
