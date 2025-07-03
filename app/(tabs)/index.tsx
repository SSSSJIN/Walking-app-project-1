import React, { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import PostService, { type Post } from '../../services/PostService';

export default function HomeScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 게시글 목록 불러오기
  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await PostService.getPosts(20, 0);
      if (result.success) {
        setPosts(result.posts);
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // 경로 이미지 URL 생성 함수
  const getPathImage = (pathImage: string) => {
    return `http://10.0.2.2:3000${pathImage}`;
  };

  // 게시글 이미지 URL 생성 함수
  const getImageSource = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) {
      return { uri: imagePath };
    }
    return { uri: `http://10.0.2.2:3000${imagePath}` };
  };

  // 거리, 시간 표시 (서버에서 posts에 totalDistance, estimatedTime 포함 필요)
  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => router.push(`/post/${item.postNo}`)}
    >
      {/* 제목과 작성자 정보 */}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.userNameSmall}>{item.userName}</Text>
      <Text style={styles.postTime}>
        {new Date(item.createdDate).toLocaleDateString('ko-KR')} • 조회 {item.viewCount}
      </Text>

      {/* 본문 내용 */}
      <Text style={styles.postContent}>
        {typeof item.content === 'string'
          ? item.content
          : JSON.stringify(item.content)}
      </Text>

      {/* 이미지 및 정보 영역 */}
      <View style={styles.imageRow}>
        {/* 왼쪽: 경로 이미지 */}
        {item.pathImage && (
          <Image
            source={{ uri: getPathImage(item.pathImage) }}
            style={styles.pathMapImage}
            resizeMode="cover"
          />
        )}

        {/* 오른쪽: 게시글 이미지 2개(세로) */}
        <View style={styles.postImagesCol}>
          {item.imagePaths && item.imagePaths.slice(0, 2).map((img, idx) =>
            img ? (
              <Image
                key={idx}
                source={getImageSource(img) || undefined}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : null
          )}
        </View>
      </View>

      {/* 거리와 시간 표시 */}
      <View style={styles.infoRow}>
        {item.totalDistance !== undefined && (
          <Text style={styles.infoText}>거리: {item.totalDistance} km</Text>
        )}
        {item.estimatedTime !== undefined && (
          <Text style={styles.infoText}>예상 시간: {item.estimatedTime}분</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.postNo.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>게시글이 없습니다.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  postContainer: {
    backgroundColor: 'white',
    marginVertical: 6,
    marginHorizontal: 10,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  userNameSmall: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  postTime: {
    color: '#7f8c8d',
    fontSize: 13,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 20,
    marginBottom: 10,
    lineHeight: 21,
    color: '#2c3e50',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 10,
  },
  pathMapImage: {
    width: 230,
    height: 230,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    marginRight: 10,
  },
  postImagesCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'flex-start',
  },
  postImage: {
    width: 100,
    height: 108,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  infoText: {
    fontSize: 20,
    color: '#333',
    marginRight: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
