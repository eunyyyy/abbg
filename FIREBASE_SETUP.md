# Firebase 설정 (약 2분 소요)

이 저장소의 `index.html` 피드백 섹션은 Firebase Firestore에 연결되기 전까지 "피드백 기능은 Firebase 설정 후 활성화됩니다" 안내만 보여줍니다. 아래 순서대로 진행하면 실시간 피드백 기능이 켜집니다.

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력 (예: `ai-web-hub`) → 애널리틱스는 꺼도 무방 → **프로젝트 만들기**

## 2. Firestore Database 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database** → **데이터베이스 만들기**
2. **프로덕션 모드에서 시작**(production mode) 선택
3. 리전은 가까운 곳 선택 (예: `asia-northeast3 (서울)`) → **사용 설정**

## 3. 보안 규칙(Rules) 붙여넣기
Firestore Database 화면 상단 **규칙(Rules)** 탭 → 아래 내용을 전체 교체 → **게시(Publish)**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback/{docId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['projectNumber','projectName','category','comment','author','createdAt']) &&
        request.resource.data.projectNumber is string &&
        request.resource.data.projectNumber.size() == 2 &&
        request.resource.data.projectName is string &&
        request.resource.data.projectName.size() > 0 && request.resource.data.projectName.size() <= 60 &&
        request.resource.data.category is string &&
        request.resource.data.category.size() > 0 && request.resource.data.category.size() <= 30 &&
        request.resource.data.comment is string &&
        request.resource.data.comment.size() > 0 && request.resource.data.comment.size() <= 500 &&
        (!('author' in request.resource.data) ||
          (request.resource.data.author is string && request.resource.data.author.size() <= 40)) &&
        request.resource.data.createdAt == request.time;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

이 규칙은 `feedback` 컬렉션에 한해서만 누구나 **읽기**와, 정해진 필드 형식(글자수 제한 포함)을 지킨 **새 문서 생성**만 허용하고, 기존 문서의 **수정/삭제는 전부 차단**합니다.

## 4. 웹 앱 등록 → firebaseConfig 복사
1. 왼쪽 위 톱니바퀴 → **프로젝트 설정**
2. **내 앱** 섹션 → `</>` (웹 앱 추가) 클릭 → 앱 닉네임 입력 (예: `ai-web-hub-web`) → Firebase Hosting은 체크하지 않아도 됨 → **앱 등록**
3. 화면에 표시되는 `const firebaseConfig = { ... }` 객체를 통째로 복사

## 5. 코드에 붙여넣기
`js/firebase-feedback.js` 파일 맨 위, 아래 placeholder 블록을 방금 복사한 실제 값으로 교체합니다.

```js
// 교체 전 (현재 상태)
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
```

→ Firebase 콘솔에서 복사한 실제 `firebaseConfig` 객체로 그대로 덮어쓰기.

## 6. 커밋 & 푸시
```
git add js/firebase-feedback.js
git commit -m "Configure Firebase for feedback section"
git push
```

GitHub Pages가 자동으로 반영합니다 (별도 배포 단계 없음). 배포 후 `https://eunyyyy.github.io/abbg/` 접속 → 피드백 섹션에서 안내 문구가 사라지고 실제 제출/실시간 피드가 동작하면 완료입니다.

---
### 참고
- `apiKey`는 Firestore 보안 규칙으로 보호되므로 공개 저장소(GitHub)에 커밋해도 안전합니다 (Firebase의 표준 동작 방식).
- 스팸/남용이 걱정되면 Firebase 콘솔의 **App Check** 기능을 나중에 추가로 켤 수 있습니다 (이 문서 범위 밖).
