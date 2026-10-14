# abbg

## 프로젝트 ZIP 다운로드

`main` 브랜치의 `ai-landingpage/**` 또는 `js/projects-data.js`가 변경되면
`.github/workflows/project-downloads.yml`이 각 프로젝트 폴더를 ZIP으로 묶어
`project-downloads` GitHub Release의 자산을 자동으로 갱신합니다.

공개 사이트와 관리자 페이지는 피드백 상태가 `done`(반영 완료)일 때만 프로젝트 번호와
이름으로 계산한 Release 다운로드 링크를 표시합니다. 새 프로젝트를 추가할 때는 실제
프로젝트 폴더와 `js/projects-data.js` 항목을 함께 커밋해야 ZIP도 자동 생성됩니다.

## 프로젝트 복제(리디자인) 시 버전 관리 규칙

"기존 프로젝트를 복제해서 새로 만들고 기존 것은 안 보이게 해달라"는 요청을 처리할 때는
항상 아래 4가지를 함께 합니다 (예: HANDEUL 34→35, ONDAM 29→36, RIWOL 27→37):

1. **원본(백업) 숨김**: `js/projects-data.js`에서 원본 항목에 `hidden: true`,
   `version: 1`을 추가합니다(이미 다른 복제 이력이 있는 체인이면 2, 3…으로 이어서).
   새로 만든 복제본에는 같은 `version`+1 값을 넣습니다(예: 원본 1 → 복제본 2).
   관리자 대시보드 "프로젝트 관리" 탭에 `v{N}` 뱃지로 표시됩니다.
2. **로컬 폴더명 변경**: `ai-landingpage/<산업분야>/` 아래의 원본(백업) 폴더명 오른쪽에
   공백+버전명을 추가합니다. 예: `34.HANDEUL` → `34.HANDEUL v1`. 브랜드명 기준 오른쪽에
   붙이며, 번호 접두사(`34.`)는 그대로 둡니다. **현재 활성(공개) 버전 폴더는 그대로 두고
   건드리지 않습니다.**
   - 폴더명을 바꾸면 `js/projects-data.js`의 해당 항목 `url`도 반드시 함께 수정해야
     합니다(URL 인코딩된 경로 안의 폴더명도 동일하게 바뀌어야 함). 이걸 빠뜨리면
     `.github/scripts/package-projects.mjs`가 폴더를 못 찾아 ZIP 빌드 전체가 실패합니다.
3. **Firestore 반영**: 관리자 대시보드 "프로젝트 관리" 탭의 "시드 데이터 불러오기"를
   한 번 눌러 변경된 `hidden`/`version`/`url` 값을 Firestore에 반영합니다(이미 존재하는
   문서는 병합(merge)되며 덮어써집니다).
4. **git 커밋**: 폴더 rename은 `git mv`로 해서 히스토리를 보존합니다.
