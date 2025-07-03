import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Image, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import PathService from "../../services/PathService";
import PostService from "../../services/PostService";

export default function CreatePostFromPathScreen() {
  const { pathNo } = useLocalSearchParams();
  const router = useRouter();
  const [pathData, setPathData] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPath, setIsLoadingPath] = useState(true);

  useEffect(() => {
    loadPathData();
  }, [pathNo]);

  const loadPathData = async () => {
    try {
      setIsLoadingPath(true);
      const result = await PathService.getPathDetails(parseInt(pathNo as string));
      if (result.success) {
        setPathData(result.path);
        if (result.path.pathName) {
          setTitle(`${result.path.pathName} 산책 후기`);
        }
      }
    } catch (error) {
      Alert.alert('로딩 실패', '경로 정보를 불러오는데 실패했습니다.');
      console.error('경로 데이터 로딩 실패:', error);
    } finally {
      setIsLoadingPath(false);
    }
  };

  const pickImage = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert('알림', '최대 5장까지 선택할 수 있습니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        pathNo: parseInt(pathNo as string)
      };

      // FormData에 이미지 추가 시 로그 출력
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('pathNo', postData.pathNo.toString());

      selectedImages.forEach((uri, idx) => {
        // Android에서 반드시 type, name 필요
        const imageObj: any = {
          uri,
          type: 'image/jpeg',
          name: `image_${idx}.jpg`,
        };
        console.log('FormData에 추가되는 이미지:', imageObj);
        formData.append('images', imageObj);
      });

      // 실제 업로드
      const response = await fetch('http://10.0.2.2:3000/api/posts/create-from-path', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          '등록 완료',
          '게시글이 성공적으로 등록되었습니다.',
          [
            {
              text: '게시글 보기',
              onPress: () => router.push(`/post/${result.postNo}`)
            },
            {
              text: '게시판 가기',
              onPress: () => router.push('/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('등록 실패', result.message || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      Alert.alert('등록 실패', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPath) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>경로 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>산책길 공유하기</Text>
      {pathData && (
        <View style={styles.pathInfoCard}>
          <Text style={styles.pathInfoTitle}>공유할 경로</Text>
          <Text style={styles.pathName}>{pathData.pathName || `경로 #${pathNo}`}</Text>
          {pathData.pathDescription && (
            <Text style={styles.pathDescription}>{pathData.pathDescription}</Text>
          )}
          <View style={styles.pathStats}>
            <Text style={styles.statText}>
              거리: {pathData.totalDistance ? `${pathData.totalDistance}km` : '미측정'}
            </Text>
            <Text style={styles.statText}>
              시간: {pathData.estimatedTime ? `${pathData.estimatedTime}분` : '미측정'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>제목 *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="게시글 제목을 입력하세요"
          maxLength={200}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>내용 *</Text>
        <TextInput
          style={[styles.input, styles.contentInput]}
          value={content}
          onChangeText={setContent}
          placeholder="산책 경험을 자세히 공유해주세요..."
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>사진 ({selectedImages.length}/5)</Text>
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Text style={styles.addImageText}>+ 사진 추가</Text>
          </TouchableOpacity>
        </View>
        {selectedImages.length > 0 && (
          <ScrollView horizontal style={styles.imageContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? '등록 중...' : '게시글 등록'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  pathInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db'
  },
  pathInfoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#2c3e50' },
  pathName: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#34495e' },
  pathDescription: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  pathStats: { flexDirection: 'row', gap: 16 },
  statText: { fontSize: 12, color: '#888' },
  inputContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  addImageButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  addImageText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa'
  },
  contentInput: { height: 120 },
  imageContainer: { marginTop: 8 },
  imageWrapper: { position: 'relative', marginRight: 8 },
  selectedImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeImageText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  disabledButton: { backgroundColor: '#bdc3c7' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
