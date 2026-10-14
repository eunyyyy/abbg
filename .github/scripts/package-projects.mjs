import { mkdirSync, rmSync, existsSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PROJECTS_FALLBACK } from '../../js/projects-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDir = process.env.PROJECT_DOWNLOAD_DIR
  ? resolve(process.env.PROJECT_DOWNLOAD_DIR)
  : join(root, 'project-downloads');
const stagingDir = join(root, '.all-projects-staging');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

// Only strips characters that are actually invalid in a filename (the
// project's own name is otherwise used as-is — spaces, "&", "·" etc. are
// all valid on every filesystem this ever gets extracted on).
function sanitizeFilename(value) {
  return String(value || '').replace(/[\\/:*?"<>|]/g, '-').trim() || 'project';
}

function projectDirectory(project) {
  const parts = decodeURIComponent(new URL(project.url).pathname).split('/').filter(Boolean);
  const landingIndex = parts.indexOf('ai-landingpage');
  if (landingIndex === -1) throw new Error(`프로젝트 URL 경로를 찾을 수 없습니다: ${project.url}`);
  return join(root, ...parts.slice(landingIndex));
}

// The date a project's ZIP is stamped with is that project's own last-changed
// commit date — not "today" (there's no server to know "today" at download
// time on GitHub Pages) and not the whole repo's last commit date either. A
// project nobody has touched since it shipped keeps showing its original
// build date; one that was just edited+redeployed shows that edit's date.
// Requires the workflow's checkout step to use fetch-depth: 0 (full history) —
// a shallow clone would only see the single most recent commit and silently
// report no date for any folder that commit didn't touch.
function lastUpdatedDate(sourceDir) {
  const relPath = relative(root, sourceDir);
  const result = spawnSync('git', ['log', '-1', '--format=%cd', '--date=format:%Y-%m-%d', '--', relPath], {
    cwd: root,
    encoding: 'utf8'
  });
  const out = (result.stdout || '').trim();
  if (result.status !== 0 || !out) {
    console.warn(`  (경고) ${relPath}의 git log 날짜를 찾지 못해 오늘 날짜로 대체합니다.`);
    return new Date().toISOString().slice(0, 10);
  }
  return out;
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });

const manifest = {};
for (const project of PROJECTS_FALLBACK) {
  const sourceDir = projectDirectory(project);
  if (!existsSync(sourceDir)) throw new Error(`프로젝트 폴더가 없습니다: ${relative(root, sourceDir)}`);

  const filename = `project-${project.number}-${slugify(project.name)}.zip`;
  const outputPath = join(outputDir, filename);
  const result = spawnSync('zip', ['-r', '-q', outputPath, basename(sourceDir)], {
    cwd: dirname(sourceDir),
    stdio: 'inherit'
  });
  if (result.status !== 0) throw new Error(`ZIP 생성 실패: ${project.number} ${project.name}`);

  const dateYmd = lastUpdatedDate(sourceDir); // yyyy-mm-dd
  const dateYy = dateYmd.slice(2); // yy-mm-dd

  // "전체 다운받기"가 받는 통합 zip 내부 구조: {yyyy-mm-dd}/{산업분야}/{프로젝트명}_{yy-mm-dd}.zip
  // (숨김 처리된 프로젝트는 공개 사이트 목록에 안 뜨므로 제외)
  if (!project.hidden) {
    const dateDir = join(stagingDir, dateYmd, project.category);
    mkdirSync(dateDir, { recursive: true });
    copyFileSync(outputPath, join(dateDir, `${sanitizeFilename(project.name)}_${dateYy}.zip`));
  }

  manifest[project.number] = { file: filename, updated: dateYmd, hidden: !!project.hidden };
  console.log(`created ${filename} (updated ${dateYmd}${project.hidden ? ', hidden' : ''})`);
}

const allProjectsZip = join(outputDir, 'all-projects.zip');
const allResult = spawnSync('zip', ['-r', '-q', allProjectsZip, '.'], { cwd: stagingDir, stdio: 'inherit' });
if (allResult.status !== 0) throw new Error('통합 ZIP(all-projects.zip) 생성 실패');
console.log('created all-projects.zip');

rmSync(stagingDir, { recursive: true, force: true });
writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
