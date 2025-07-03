import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PostService from '../../../services/PostService';

export default function SavePathScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [postData, setPostData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPostData();
    }, [id]);

    const loadPostData = async () => {
        try {
            setIsLoading(true);
            const result = await PostService.getPost(parseInt(id as string));
            if (result.success) {
            setPostData(result.post);
            } else {
            Alert.alert('로딩 실패', '게시글 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 로딩 에러:', error);
            Alert.alert('로딩 실패', '게시글 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
        };

    const handleSavePath = () => {
        if (postData?.pathNo) {
            // 게시글에 연결된 경로가 있는 경우
            router.push(`/path-map/${postData.pathNo}`);
        } else {
            Alert.alert('알림', '이 게시글에는 연결된 경로가 없습니다.');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>경로 확인하기</Text>
            
            {postData?.pathNo ? (
                <View style={styles.content}>
                    <Text style={styles.description}>
                        이 게시글에는 "{postData.pathName || '경로'}"가 연결되어 있습니다.
                    </Text>
                    <Text style={styles.subDescription}>
                        지도에서 경로를 확인하시겠습니까?
                    </Text>
                    
                    <TouchableOpacity style={styles.viewButton} onPress={handleSavePath}>
                        <Text style={styles.buttonText}>지도에서 경로 보기</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.description}>
                        이 게시글에는 연결된 경로가 없습니다.
                    </Text>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white', padding: 16 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#2c3e50', textAlign: 'center' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    description: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 16, lineHeight: 24 },
    subDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
    loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
    viewButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginBottom: 16
    },
    backButton: {
        backgroundColor: '#95a5a6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
