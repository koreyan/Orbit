import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'deep_context');
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'intermediate');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 불필요한 티스토리 블로그 보일러플레이트 문자열들
const BOILERPLATE_KEYWORDS = [
  '[본문 바로가기]',
  '카테고리',
  '[분류 전체보기',
  '[역학 이야기',
  '[사주명리학',
  '[자미두수',
  '[육임신과',
  '[유명인 자미두수',
  '[일상이야기',
  '[상담후기',
  '[상담 안내',
  '## 최근글',
  '## 같은 카테고리 글',
  '## 댓글',
  '[저작자표시 비영리 변경금지',
  '도움이 되는 상담이 되도록 노력하겠습니다',
  '✏ 글쓰기',
  '⚙ 관리',
  '↑ TOP',
  '## 태그',
  '## 공지사항',
  '월천 자미두수 상담방',
  '운명을 이해하고삶의 방향을 찾다',
  '자미두수를 바탕으로 당신의 삶과 인연,운의 흐름을 함께 살펴봅니다.',
  'https://luminaries.tistory.com/',
  'https://blog.naver.com/felicitas9/'
];

function isBoilerplate(line: string): boolean {
  if (!line.trim()) return true; // 빈 줄 제거
  return BOILERPLATE_KEYWORDS.some(keyword => line.includes(keyword));
}

function parseMarkdownFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // '---' 로 구분된 포스트 단위로 분리
  const rawPosts = content.split(/^---\s*$/m);
  
  const parsedPosts = [];
  
  let currentTitle = '';
  let currentContent: string[] = [];

  for (let i = 0; i < rawPosts.length; i++) {
    const section = rawPosts[i].trim();
    if (!section) continue;

    // 만약 메타데이터 섹션이라면 (Title: 로 시작)
    if (section.startsWith('Title:')) {
      // 이전 포스트 저장
      if (currentTitle && currentContent.length > 0) {
        parsedPosts.push({
          title: currentTitle,
          content: currentContent.join('\n')
        });
        currentContent = [];
      }

      // 새 메타데이터 파싱
      const lines = section.split('\n');
      for (const line of lines) {
        if (line.startsWith('Title:')) {
          currentTitle = line.replace('Title:', '').trim();
        }
      }
    } else {
      // 본문 섹션 처리
      const lines = section.split('\n');
      for (const line of lines) {
        if (!isBoilerplate(line)) {
          // 불필요한 공백과 특수문자 정리
          currentContent.push(line.trim());
        }
      }
    }
  }

  // 마지막 포스트 저장
  if (currentTitle && currentContent.length > 0) {
    parsedPosts.push({
      title: currentTitle,
      content: currentContent.join('\n')
    });
  }

  return parsedPosts;
}

function main() {
  console.log('Starting structural parsing...');
  
  const filesToParse = ['stars.md', 'palaces.md', 'formations.md', 'practice.md', 'basics.md'];
  
  let totalPosts = 0;

  for (const fileName of filesToParse) {
    const filePath = path.join(DATA_DIR, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Parsing ${fileName}...`);
      const posts = parseMarkdownFile(filePath);
      
      const outputFileName = fileName.replace('.md', '.json');
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf-8');
      console.log(`Saved ${posts.length} posts to ${outputPath}`);
      totalPosts += posts.length;
    } else {
      console.log(`File not found: ${fileName}, skipping.`);
    }
  }

  console.log(`\nParsing completed! Total ${totalPosts} posts extracted.`);
}

main();
