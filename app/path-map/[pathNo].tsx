import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Polyline, Marker } from 'react-native-maps';
import PathService from '../../services/PathService';

export default function PathMapScreen() {
    const { pathNo } = useLocalSearchParams();
    const router = useRouter();
    const [pathData, setPathData] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPathData();
    }, [pathNo]);

    const loadPathData = async () => {
        try {
            setIsLoading(true);
            const result = await PathService.getPathDetails(parseInt(pathNo as string));
            
            if (result.success) {
                setPathData(result.path);
                
                // 좌표 데이터를 지도용으로 변환
                const mapCoordinates = result.coordinates.map(coord => ({
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                    type: coord.type,
                    name: coord.name
                }));
                setCoordinates(mapCoordinates);
            }
        } catch (error) {
            Alert.alert('로딩 실패', '경로 데이터를 불러오는데 실패했습니다.');
            console.error('경로 데이터 로딩 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
            </View>
        );
    }

    if (!pathData || coordinates.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>경로 데이터가 없습니다.</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.buttonText}>돌아가기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // 지도 초기 영역 설정
    const region = {
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
    };

    // 시작점과 도착점 찾기
    const startPoint = coordinates.find(coord => coord.type === '출발지') || coordinates[0];
    const endPoint = coordinates.find(coord => coord.type === '도착지') || coordinates[coordinates.length - 1];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.pathTitle}>{pathData.pathName || `경로 #${pathNo}`}</Text>
                    {pathData.pathTagName && (
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{pathData.pathTagName}</Text>
                        </View>
                    )}
                </View>
                
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => router.push(`/create-post-from-path/${pathNo}`)}
                >
                    <Text style={styles.buttonText}>공유하기</Text>
                </TouchableOpacity>
            </View>

            {pathData.pathDescription && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{pathData.pathDescription}</Text>
                </View>
            )}

            <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                    거리: {pathData.totalDistance ? `${pathData.totalDistance}km` : '미측정'}
                </Text>
                <Text style={styles.infoText}>
                    시간: {pathData.estimatedTime ? `${pathData.estimatedTime}분` : '미측정'}
                </Text>
                <Text style={styles.infoText}>포인트: {coordinates.length}개</Text>
            </View>

            <MapView style={styles.map} initialRegion={region}>
                {/* 경로 라인 */}
                <Polyline
                    coordinates={coordinates}
                    strokeColor="#3498db"
                    strokeWidth={4}
                    lineJoin="round"
                    lineCap="round"
                />
                
                {/* 시작점 마커 */}
                <Marker
                    coordinate={startPoint}
                    title="시작점"
                    description={startPoint.name || "경로 시작"}
                    pinColor="green"
                />
                
                {/* 도착점 마커 */}
                <Marker
                    coordinate={endPoint}
                    title="도착점"
                    description={endPoint.name || "경로 끝"}
                    pinColor="red"
                />

                {/* 경유지 마커들 */}
                {coordinates
                    .filter(coord => coord.type === '경유지' && coord.name)
                    .map((coord, index) => (
                        <Marker
                            key={index}
                            coordinate={coord}
                            title={coord.name}
                            pinColor="blue"
                        />
                    ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef'
    },
    headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    pathTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginRight: 8 },
    tagBadge: {
        backgroundColor: '#3498db',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    tagText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    shareButton: {
        backgroundColor: '#28a745',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6
    },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    descriptionContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8f9fa'
    },
    description: { fontSize: 14, color: '#666', lineHeight: 20 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef'
    },
    infoText: { fontSize: 12, color: '#666', fontWeight: '500' },
    map: { flex: 1 },
    loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
    errorText: { fontSize: 16, color: '#e74c3c', textAlign: 'center', marginBottom: 20 },
    backButton: {
        backgroundColor: '#95a5a6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8
    }
});
