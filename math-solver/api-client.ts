import { Notice } from "obsidian";
import type { MathSolverSettings } from "./settings";
import {
  addDataURIPrefix,
  extractJsonFromText,
  MathAnalysisResult,
  validateAnalysisResult,
} from "./utils";
import { OllamaClient } from "./ollama";

export interface InferenceBackend {
  analyzeMathProblem(imageBase64: string): Promise<MathAnalysisResult>;
  getEmbedding(text: string): Promise<number[]>;
}

const VISION_PROMPT = `你是一位资深考研数学辅导老师，拥有20年教学经验。请仔细分析用户提供的数学题截图，按以下 JSON 格式严格输出：

{
  "problemType": "题型名称，使用考研数学标准分类，如：不定积分计算、反函数求导、隐函数方程、二重积分（直角坐标）、二重积分（极坐标）、微分方程（一阶线性）、微分方程（二阶常系数）、幂级数求和、矩阵特征值、概率密度函数等",
  "knowledgePoints": ["细分知识点1", "细分知识点2", "细分知识点3"],
  "difficulty": "简单|中等|困难",
  "thoughtProcess": "详细解题思路，包含：1) 如何审题识别题型；2) 为什么选择这种方法；3) 关键突破口在哪里",
  "steps": [
    "步骤1：...（包含完整 LaTeX 公式 $...$）",
    "步骤2：...",
    "步骤3：..."
  ],
  "cautions": [
    "易错点1：具体说明常见错误和正确做法",
    "易错点2：..."
  ],
  "relatedConcepts": ["相关概念1", "相关概念2"]
}

严格要求：
1. problemType 必须精确到具体子类型，不要只写"积分"或"导数"
2. knowledgePoints 要具体到定理、公式或方法名称
3. thoughtProcess 必须解释"为什么"，不能只说"怎么做"
4. steps 中所有数学公式必须用 LaTeX 格式，用 $...$ 包裹
5. cautions 必须基于历年考研真题常见失分点
6. relatedConcepts 用于后续相似题匹配，要准确

仅输出 JSON 对象本身，不要 markdown 代码块或其它说明文字。`;

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: { type?: string; text?: string }) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  return "";
}

function reportHttpError(status: number, _body: string): void {
  if (status === 401) {
    new Notice("API Key 无效，请在设置中检查");
  } else if (status === 429) {
    new Notice("请求过快或额度不足，请稍后重试或充值");
  } else if (status >= 500) {
    new Notice(`服务商错误 HTTP ${status}，将自动重试一次`);
  } else {
    new Notice(`API 调用失败 HTTP ${status}`);
  }
}

export class APIClient implements InferenceBackend {
  constructor(private settings: MathSolverSettings) {}

  private base(): string {
    return this.settings.baseUrl.replace(/\/+$/, "");
  }

  private async fetchOnce(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.settings.requestTimeout
    );
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /** 5xx 自动重试一次 */
  private async fetchWithRetry(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let res = await this.fetchOnce(url, init);
    if (res.status === 500 || res.status === 503) {
      await new Promise((r) => setTimeout(r, 600));
      res = await this.fetchOnce(url, init);
    }
    return res;
  }

  async analyzeMathProblem(imageBase64: string): Promise<MathAnalysisResult> {
    const url = `${this.base()}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.settings.apiKey}`,
    };

