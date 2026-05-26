const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const categories = ['stars', 'palaces', 'formations', 'topics'];
categories.forEach(cat => {
  const dir = path.join(srcDir, cat);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const files = ['basics.md', 'stars.md', 'palaces.md', 'formations.md', 'practice.md'];

const index = { stars: {}, palaces: {}, formations: {}, topics: {} };

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split by "---" with some heuristics to find Title
  const sections = content.split(/---\s*[\r\n]+Title:/);
  
  let targetCategory = 'topics';
  if (file === 'stars.md') targetCategory = 'stars';
  else if (file === 'palaces.md') targetCategory = 'palaces';
  else if (file === 'formations.md') targetCategory = 'formations';

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const firstLineEnd = section.indexOf('\n');
    let title = section.substring(0, firstLineEnd).trim();
    
    // Find the end of the frontmatter block
    const fmEnd = section.indexOf('\n---');
    if (fmEnd === -1) continue;
    
    let text = section.substring(fmEnd + 4);
    
    // Clean up text
    const startIdx = text.indexOf('안녕하세요 월천 자미두수');
    if (startIdx !== -1) {
      text = text.substring(startIdx);
    } else {
      const lines = text.split('\n');
      const filtered = [];
      let inNav = true;
      for (const line of lines) {
        if (inNav && (line.includes('[본문 바로가기]') || line.includes('카테고리') || line.includes('분류 전체보기') || line.includes('역학 이야기') || line.match(/\]\(https:\/\/luminaries\.tistory\.com/))) {
          continue;
        }
        if (line.includes('안녕하세요')) inNav = false;
        if (!inNav) filtered.push(line);
      }
      text = filtered.join('\n');
    }
    
    const endIdx = text.indexOf('[저작자표시 비영리 변경금지');
    if (endIdx !== -1) {
      text = text.substring(0, endIdx);
    }
    
    text = text.trim();
    
    if (text.length > 50) {
      let safeTitle = title.replace(/[\/\?<>\\:\*\|":]/g, '').replace(/\s+/g, '_');
      const outPath = path.join(srcDir, targetCategory, `${safeTitle}.md`);
      fs.writeFileSync(outPath, `# ${title}\n\n${text}`);
      
      index[targetCategory][safeTitle] = {
        file: `${targetCategory}/${safeTitle}.md`,
        tokens_approx: Math.ceil(text.length / 2)
      };
    }
  }
});

fs.writeFileSync(path.join(srcDir, 'index.json'), JSON.stringify(index, null, 2));

console.log('Processing complete. Index written to index.json.');
