import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PROJECTS_FALLBACK } from '../../js/projects-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDir = process.env.PROJECT_DOWNLOAD_DIR
  ? resolve(process.env.PROJECT_DOWNLOAD_DIR)
  : join(root, 'project-downloads');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function projectDirectory(project) {
  const parts = decodeURIComponent(new URL(project.url).pathname).split('/').filter(Boolean);
  const landingIndex = parts.indexOf('ai-landingpage');
  if (landingIndex === -1) throw new Error(`프로젝트 URL 경로를 찾을 수 없습니다: ${project.url}`);
  return join(root, ...parts.slice(landingIndex));
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

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
  manifest[project.number] = filename;
  console.log(`created ${filename}`);
}

writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