    const imageUrl = this.buildImageUrl(imageBase64);

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: VISION_PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ];

    const baseBody = {
      model: this.settings.visionModel,
      messages,
      temperature: this.settings.temperature,
      max_tokens: 2048,
    };

    let res: Response;
    let text: string;
    try {
      res = await this.fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...baseBody,
          response_format: { type: "json_object" },
        }),
      });
      text = await res.text();
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError") {
        new Notice(`请求超时（${this.settings.requestTimeout}ms）`);
      } else {
        new Notice(`网络错误：${err?.message ?? String(e)}`);
      }
      throw e;
    }

    if (
      !res.ok &&
      (res.status === 400 || res.status === 422) &&
      /response_format|json_object/i.test(text)
    ) {
      try {
        res = await this.fetchWithRetry(url, {
          method: "POST",
          headers,
          body: JSON.stringify(baseBody),
        });
        text = await res.text();
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        if (err?.name === "AbortError") {
          new Notice(`请求超时（${this.settings.requestTimeout}ms）`);
        } else {
          new Notice(`网络错误：${err?.message ?? String(e)}`);
        }
        throw e;
      }
    }

    if (!res.ok) {
      reportHttpError(res.status, text);
      throw new Error(`Vision API HTTP ${res.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      new Notice("识图接口返回非 JSON");
      throw new Error("Invalid JSON from vision API");
    }

    const rawContent = messageContentToString(data?.choices?.[0]?.message?.content);
    let obj = extractJsonFromText(rawContent.trim());
    if (!obj) {
      try {
        obj = JSON.parse(rawContent);
      } catch {
        obj = null;
      }
    }
    if (!obj) {
      new Notice("模型输出无法解析为 JSON");
      throw new Error("Vision content parse failed");
    }

    return validateAnalysisResult(obj);
  }

  /** 在线 API 统一使用 data URL（通义 compatible-mode 与 OpenAI / 智谱一致） */
  private buildImageUrl(pureBase64: string): string {
    const trimmed = pureBase64.replace(/\s/g, "");
    return addDataURIPrefix(trimmed, "image/png");
  }

  async getEmbedding(text: string): Promise<number[]> {
    const url = `${this.base()}/embeddings`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.settings.apiKey}`,
    };
    const body = JSON.stringify({
      model: this.settings.embeddingModel,
      input: text,
    });

    let res: Response;
    let respText: string;
    try {
      res = await this.fetchWithRetry(url, {
        method: "POST",
        headers,
        body,
      });
      respText = await res.text();
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError") {
        new Notice(`Embedding 超时（${this.settings.requestTimeout}ms）`);
      } else {
        new Notice(`网络错误：${err?.message ?? String(e)}`);
      }
      throw e;
    }

    if (!res.ok) {
      reportHttpError(res.status, respText);
      throw new Error(`Embedding HTTP ${res.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(respText);
    } catch {
      new Notice("Embedding 接口返回非 JSON");
      throw new Error("Embedding invalid JSON");
    }

    const emb = data?.data?.[0]?.embedding;
    if (!Array.isArray(emb)) {
      new Notice("Embedding 结果格式异常");
      throw new Error("Embedding missing");
    }
    return emb as number[];
  }
}

export function createInferenceBackend(
  settings: MathSolverSettings
): InferenceBackend {
  if (settings.provider === "ollama") {
    return new OllamaClient(
      settings.ollamaUrl,
      settings.visionModel,
      settings.embeddingModel,
      settings.requestTimeout
    );
  }
  return new APIClient(settings);
}

export async function testInferenceConnection(
  settings: MathSolverSettings
): Promise<{ success: boolean; message: string }> {
  if (settings.provider === "ollama") {
    try {
      const base = settings.ollamaUrl.replace(/\/+$/, "");
      const res = await fetch(`${base}/api/tags`, {
        signal: AbortSignal.timeout(settings.requestTimeout),
      });
      if (res.ok) return { success: true, message: "Ollama 连接成功" };
      return {
        success: false,
        message: `Ollama 响应异常：HTTP ${res.status}`,
      };
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError" || err?.name === "TimeoutError") {
        return {
          success: false,
          message: "连接超时，请确认 Ollama 已启动且地址正确",
        };
      }
      return {
        success: false,
        message: `网络错误：${err?.message ?? String(e)}`,
      };
    }
  }

  if (!settings.apiKey.trim()) {
    return { success: false, message: "请先填写 API Key" };
  }

  const base = settings.baseUrl.replace(/\/+$/, "");
  const auth = { Authorization: `Bearer ${settings.apiKey}` };

  try {
    let res = await fetch(`${base}/models`, {
      method: "GET",
      headers: auth,
      signal: AbortSignal.timeout(settings.requestTimeout),
    });

    if (res.ok) {
      return { success: true, message: "连接成功（模型列表可用）" };
    }
    if (res.status === 401) {
      return { success: false, message: "API Key 无效" };
    }

    res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.embeddingModel,
        input: "ping",
      }),
      signal: AbortSignal.timeout(settings.requestTimeout),
    });

    if (res.ok) {
      return { success: true, message: "连接成功（Embedding 探测通过）" };
    }
    if (res.status === 401) {
      return { success: false, message: "API Key 无效" };
    }
    if (res.status === 429) {
      return { success: false, message: "请求过快或额度不足" };
    }
    return {
      success: false,
      message: `探测失败 HTTP ${res.status}，请检查 Base URL 与模型名`,
    };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return {
        success: false,
        message: `请求超时（${settings.requestTimeout}ms）`,
      };
    }
    return {
      success: false,
      message: `网络错误：${err?.message ?? String(e)}`,
    };
  }
}
