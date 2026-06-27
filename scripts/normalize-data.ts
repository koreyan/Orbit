import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// 환경 변수 로드 (.env 혹은 .env.local 지원)
import { config } from 'dotenv';
config();
config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY is not defined in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Structured Output 강제 적용 (토큰 낭비 방지 및 데이터 품질 확보)
const interpretationSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      target_subject: { type: SchemaType.STRING, description: "텍스트의 주요 주제 (예: 태양성 명궁, 거문성 부처궁 등)" },
      teaser_quote: { type: SchemaType.STRING, description: "[결제 전 후킹용] 명반 페이지에서 유저의 호기심을 유발할 수 있는 짧고 강렬한 미끼 문구 (예: 타고난 리더십! 하지만 2026년에 예상치 못한 변수가...)" },
      core_trait: { type: SchemaType.STRING, description: "고유한 성향, 강점 및 잠재적 단점 요약" },
      career_insight: { type: SchemaType.STRING, description: "잠재력을 극대화할 수 있는 진로 및 직업 방향성" },
      love_insight: { type: SchemaType.STRING, description: "연애 및 대인관계 조언" },
      wellness_insight: { type: SchemaType.STRING, description: "취미, 여가, 심리적 만족도 증진 플랜" },
      periodic_insight: { type: SchemaType.STRING, description: "사화나 대운에 따른 시기별 핵심 액션 플랜" },
    },
    required: ["target_subject", "teaser_quote", "core_trait", "career_insight", "love_insight", "wellness_insight", "periodic_insight"]
  }
};

// 1. 저비용/고속 모델 (가성비 최강)
const flashModel = genAI.getGenerativeModel({ 
  model: 'gemini-3.5-flash', 
  generationConfig: { responseMimeType: "application/json", responseSchema: interpretationSchema } 
});

// 2. 고품질/고비용 모델 (추론 능력 최상)
const proModel = genAI.getGenerativeModel({ 
  model: 'gemini-3.1-pro-preview', 
  generationConfig: { responseMimeType: "application/json", responseSchema: interpretationSchema } 
});

const INTERMEDIATE_DIR = path.join(process.cwd(), 'data', 'intermediate');
const SEED_DIR = path.join(process.cwd(), 'data', 'seed');

if (!fs.existsSync(SEED_DIR)) {
  fs.mkdirSync(SEED_DIR, { recursive: true });
}

const PROMPT_TEMPLATE = `
너는 자미두수 명리학 해석 데이터를 완벽하게 구조화하는 데이터 엔지니어이자 최고 수준의 역학 전문가야.
다음 제공되는 [원본 텍스트]를 분석해서, 명리학 데이터베이스 스키마에 맞게 4가지 핵심 가치 관점으로 분리해 줘.
내용이 없다면 빈 문자열("")로 남겨도 좋아. 억지로 지어내지는 마.

[원본 텍스트]
`;

interface InterpretationItem {
  core_trait?: string;
  career_insight?: string;
  love_insight?: string;
  wellness_insight?: string;
}

interface GeminiResult {
  response: {
    text(): string;
  };
}

interface GeminiModel {
  generateContent(prompt: string): Promise<GeminiResult>;
}

// 품질 검증 함수: 추출된 결과가 부실한지 체크
function isQualityPoor(parsedJson: InterpretationItem[]): boolean {
  if (!parsedJson || parsedJson.length === 0) return true;
  
  for (const item of parsedJson) {
    let emptyCount = 0;
    if (!item.core_trait || item.core_trait.trim() === '') emptyCount++;
    if (!item.career_insight || item.career_insight.trim() === '') emptyCount++;
    if (!item.love_insight || item.love_insight.trim() === '') emptyCount++;
    if (!item.wellness_insight || item.wellness_insight.trim() === '') emptyCount++;
    
    if (emptyCount >= 3) return true;
  }
  return false;
}

// 자동 재시도 래퍼 (503 등 일시적 서버 오류 대응)
async function generateWithRetry(model: GeminiModel, prompt: string, maxRetries = 3): Promise<GeminiResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: unknown) {
      const apiError = error as { status?: number; message?: string };
      if (attempt === maxRetries) throw error;
      console.log(`\n⚠️ API Error (${apiError.status || apiError.message}). Retrying in ${attempt * 5} seconds... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, attempt * 5000));
    }
  }
}

async function processFile(fileName: string) {
  const filePath = path.join(INTERMEDIATE_DIR, fileName);
  if (!fs.existsSync(filePath)) return;

  console.log(`Processing ${fileName}...`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const posts = JSON.parse(rawData);

  const results = [];
  const stateFilePath = path.join(SEED_DIR, `${fileName.replace('.json', '')}_state.json`);
  
  let startIndex = 0;
  if (fs.existsSync(stateFilePath)) {
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
    startIndex = state.lastIndex + 1;
    results.push(...state.results);
    console.log(`Resuming ${fileName} from index ${startIndex}...`);
  }

  for (let i = startIndex; i < posts.length; i++) {
    const post = posts[i];
    console.log(`\n[${i+1}/${posts.length}] Generating for: ${post.title}`);
    
    const textToProcess = post.content.substring(0, 30000);
    const prompt = PROMPT_TEMPLATE + "\\nTitle: " + post.title + "\\n" + textToProcess;

    try {
      // 1차 시도: 저렴한 Flash 모델 사용 (비용 절감) + 재시도 로직
      let result = await generateWithRetry(flashModel, prompt);
      let responseText = result.response.text();
      let parsedJson = JSON.parse(responseText);

      // 2차 시도 (Fallback): 결과 품질이 부실하면 고품질 Pro 모델 사용
      if (isQualityPoor(parsedJson)) {
        console.log(`⚠️ Flash 모델 품질 미달 감지. Pro 모델로 재추출 시도합니다...`);
        result = await generateWithRetry(proModel, prompt);
        responseText = result.response.text();
        parsedJson = JSON.parse(responseText);
      } else {
        console.log(`✅ Flash 모델 성공 (비용 절감)`);
      }

      results.push({
        source_title: post.title,
        interpretations: parsedJson
      });

      // 진행 상태 저장
      fs.writeFileSync(stateFilePath, JSON.stringify({ lastIndex: i, results }, null, 2));

      // Rate limit 방지를 위해 2초 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error processing post ${i}:`, error);
      console.log('Stopping process to prevent data loss. You can resume later.');
      break;
    }
  }

  const finalOutputPath = path.join(SEED_DIR, `seed_${fileName}`);
  fs.writeFileSync(finalOutputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n🎉 Completed ${fileName}! Saved to ${finalOutputPath}`);
}

async function main() {
  const files = ['stars.json', 'palaces.json', 'formations.json'];
  
  for (const file of files) {
    await processFile(file);
  }
}

main();
