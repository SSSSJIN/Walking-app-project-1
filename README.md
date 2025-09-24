# 🏞️ 산책 경로 공유 앱, '여기갈까?'

> '매일 걷는 똑같은 길이 지겨우신가요?'  
> **'여기갈까?'** 는 사용자들이 자신만의 특별한 산책 경로를 공유하고, 새로운 길을 발견하는 즐거움을 나눌 수 있는 모바일 커뮤니티 플랫폼입니다.



<br/>

## 1. 프로젝트 개요

* **프로젝트 설명**: 새로운 산책길을 찾거나 나만의 산책길을 다른 사람과 공유하는 모바일 커뮤니티 플랫폼입니다.
* **개발 기간**: 2025.05 ~ 2025.06

<br/>

## 2. 팀원 소개

| 신성진 | 이우주 |
|:---:|:---:|
| [GitHub](https://github.com/) | [GitHub](https://github.com/) |

<br/>

## 3. 주요 기능

### ✅ 나만의 산책길 기록 및 공유

* GPS를 이용해 실제 걸은 경로를 실시간으로 기록하거나, 지도 위에 직접 경로를 그려 손쉽게 나만의 산책 코스를 만들 수 있습니다.
* 완성된 경로에 제목, 설명, 사진을 추가하여 커뮤니티 게시판에 공유합니다.

### ✅ 산책길 탐색 및 저장

* 다른 사용자들이 공유한 경로를 최신순, 인기순으로 탐색하고, 마음에 드는 경로는 '나의 산책길'에 저장하여 언제든지 다시 볼 수 있습니다.
* 게시글에서 경로의 총 거리, 예상 소요 시간을 한눈에 확인합니다.

### ✅ 경로 안내 연동

* 선택한 산책 경로의 상세 코스를 지도로 확인하고, '경로 안내 시작' 버튼을 통해 외부 지도 앱(Google/Kakao Maps)과 연동하여 즉시 도보 길 안내를 받을 수 있습니다.

<br/>

## 4. 작업 및 역할 분담

| 이름 | 역할 |
|:---:|:---|
| **신성진** | **`팀장`**, **`경로 안내 기능`**<br/>- 팀 리딩 및 프로젝트 일정 관리<br/>- 외부 지도 API 연동 및 경로 안내 기능 개발<br/>- 서버-클라이언트 간 API 통신 구조 설계 |
| **이우주** | **`게시판 및 경로 기록 기능`**<br/>- 산책 경로 CRUD 게시판 기능 개발<br/>- GPS 좌표 수집 및 지도 위 경로 시각화 로직 구현<br/>- 수동 경로 기록(Polyline) 기능 개발 |

<br/>

## 5. 기술 스택

| 구분 | 기술 |
|:---:|:---|
| **언어** | <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"> |
| **프레임워크** | <img src="https://img.shields.io/badge/react%20native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"> |
| **백엔드** | <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"> <img src="https://img.shields.io/badge/oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white"> |
| **API** | <img src="https://img.shields.io/badge/google%20maps-4285F4?style=for-the-badge&logo=google-maps&logoColor=white"> <img src="https://img.shields.io/badge/SK%20Tmap-E4002B?style=for-the-badge&logo=t-map&logoColor=white"> |
| **협업 도구** | <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white"> |

---
### 🛠️ 기술 선정 이유

* **`React Native`**: iOS와 Android 앱을 하나의 코드 베이스로 동시에 개발하여 **개발 생산성을 극대화**하기 위해 선택했습니다.
* **`TypeScript`**: 정적 타입 시스템을 통해 코드의 안정성을 확보하고, 팀 협업 과정에서 발생할 수 있는 **런타임 에러를 사전에 방지**하여 유지보수가 용이한 코드를 작성하고자 사용했습니다.
* **`Node.js`**: 프론트엔드와 동일한 JavaScript 생태계를 사용하여 개발 환경의 통일성을 유지하고, 비동기 I/O의 강점을 활용해 **실시간 GPS 데이터 요청을 효율적으로 처리**하기에 적합하다고 판단했습니다.
* **`SK Tmap API`**: 프로젝트의 핵심인 '산책 경로' 데이터를 위해 여러 API를 검토한 결과, **국내 골목길 등 도보 환경에 대한 가장 상세하고 정확한 경로 데이터**를 제공했기 때문에 핵심 로직 처리를 위한 API로 선정했습니다.
* **`Google Map API`**: Tmap API의 강력한 경로 데이터 계산 능력과 별개로, React Native 환경에서 **안정적인 지도 시각화(Rendering)와 검증된 SDK 지원**을 위해 도입했습니다. 개발 과정에서 발생한 Tmap JS SDK와의 연동 이슈를 해결하기 위한 전략적 선택이었습니다.

<br/>

## 6. 🤯 트러블 슈팅

### Tmap API 연동 문제와 해결을 위한 전략적 결정

프로젝트 초기, 국내 도보 환경에 최적화된 경로 안내를 위해 Tmap API를 도입했으나, React Native 환경에 JavaScript SDK를 통합하는 과정에서 복합적인 문제에 직면했습니다.

**1. 문제 정의**
Tmap JS SDK 연동 과정에서 **CORS 정책 위반, API 키 인증 실패, 로컬 서버(Tomcat) 구동 실패** 등 다양한 기술적 장벽에 부딪혔습니다. 특히 `"ERR_EMPTY_RESPONSE"` 오류는 개발 환경의 근본적인 비호환성 문제를 시사했습니다.

**2. 다각적인 해결 시도**
문제 해결을 위해 **Tomcat 웹 서버 환경 구성, `encodeURIComponent`를 활용한 인코딩 처리, API 종류에 맞는 정확한 AppKey 재발급 적용** 등 다각적인 노력을 기울였습니다.

**3. 전략적 대안 선택 및 해결**
하지만 근본적인 통합 이슈가 프로젝트 일정에 부담으로 작용하여 **'기능의 완벽한 분리'** 라는 전략적 결정을 내렸습니다.
* **경로 계산 (Backend)**: **Tmap API**의 장점인 정교한 도보 경로 데이터는 그대로 활용하기로 결정하고, Node.js 서버에서 API를 호출하여 경로 좌표값을 계산하는 역할을 유지했습니다.
* **경로 시각화 (Frontend)**: 불안정한 Tmap 지도 대신, React Native 환경에서 검증된 **Google Maps API**를 사용하여 경로를 시각화하기로 했습니다. 서버로부터 전달받은 Tmap 경로 좌표들을 Google Maps의 Polyline 기능으로 지도 위에 그려주는 방식으로 문제를 해결했습니다.

**4. 결과**
이를 통해 **Tmap의 정교한 도보 경로 데이터**와 **Google Maps의 안정적인 렌더링 성능**이라는 두 API의 장점만을 결합하여, 사용자에게 안정적이면서도 정확한 경로 안내 서비스를 제공할 수 있었습니다. 주어진 상황에서 **최적의 사용자 경험을 제공하기 위한 유연한 문제 해결 능력**을 기를 수 있었던 경험이었습니다.
