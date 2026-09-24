# Firebase 설정 (약 3분 소요)

이 저장소의 `index.html` 피드백 섹션과 `admin/` 관리자 대시보드는 Firebase(Firestore + Authentication)에 연결되기 전까지 각각 "피드백 기능은 Firebase 설정 후 활성화됩니다" / "설정 필요" 안내만 보여줍니다. 아래 순서대로 진행하면 실시간 피드백, 프로젝트 관리, 관리자 로그인이 모두 켜집니다.

공개 사이트의 프로젝트 목록(마퀴·프로젝트 아카이브·피드백 선택기)은 `projects` 컬렉션이 비어 있거나 연결에 실패해도 저장소에 내장된 16개 프로젝트로 정상 동작합니다 — Firestore는 어드민에서 프로젝트를 추가·수정·삭제할 수 있게 해주는 선택적 상위 레이어입니다.

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력 (예: `ai-web-hub`) → 애널리틱스는 꺼도 무방 → **프로젝트 만들기**

## 2. Firestore Database 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database** → **데이터베이스 만들기**
2. **프로덕션 모드에서 시작**(production mode) 선택
3. 리전은 가까운 곳 선택 (예: `asia-northeast3 (서울)`) → **사용 설정**

## 3. Authentication 활성화 (관리자 로그인용)
`admin/` 대시보드 로그인은 Firebase Authentication의 **이메일/비밀번호** 제공업체가 켜져 있어야 동작합니다. Firestore만 켜고 이 단계를 건너뛰면 로그인 폼에서 항상 실패합니다.
1. 왼쪽 메뉴 **빌드 → Authentication** → **시작하기**
2. **Sign-in method** 탭 → **이메일/비밀번호** 선택 → 사용 설정(첫 번째 토글만 켜면 됨, 이메일 링크 로그인은 불필요) → **저장**
3. **Users** 탭 → **사용자 추가** → 관리자 이메일/비밀번호 입력 → 저장
   - 이 저장소에는 회원가입 화면이 없습니다. 관리자 계정은 반드시 이 콘솔 화면에서 수동으로 1명만 만듭니다(사전 프로비저닝된 단일 마스터 관리자 계정).

## 4. 보안 규칙(Rules) 붙여넣기
Firestore Database 화면 상단 **규칙(Rules)** 탭 → 아래 내용을 전체 교체 → **게시(Publish)**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /feedback/{docId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['projectNumber','projectName','category','comment','author','status','createdAt']) &&
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
        // every new feedback starts out 대기중(pending) — only an admin update can move it on
        request.resource.data.status == 'pending' &&
        request.resource.data.createdAt == request.time;
      // 상태값(대기중/진행중/반영완료)과 답글은 로그인한 관리자만 수정할 수 있고,
      // 그 외 필드(작성자가 쓴 내용)는 절대 건드릴 수 없습니다.
      allow update: if request.auth != null &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status','reply','repliedAt']) &&
        request.resource.data.status in ['pending','in_progress','done'];
      // 로그인한 관리자(admin/ 대시보드)만 피드백을 삭제할 수 있습니다.
      allow delete: if request.auth != null;
    }

    match /projects/{docId} {
      // 공개 사이트(js/main.js)는 누구나 읽을 수 있어야 마퀴/프로젝트 목록/피드백 선택기가 뜹니다.
      allow read: if true;
      // 프로젝트 추가/수정/삭제는 로그인한 관리자만 (admin/ 대시보드의 프로젝트 관리 탭).
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

이 규칙은:
- `feedback` 컬렉션 — 누구나 **읽기**, 정해진 필드 형식을 지킨 **생성**은 그대로 공개 허용(신규 피드백은 항상 `status: 'pending'`(대기중)으로 시작), **삭제**는 로그인한 관리자만 가능. **수정**은 로그인한 관리자가 `status`(대기중/진행중/반영완료)와 `reply`(답글)만 바꿀 수 있도록 허용되고, 그 외 필드는 절대 수정할 수 없습니다.
- `projects` 컬렉션 — 누구나 **읽기**는 가능하지만, **생성/수정/삭제**는 로그인한 관리자만 가능합니다 (관리자 대시보드의 프로젝트 관리 탭에서 추가/수정/삭제 및 최초 시드 데이터 불러오기에 사용).

## 5. 웹 앱 등록 → firebaseConfig 복사
1. 왼쪽 위 톱니바퀴 → **프로젝트 설정**
2. **내 앱** 섹션 → `</>` (웹 앱 추가) 클릭 → 앱 닉네임 입력 (예: `ai-web-hub-web`) → Firebase Hosting은 체크하지 않아도 됨 → **앱 등록**
3. 화면에 표시되는 `const firebaseConfig = { ... }` 객체를 통째로 복사

## 6. 코드에 붙여넣기
설정은 `js/firebase-config.js` **한 파일**에만 있습니다 (피드백 섹션, 공개 사이트의 프로젝트 목록, 관리자 로그인/대시보드가 전부 이 파일을 가져다 씁니다). 파일 안의 아래 placeholder 블록을 방금 복사한 실제 값으로 교체합니다.

```js
// 교체 전 (현재 상태) — js/firebase-config.js
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
```

→ Firebase 콘솔에서 복사한 실제 `firebaseConfig` 값들로 각 필드를 그대로 덮어쓰기 (파일의 `export const firebaseConfig = { ... }` 구조 자체는 유지). `js/firebase-feedback.js`, `js/main.js`, `admin/js/admin-login.js`, `admin/js/admin-dashboard.js`는 모두 이 파일을 import하므로 별도로 손댈 필요가 없습니다.

## 7. (최초 1회) 프로젝트 데이터 시드
1. 관리자 계정으로 `https://eunyyyy.github.io/abbg/admin/` 에서 로그인
2. **프로젝트 관리** 탭 → **시드 데이터 불러오기 (최초 1회)** 클릭
3. 저장소에 내장된 16개 프로젝트(js/projects-data.js)가 Firestore `projects` 컬렉션에 채워집니다. 이후부터는 같은 탭에서 추가/수정/삭제로 관리합니다.

## 8. 커밋 & 푸시
```
git add js/firebase-config.js
git commit -m "Configure Firebase project"
git push
```

GitHub Pages가 자동으로 반영합니다 (별도 배포 단계 없음). 배포 후 `https://eunyyyy.github.io/abbg/` 접속 → 피드백 섹션에서 안내 문구가 사라지고 실제 제출/실시간 피드가 동작하면 완료입니다. `https://eunyyyy.github.io/abbg/admin/` 에서도 안내 문구 대신 실제 로그인 폼이 동작해야 합니다.

---
### 참고
- `apiKey`는 Firestore 보안 규칙으로 보호되므로 공개 저장소(GitHub)에 커밋해도 안전합니다 (Firebase의 표준 동작 방식).
- `admin/`은 공개 홈페이지 어디에도 링크되어 있지 않습니다. 주소를 직접 아는 사람만 접근할 수 있고, 그 안에서도 사전에 생성한 관리자 계정으로 로그인해야 대시보드가 열립니다.
- 스팸/남용이 걱정되면 Firebase 콘솔의 **App Check** 기능을 나중에 추가로 켤 수 있습니다 (이 문서 범위 밖).
