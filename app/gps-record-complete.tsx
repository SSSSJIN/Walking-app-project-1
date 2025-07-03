import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import PathService, { type GPSCoordinate } from '../services/PathService';

export default function GPSRecordCompleteScreen() {
    const router = useRouter();
    const { coordinates: coordsParam } = useLocalSearchParams();
    
    const [pathName, setPathName] = useState('');
    const [pathDescription, setPathDescription] = useState('');
    const [selectedTagNo, setSelectedTagNo] = useState(0);
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // URL 파라미터에서 좌표 데이터 파싱 (실제로는 다른 방식으로 전달받을 수 있음)
    const coordinates: GPSCoordinate[] = coordsParam ? JSON.parse(coordsParam as string) : [
        // 샘플 데이터 (실제로는 GPS 추적에서 받아온 데이터)
        { lat: 37.5665, lng: 126.9780, type: 'START', order: 1, name: '시작점' },
        { lat: 37.5675, lng: 126.9790, type: 'WAYPOINT', order: 2 },
        { lat: 37.5685, lng: 126.9800, type: 'WAYPOINT', order: 3 },
        { lat: 37.5695, lng: 126.9810, type: 'END', order: 4, name: '도착점' }
    ];

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const result = await PathService.getPathTags();
            if (result.success) {
                setTags([{ tagNo: 0, tagName: '태그 선택 안함' }, ...result.tags]);
            }
        } catch (error) {
            console.error('태그 로딩 실패:', error);
        }
    };

    const calculateDistance = () => {
        // 간단한 거리 계산 (실제로는 더 정확한 계산 필요)
        let totalDistance = 0;
        for (let i = 1; i < coordinates.length; i++) {
            const prev = coordinates[i - 1];
            const curr = coordinates[i];
            // Haversine 공식 등을 사용하여 실제 거리 계산
            totalDistance += 0.1; // 임시값
        }
        return totalDistance;
    };

    const handleSave = async () => {
        if (!pathName.trim()) {
            Alert.alert('알림', '경로 이름을 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const saveData = {
                pathName: pathName.trim(),
                pathDescription: pathDescription.trim() || undefined,
                pathTagNo: selectedTagNo > 0 ? selectedTagNo : undefined,
                coordinates: coordinates,
                totalDistance: calculateDistance(),
                estimatedTime: 30 // 임시값
            };

            const result = await PathService.saveGPSRecord(saveData);

            if (result.success) {
                Alert.alert(
                    '저장 완료',
                    `GPS 기록이 성공적으로 저장되었습니다.\n경로 번호: ${result.pathNo}`,
                    [
                        {
                            text: '나의 산책길 보기',
                            onPress: () => router.push('/my-walk-paths')
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('저장 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>GPS 기록 완료</Text>
            
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>기록 요약</Text>
                <Text style={styles.summaryText}>• 총 포인트: {coordinates.length}개</Text>
                <Text style={styles.summaryText}>• 예상 거리: {calculateDistance().toFixed(1)}km</Text>
                <Text style={styles.summaryText}>• 시작점: {coordinates[0]?.name || '출발지'}</Text>
                <Text style={styles.summaryText}>• 도착점: {coordinates[coordinates.length - 1]?.name || '도착지'}</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>경로 이름 *</Text>
                <TextInput
                    style={styles.input}
                    value={pathName}
                    onChangeText={setPathName}
                    placeholder="예: 벚꽃길 산책"
                    maxLength={100}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>경로 설명</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={pathDescription}
                    onChangeText={setPathDescription}
                    placeholder="이 경로에 대한 설명을 입력하세요..."
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>경로 태그</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedTagNo}
                        onValueChange={setSelectedTagNo}
                        style={styles.picker}
                    >
                        {tags.map((tag) => (
                            <Picker.Item 
                                key={tag.tagNo} 
                                label={tag.tagName} 
                                value={tag.tagNo} 
                            />
                        ))}
                    </Picker>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.disabledButton]} 
                onPress={handleSave}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? '저장 중...' : '나의 산책길에 저장하기'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 16 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50', textAlign: 'center' },
    summaryCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#3498db'
    },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#2c3e50' },
    summaryText: { fontSize: 14, marginBottom: 6, color: '#555' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8f9fa'
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f8f9fa'
    },
    picker: { height: 50 },
    saveButton: {
        backgroundColor: '#3498db',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40
    },
    disabledButton: { backgroundColor: '#bdc3c7' },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
