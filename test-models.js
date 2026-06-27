import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash"];

  console.log("=== Testing Gemini Models ===");
  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello! Are you there?");
      console.log(`✅ [${modelName}] Success: ${result.response.text().trim()}`);
    } catch (e) {
      console.log(`❌ [${modelName}] Failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}

testModels();
