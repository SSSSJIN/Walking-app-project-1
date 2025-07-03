# 산책어플 프로젝트

성남 폴리텍 하이테크 과정<br>
개발 기간 : 2025.05~2025.06<br>


<br/>
<br/>

# 0. Getting Started (시작하기)
```bash
$ npm start
```
[서비스 링크](아직없음)

<br/>
<br/>

# 1. Project Overview (프로젝트 개요)
- 프로젝트 이름: 산책 경로 공유 어플
- 프로젝트 설명: 산책길을 기록하고 공유할수 있는 어플이다.

<br/>
<br/>

# 2. Team Members (팀원 및 팀 소개)
| 이우주 | 신성진 |
|:------:|:------:| 
| PL | FE |
| [GitHub](https://github.com/) | [GitHub](https://github.com/) | 

<br/>
<br/>

# 3. Key Features (주요 기능)
- **회원가입**:
  - 회원가입 시 DB에 유저정보가 등록됩니다.

- **로그인**:
  - 사용자 인증 정보를 통해 로그인합니다.

- **경로 기록**:
  - 기록시작시 GPS를 통해 산책경로를 기록할 수 있습니다.
  - 지도를 클릭해 직접 산책 경로를 작성할 수 있습니다.

- **공유 기능**:
  - 저장된 경로를 게시글로 작성해 업로드 할 수 있습니다.
  - 게시판에서 남들이 공유한 경로를 확인할 수 있습니다.

- **경로 안내**:
  - 게시글에서 경로 안내를 원할 경우 카카오지도로 이동해 경로안내를 받을 수 있습니다.

# 4. Tasks & Responsibilities (작업 및 역할 분담)

| 이름   | 사진 | 역할 |
|--------|:----:|------|
| 이우주 | 계획 및 관리 | <br>- 팀 리딩 및 커뮤니케이션<br>- 커스텀 훅 개발 |
| 신성진 | 페이지 개발 | <br>- 동아리 만들기 페이지 개발<br>- 커스텀 훅 개발 |

# 5. Technology Stack (기술 스택)

## 5.1 Language

| 언어        | 아이콘 |
|-------------|:------:|
| TypeScript  |<img src="https://www.typescriptlang.org/images/branding/logo-grouping.svg?style=for-the-badge&logo=typescript&logoColor=white"> | 5.2 Frontend |

| 프레임워크    | 아이콘 | 버전 |
|--------------|:------:|------|
| React Native | ![React Native](https://github.com/user-attachments/assets/e3b49dbb-981b-4804-acf9-012c854a) |  5.3 Backend |

| 백엔드         | 아이콘 | 버전 |
|----------------|:------:|------|
| Node.js        | ![Node.js](https://github.com/user-attachments/assets/1694e458-9bb0-4a0b-8fe6-8ef) | 10.12.5 |
| Oracle Database| <img src="https://img.shields.io/badge/oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white"> | 5.4 API |

| API           | 아이콘 |
|---------------|:------:|
| Google Map API| ![Google Map API](https://img.shields.io/badge/google%20maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)

| 협업 도구 | 아이콘 |
|-----------|:------:|
| Notion    | ![Notion](https://github.com/user-attachments/assets/34141eb9-deca-)

<br/>
<br/>

# 4. Tasks & Responsibilities (작업 및 역할 분담)
|  | 
|-----------------|-----------------|
| 이우주   |  <img src="https://github.com/user-attachments/assets/c1c2b1e3-656d-4712-98ab-a15e91efa2da" alt="이동규" width="100"> | <ul><li>프로젝트 계획 및 관리</li><li>팀 리딩 및 커뮤니케이션</li><li>커스텀훅 개발</li></ul>     |
| 신성진   |  <img src="https://github.com/user-attachments/assets/78ec4937-81bb-4637-975d-631eb3c4601e" alt="신유승" width="100">| <ul><li>메인 페이지 개발</li><li>동아리 만들기 페이지 개발</li><li>커스텀훅 개발</li></ul> |


<br/>
<br/>

# 5. Technology Stack (기술 스택)
## 5.1 Language
|  |
|-----------------|
| Javascript    |  <img src="https://github.com/user-attachments/assets/4a7d7074-8c71-48b4-8652-7431477669d1" alt="Javascript" width="100"> | 

<br/>

## 5.2 Frotend
|  |
|-----------------|
| React Native   |  <img src="https://github.com/user-attachments/assets/e3b49dbb-981b-4804-acf9-012c854a2fd2" alt="React" width="100"> | 18.3.1    |

<br/>

## 5.3 Backend
|  |
|-----------------|-----------------|
| Node.js    |  <img src="https://github.com/user-attachments/assets/1694e458-9bb0-4a0b-8fe6-8efc6e675fa1" alt="Firebase" width="100">    | 10.12.5    |
| Oracle Database    |  <img src="https://github.com/user-attachments/assets/1694e458-9bb0-4a0b-8fe6-8efc6e675fa1" alt="Firebase" width="100">    | 10.12.5    |

<br/>

## 5.4 Api
|  |
|-----------------|
| Google Map Api    |  <img src="https://img.shields.io/badge/java-007396?style=for-the-badge&logo=google&logoColor=white" width="100">    |

<br/>

## 5.5 Cooperation
|  |
|-----------------|
| Notion    |  <img src="https://github.com/user-attachments/assets/34141eb9-deca-416a-a83f-ff9543cc2f9a" alt="Notion" width="100">    |

<br/>

# 6. Project Structure (프로젝트 구조)
```plaintext
project/
├── public/
│   ├── index.html           # HTML 템플릿 파일
│   └── favicon.ico          # 아이콘 파일
├── src/
│   ├── assets/              # 이미지, 폰트 등 정적 파일
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── hooks/               # 커스텀 훅 모음
│   ├── pages/               # 각 페이지별 컴포넌트
│   ├── App.js               # 메인 애플리케이션 컴포넌트
│   ├── index.js             # 엔트리 포인트 파일
│   ├── index.css            # 전역 css 파일
│   ├── firebaseConfig.js    # firebase 인스턴스 초기화 파일
│   package-lock.json    # 정확한 종속성 버전이 기록된 파일로, 일관된 빌드를 보장
│   package.json         # 프로젝트 종속성 및 스크립트 정의
├── .gitignore               # Git 무시 파일 목록
└── README.md                # 프로젝트 개요 및 사용법
```

<br/>
<br/>


