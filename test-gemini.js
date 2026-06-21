const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

async function run() {
  const systemPrompt = `
[절대 지켜야 할 철칙 - 위반 시 실패]
1. "자미두수", "명궁", "관록궁", "재백궁", "주성", "살성", "화기", "차성안궁" 등 모든 명리학적 전문 용어와 한자어의 출력을 100% 절대 금지합니다.
2. JSON 스키마에서 지정된 타입(String, Array, Object 등)을 정확하게 준수하세요.

다음 JSON 스키마를 엄격히 준수하여 응답하세요. 다른 텍스트는 출력하지 마세요.
{
  "theme_insight": "제공된 <TEMPLATE> 양식을 엄격히 준수하여 마크다운 포맷으로 작성된 문자열 (String)",
  "ten_year_timeline": {
    "yearly_flow": [
      {
        "year": "YYYY년(XX세)",
        "insight": "이 해의 운세 특징과 흐름 2~3줄 요약 (String)"
      }
    ]
  }
}

<TEMPLATE>
**🔥 나의 핵심 무기:** [내용]

**🚫 나를 망치는 환경:** [내용]
</TEMPLATE>
  `;
  
  const userContext = "테스트용 컨텍스트입니다. 2024년부터 2025년 데이터가 있습니다.";

  try {
    const result = await model.generateContent([ { text: systemPrompt }, { text: userContext } ]);
    const text = result.response.text();
    console.log("Raw output:\\n", text);
    const parsed = JSON.parse(text);
    console.log("Parse Success!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
