import { Notice } from "obsidian";
import { MathAnalysisResult, extractJsonFromText, validateAnalysisResult } from "./utils";

export class OllamaClient {
  baseUrl: string;
  visionModel: string;
  embeddingModel: string;
  private timeoutMs: number;

  constructor(
    baseUrl: string,
    visionModel: string,
    embeddingModel: string,
    timeoutMs = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.visionModel = visionModel;
    this.embeddingModel = embeddingModel;
    this.timeoutMs = timeoutMs;
  }

  async analyzeMathProblem(base64Image: string): Promise<MathAnalysisResult> {
    const prompt = `你是一位资深考研数学辅导老师。请仔细分析用户提供的数学题截图，按以下 JSON 格式严格输出，不要添加任何 markdown 代码块标记，直接输出纯 JSON：

{
  "problemType": "题型名称，如：不定积分、定积分、反函数求导、隐函数求导、二重积分、微分方程、级数求和、矩阵运算、概率分布等",
  "knowledgePoints": ["知识点1", "知识点2", "知识点3"],
  "difficulty": "简单|中等|困难",
  "thoughtProcess": "整体解题思路的详细描述，包含如何审题、选择方法的理由",
  "steps": ["步骤1：...", "步骤2：...", "步骤3：..."],
  "cautions": ["易错点/注意事项1", "易错点/注意事项2"]
}

要求：
1. problemType 使用简短标准题型名称
2. knowledgePoints 必须具体到细分知识点
3. thoughtProcess 要体现"为什么这样做"而非只写"怎么做"
4. steps 数组必须包含完整的 LaTeX 公式（用 $...$ 包裹）
5. cautions 必须包含常见考研陷阱和计算易错点
`;

    const payload = {
      model: this.visionModel,
      prompt,
      images: [base64Image],
      stream: false,
      format: "json",
    };
    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      new Notice("Ollama 服务未启动，请先运行 ollama serve");
      throw new Error("Ollama network error");
    }
    if (!response.ok) {
      new Notice("Ollama API 调用失败");
      throw new Error(`Ollama error: ${response.status}`);
    }
    let resultText: string = "";
    try {
      const data = await response.json();
      resultText = typeof data.response === "string" ? data.response : JSON.stringify(data);
    } catch (e) {
      // Ollama 返回可能不是标准 json
      resultText = await response.text();
    }
    // 抽取 JSON
    let resultObj = extractJsonFromText(resultText);
    if (!resultObj) {
      new Notice("模型输出无法解析为 JSON，请检查输入图片或手动分析");
      throw new Error("Model output is not valid JSON");
    }
    // 类型和字段校验与补全
    const finalResult = validateAnalysisResult(resultObj);
    return finalResult;
  }

  async getEmbedding(text: string): Promise<number[]> {
    const payload = {
      model: this.embeddingModel,
      prompt: text,
    };
    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      new Notice("Ollama embedding 服务不可用");
      throw new Error("Ollama embedding network error");
    }
    if (!response.ok) {
      throw new Error(`Embedding error: ${response.status}`);
    }
    try {
      const data = await response.json();
      // Ollama 的返回格式通常: { embedding: number[] }
      if (Array.isArray(data.embedding)) return data.embedding;
      if (data.data && Array.isArray(data.data[0]?.embedding))
        return data.data[0].embedding;
      throw new Error("Invalid embedding result");
    } catch (e) {
      throw new Error("Embedding JSON parse error");
    }
  }
}
