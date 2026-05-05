export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  try {
    return btoa(binary);
  } catch {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunk) as unknown as number[]
      );
    }
    return btoa(bin);
  }
}

/** 为智谱 / OpenAI 等多模态接口生成 data URL */
export function addDataURIPrefix(base64: string, mimeType: string): string {
  const raw = removeDataURIPrefix(base64).replace(/\s/g, "");
  return `data:${mimeType};base64,${raw}`;
}

/** 去掉 data:image/...;base64, 前缀，得到纯 base64；若无前缀则原样返回（去空白） */
export function removeDataURIPrefix(dataURI: string): string {
  const t = dataURI.trim();
  const m = /^data:[^;]+;base64,(.+)$/i.exec(t);
  return m ? m[1] : t;
}

export function extractJsonFromText(text: string): object | null {
  try {
    const data = JSON.parse(text);
    if (typeof data === "object" && data !== null) {
      return data;
    }
  } catch {}

  const codeBlockRegex = /```json\s*([\s\S]*?)```/i;
  const match = codeBlockRegex.exec(text);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }
  const objectRegex = /{[\s\S]*}/g;
  const braceMatch = text.match(objectRegex);
  if (braceMatch) {
    for (const s of braceMatch) {
      try {
        return JSON.parse(s);
      } catch {}
    }
  }
  return null;
}

export interface MathAnalysisResult {
  problemType: string;
  knowledgePoints: string[];
  difficulty: string;
  thoughtProcess: string;
  steps: string[];
  cautions: string[];
  /** 用于相似题匹配的扩展概念（API 版 Prompt 输出） */
  relatedConcepts?: string[];
}

export function validateAnalysisResult(data: any): MathAnalysisResult {
  const relatedConcepts = Array.isArray(data?.relatedConcepts)
    ? data.relatedConcepts.map((x: any) => String(x))
    : undefined;
  return {
    problemType:
      typeof data?.problemType === "string" ? data.problemType : "未知题型",
    knowledgePoints: Array.isArray(data?.knowledgePoints)
      ? data.knowledgePoints.map((k: any) => String(k))
      : [],
    difficulty:
      typeof data?.difficulty === "string" ? data.difficulty : "未知",
    thoughtProcess:
      typeof data?.thoughtProcess === "string"
        ? data.thoughtProcess
        : "暂无思路",
    steps: Array.isArray(data?.steps)
      ? data.steps.map((s: any) => String(s))
      : [],
    cautions: Array.isArray(data?.cautions)
      ? data.cautions.map((c: any) => String(c))
      : [],
    ...(relatedConcepts && relatedConcepts.length > 0
      ? { relatedConcepts }
      : {}),
  };
}
