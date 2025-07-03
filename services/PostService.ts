// services/PostService.ts
import ApiClient from './ApiClient';

export interface Post {
  postNo: number;
  title: string;
  userName: string;
  content: string;
  imagePaths: string[];
  createdDate: string;
  viewCount: number;
  pathName?: string;
  pathNo?: number;
}

class PostService {
  // 게시글 목록 조회
  async getPosts(limit: number = 20, offset: number = 0): Promise<{ success: boolean; posts: Post[] }> {
    return await ApiClient.request(`/posts?limit=${limit}&offset=${offset}`);
  }

  // 특정 게시글 상세 조회
  async getPost(postNo: number): Promise<{ success: boolean; post: Post }> {
    return await ApiClient.request(`/posts/${postNo}`);
  }

  // 경로 공유 게시글 작성
  async createPostFromPath(data: {
    title: string;
    content: string;
    pathNo?: number;
  }, imageUris: string[] = []) {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.pathNo) {
      formData.append('pathNo', data.pathNo.toString());
    }

    // 이미지 파일 추가
    imageUris.forEach((uri, index) => {
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      } as any);
    });

    return await ApiClient.uploadImages('/posts/create-from-path', formData);
  }
}

export default new PostService();
