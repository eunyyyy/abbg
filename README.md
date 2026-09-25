# abbg

## 프로젝트 ZIP 다운로드

`main` 브랜치의 `ai-landingpage/**` 또는 `js/projects-data.js`가 변경되면
`.github/workflows/project-downloads.yml`이 각 프로젝트 폴더를 ZIP으로 묶어
`project-downloads` GitHub Release의 자산을 자동으로 갱신합니다.

공개 사이트와 관리자 페이지는 피드백 상태가 `done`(반영 완료)일 때만 프로젝트 번호와
이름으로 계산한 Release 다운로드 링크를 표시합니다. 새 프로젝트를 추가할 때는 실제
프로젝트 폴더와 `js/projects-data.js` 항목을 함께 커밋해야 ZIP도 자동 생성됩니다.
