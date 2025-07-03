import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import PostService, { type Post } from '../../services/PostService';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const result = await PostService.getPost(parseInt(id as string));
      if (result.success) {
        setPost(result.post);
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>게시글을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  // 이미지 경로 처리 함수
  const getImageSource = (imagePath: string) => {
    if (imagePath.startsWith('http')) return { uri: imagePath };
    return { uri: `http://10.0.2.2:3000${imagePath}` };
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: 'https://via.placeholder.com/40' }}
          style={styles.profileImage}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.postTime}>
            {new Date(post.createdDate).toLocaleDateString('ko-KR')} • 조회 {post.viewCount}
          </Text>
        </View>
      </View>

      {/* 제목 (있는 경우) */}
      {post.title && (
        <Text style={styles.postTitle}>{post.title}</Text>
      )}

      {/* 이미지 슬라이더 */}
      {(post.pathImage || post.imagePaths?.length > 0) && (
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setActiveIndex(idx);
          }}
        >
          {/* 경로 이미지를 첫 번째로 표시 */}
          {post.pathImage && (
            <Image
              source={getImageSource(post.pathImage)}
              style={[styles.postImage, { width: screenWidth - 32 }]}
            />
          )}
          
          {/* 게시글 이미지들 */}
          {post.imagePaths?.map((img, idx) => (
            <Image
              key={idx}
              source={getImageSource(img)}
              style={[styles.postImage, { width: screenWidth - 32 }]}
            />
          ))}
        </ScrollView>
      )}

      {/* 경로 정보 표시 변경 */}
      {(post.totalDistance || post.estimatedTime) && (
        <View style={styles.pathInfoContainer}>
          {post.totalDistance && (
            <Text style={styles.pathInfoText}>총 거리: {post.totalDistance}km</Text>
          )}
          {post.estimatedTime && (
            <Text style={styles.pathInfoText}>예상 시간: {post.estimatedTime}분</Text>
          )}
        </View>
      )}


      {/* 버튼 2개 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => router.push(`/post/${id}/save-path`)}
        >
          <Text style={styles.buttonText}>경로 저장</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.navigateButton]}
          onPress={() => router.push(`/post/${id}/navigate-path`)}
        >
          <Text style={styles.buttonText}>경로 안내</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  headerText: { flex: 1 },
  userName: { fontWeight: 'bold', fontSize: 18, color: '#2c3e50' },
  postTime: { color: '#7f8c8d', fontSize: 13, marginTop: 4 },
  postTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    color: '#2c3e50',
    lineHeight: 28,
  },
  postContent: { 
    fontSize: 16, 
    marginVertical: 16, 
    lineHeight: 24, 
    color: '#2c3e50',
  },
  imageSlider: { marginVertical: 12 },
  postImage: {
    height: 300,
    resizeMode: 'cover',
    borderRadius: 8,
    marginRight: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 3,
  },
  indicatorActive: {
    backgroundColor: '#3B82F6',
  },
  pathInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    gap: 8,
  },
  pathInfoText: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  navigateButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
});
