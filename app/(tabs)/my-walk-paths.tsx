import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import PathService from "../../services/PathService";

export default function MyWalkPathsScreen() {
    const router = useRouter();
    const [paths, setPaths] = useState<MyPath[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadMyPaths();
        }, [])
    );

    const loadMyPaths = async () => {
        try {
            setIsLoading(true);
            const result = await PathService.getMyPaths();
            if (result.success) {
                setPaths(result.paths);
            }
        } catch (error) {
            Alert.alert('로딩 실패', '나의 산책길을 불러오는데 실패했습니다.');
            console.error('나의 산책길 로딩 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMyPaths();
        setRefreshing(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    };

    const renderPath = ({ item }: { item: MyPath }) => (
        <View style={styles.pathCard}>
            <View style={styles.pathHeader}>
                <Text style={styles.pathName}>{item.pathName || `경로 #${item.pathNo}`}</Text>
                {item.pathTagName && (
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.pathTagName}</Text>
                    </View>
                )}
            </View>
            
            {item.pathDescription && (
                <Text style={styles.description}>{item.pathDescription}</Text>
            )}
            
            <View style={styles.pathInfo}>
                <Text style={styles.infoText}>
                    거리: {item.totalDistance ? `${item.totalDistance}km` : '미측정'}
                </Text>
                <Text style={styles.infoText}>
                    시간: {item.estimatedTime ? `${item.estimatedTime}분` : '미측정'}
                </Text>
                <Text style={styles.infoText}>저장일: {formatDate(item.createdDate)}</Text>
            </View>
            
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, styles.mapButton]}
                    onPress={() => router.push(`/path-map/${item.pathNo}`)}
                >
                    <Text style={styles.buttonText}>지도 보기</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.button, styles.shareButton]}
                    onPress={() => router.push(`/create-post-from-path/${item.pathNo}`)}
                >
                    <Text style={styles.buttonText}>공유하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading && paths.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.loadingText}>나의 산책길을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>나의 산책길</Text>
            
            {paths.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>저장된 산책길이 없습니다.</Text>
                    <Text style={styles.emptySubText}>GPS로 경로를 기록하고 저장해보세요!</Text>
                    <TouchableOpacity
                        style={styles.recordButton}
                        onPress={() => router.push('/gps-record')}
                    >
                        <Text style={styles.buttonText}>GPS 기록 시작</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={paths}
                    renderItem={renderPath}
                    keyExtractor={(item) => item.pathNo.toString()}
                    style={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 16 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
    loadingText: { fontSize: 16, color: '#666' },
    list: { flex: 1 },
    pathCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    pathHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    pathName: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    tagBadge: {
        backgroundColor: '#3498db',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    tagText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
    pathInfo: { marginBottom: 16 },
    infoText: { fontSize: 13, color: '#888', marginBottom: 4 },
    buttonRow: { flexDirection: 'row', gap: 12 },
    button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    mapButton: { backgroundColor: '#17a2b8' },
    shareButton: { backgroundColor: '#28a745' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40
    },
    emptyText: { fontSize: 18, color: '#666', marginBottom: 8, textAlign: 'center' },
    emptySubText: { fontSize: 14, color: '#999', marginBottom: 30, textAlign: 'center' },
    recordButton: {
        backgroundColor: '#3498db',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8
    }
});
