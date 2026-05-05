var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MathSolverPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  provider: "zhipu",
  apiKey: "",
  baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  visionModel: "glm-4v-flash",
  embeddingModel: "embedding-3",
  autoAnalyze: true,
  maxSimilarResults: 5,
  requestTimeout: 3e4,
  temperature: 0.3,
  ollamaUrl: "http://localhost:11434"
};
var PROVIDER_LABELS = {
  zhipu: "\u667A\u8C31 AI",
  dashscope: "\u963F\u91CC\u4E91\u901A\u4E49",
  openai: "OpenAI \u517C\u5BB9",
  ollama: "\u672C\u5730 Ollama"
};
var DEFAULTS_BY_PROVIDER = {
  zhipu: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    visionModel: "glm-4v-flash",
    embeddingModel: "embedding-3"
  },
  dashscope: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    visionModel: "qwen-vl-plus",
    embeddingModel: "text-embedding-v3"
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    visionModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small"
  },
  ollama: {
    baseUrl: "",
    visionModel: "qwen2-vl:7b",
    embeddingModel: "nomic-embed-text"
  }
};
function applyProviderDefaults(s) {
  const d = DEFAULTS_BY_PROVIDER[s.provider];
  if (s.provider === "ollama") {
    s.visionModel = d.visionModel;
    s.embeddingModel = d.embeddingModel;
    return;
  }
  s.baseUrl = d.baseUrl;
  s.visionModel = d.visionModel;
  s.embeddingModel = d.embeddingModel;
}
var MathSolverSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    containerEl.createEl("h2", { text: "\u8003\u7814\u6570\u5B66 AI \u9898\u89E3 \u2014 \u63D2\u4EF6\u8BBE\u7F6E" });
    const privacy = containerEl.createDiv({ cls: "math-solver-privacy-notice" });
    privacy.createEl("p", {
      text: s.provider === "ollama" ? "\u5F53\u524D\u4E3A\u672C\u5730 Ollama\uFF1A\u56FE\u7247\u4E0E\u7B14\u8BB0\u5185\u5BB9\u4EC5\u5728\u672C\u5730\u5904\u7406\u3002" : `\u5F53\u524D\u4E3A\u5728\u7EBF API\uFF08${PROVIDER_LABELS[s.provider]}\uFF09\uFF1A\u9898\u76EE\u622A\u56FE\u4E0E\u7528\u4E8E Embedding \u7684\u7B14\u8BB0\u6B63\u6587\u5C06\u53D1\u9001\u81F3\u670D\u52A1\u5546\uFF0C\u8BF7\u52FF\u4E0A\u4F20\u654F\u611F\u5185\u5BB9\u3002API Key \u4EC5\u4FDD\u5B58\u5728\u672C\u4ED3\u5E93\u7684\u63D2\u4EF6 data.json \u4E2D\u3002`
    });
    new import_obsidian.Setting(containerEl).setName("\u63A8\u7406\u540E\u7AEF").setDesc("\u5728\u7EBF API \u96F6\u672C\u5730\u663E\u5B58\uFF1B\u672C\u5730 Ollama \u9700\u81EA\u884C\u8FD0\u884C\u6A21\u578B\u670D\u52A1\u3002").addDropdown(
      (dd) => dd.addOption("zhipu", "\u667A\u8C31 AI\uFF08\u63A8\u8350\uFF09").addOption("dashscope", "\u963F\u91CC\u4E91\u901A\u4E49\u5343\u95EE").addOption("openai", "OpenAI / \u517C\u5BB9\u63A5\u53E3").addOption("ollama", "\u672C\u5730 Ollama").setValue(s.provider).onChange(async (v) => {
        this.plugin.settings.provider = v;
        applyProviderDefaults(this.plugin.settings);
        await this.plugin.saveSettings();
        this.plugin.refreshBackend();
        this.display();
      })
    );
    if (s.provider !== "ollama") {
      new import_obsidian.Setting(containerEl).setName("API Key").setDesc("\u4E0D\u4F1A\u4E0A\u4F20\u5230\u4EFB\u4F55\u7B2C\u4E09\u65B9\u9664\u6240\u9009\u670D\u52A1\u5546\u4EE5\u5916\u7684\u5730\u5740\u3002").addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("\u586B\u5199 API Key").setValue(s.apiKey).onChange(async (value) => {
          this.plugin.settings.apiKey = value.trim();
          await this.plugin.saveSettings();
        });
      });
      new import_obsidian.Setting(containerEl).setName("Base URL").setDesc("\u5207\u6362\u670D\u52A1\u5546\u65F6\u4F1A\u81EA\u52A8\u586B\u5165\u9ED8\u8BA4\u503C\uFF0C\u53EF\u6309\u9700\u6539\u4E3A\u4EE3\u7406\u6216\u517C\u5BB9\u7F51\u5173\u3002").addText(
        (text) => text.setPlaceholder("https://...").setValue(s.baseUrl).onChange(async (value) => {
          this.plugin.settings.baseUrl = value.trim();
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian.Setting(containerEl).setName("\u591A\u6A21\u6001\u8BC6\u56FE\u6A21\u578B").setDesc("\u4F8B\u5982\u667A\u8C31 glm-4v-flash\u3001\u901A\u4E49 qwen-vl-plus\u3001OpenAI gpt-4o-mini\u3002").addText(
        (text) => text.setPlaceholder("\u6A21\u578B ID").setValue(s.visionModel).onChange(async (value) => {
          this.plugin.settings.visionModel = value.trim();
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian.Setting(containerEl).setName("Embedding \u6A21\u578B").setDesc("\u66F4\u6362 Embedding \u6A21\u578B\u540E\u5EFA\u8BAE\u6267\u884C\u300C\u91CD\u65B0\u7D22\u5F15\u300D\u4EE5\u4FDD\u8BC1\u5411\u91CF\u7EF4\u5EA6\u4E00\u81F4\u3002").addText(
        (text) => text.setPlaceholder("\u6A21\u578B ID").setValue(s.embeddingModel).onChange(async (value) => {
          this.plugin.settings.embeddingModel = value.trim();
          await this.plugin.saveSettings();
        })
      );
    } else {
      new import_obsidian.Setting(containerEl).setName("Ollama \u670D\u52A1\u5730\u5740").setDesc("\u672C\u5730 REST \u5165\u53E3\uFF0C\u4F8B\u5982 http://localhost:11434").addText(
        (text) => text.setPlaceholder("http://localhost:11434").setValue(s.ollamaUrl).onChange(async (value) => {
          this.plugin.settings.ollamaUrl = value.trim();
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian.Setting(containerEl).setName("\u591A\u6A21\u6001\u6A21\u578B").setDesc("Ollama \u4E2D\u7684 vision \u6A21\u578B\u540D\u79F0").addText(
        (text) => text.setPlaceholder("qwen2-vl:7b").setValue(s.visionModel).onChange(async (value) => {
          this.plugin.settings.visionModel = value.trim();
          await this.plugin.saveSettings();
          this.plugin.refreshBackend();
        })
      );
      new import_obsidian.Setting(containerEl).setName("Embedding \u6A21\u578B").setDesc("Ollama embeddings \u6A21\u578B\u540D\u79F0").addText(
        (text) => text.setPlaceholder("nomic-embed-text").setValue(s.embeddingModel).onChange(async (value) => {
          this.plugin.settings.embeddingModel = value.trim();
          await this.plugin.saveSettings();
          this.plugin.refreshBackend();
        })
      );
    }
    new import_obsidian.Setting(containerEl).setName("\u8BF7\u6C42\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09").setDesc("\u8BC6\u56FE\u4E0E Embedding \u5171\u7528\uFF0C\u9ED8\u8BA4 30000\u3002").addText(
      (text) => text.setPlaceholder("30000").setValue(String(s.requestTimeout)).onChange(async (value) => {
        const n = parseInt(value.trim(), 10);
        this.plugin.settings.requestTimeout = Number.isFinite(n) && n >= 5e3 ? n : DEFAULT_SETTINGS.requestTimeout;
        await this.plugin.saveSettings();
        this.plugin.refreshBackend();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Temperature").setDesc("\u6570\u5B66\u89E3\u9898\u5EFA\u8BAE\u504F\u4F4E\uFF08\u9ED8\u8BA4 0.3\uFF09\u3002\u4EC5\u5728\u7EBF API \u8BC6\u56FE\u8BF7\u6C42\u751F\u6548\u3002").addSlider(
      (slider) => slider.setLimits(0, 1, 0.05).setValue(s.temperature).onChange(async (value) => {
        this.plugin.settings.temperature = value;
        await this.plugin.saveSettings();
        slider.setDynamicTooltip();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6D4B\u8BD5 API \u8FDE\u63A5").setDesc("\u5728\u7EBF\uFF1A\u5C1D\u8BD5\u5217\u51FA\u6A21\u578B\u6216\u63A2\u6D4B Embedding\uFF1BOllama\uFF1A\u8BF7\u6C42 /api/tags\u3002").addButton(
      (btn) => btn.setButtonText("\u6D4B\u8BD5\u8FDE\u63A5").onClick(async () => {
        btn.setDisabled(true);
        try {
          await this.plugin.testApiConnection();
        } finally {
          btn.setDisabled(false);
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u7C98\u8D34\u56FE\u7247\u540E\u81EA\u52A8\u5206\u6790").setDesc("\u5F00\u542F\u540E\uFF0C\u7C98\u8D34\u56FE\u7247\u65F6\u4F1A\u81EA\u52A8\u89E6\u53D1\u9898\u89E3\u751F\u6210\uFF08\u9700\u5F53\u524D\u7B14\u8BB0\u542B wiki \u56FE\u7247\u94FE\u63A5\uFF09\u3002").addToggle(
      (toggle) => toggle.setValue(s.autoAnalyze).onChange(async (value) => {
        this.plugin.settings.autoAnalyze = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u76F8\u4F3C\u9898\u578B\u8FD4\u56DE\u6570\u91CF").setDesc("1\u201310").addSlider(
      (slider) => slider.setLimits(1, 10, 1).setValue(s.maxSimilarResults).onChange(async (value) => {
        this.plugin.settings.maxSimilarResults = value;
        await this.plugin.saveSettings();
        slider.setDynamicTooltip();
      })
    );
  }
};

// utils.ts
function arrayBufferToBase64(buffer) {
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
    const chunk = 32768;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunk)
      );
    }
    return btoa(bin);
  }
}
function addDataURIPrefix(base64, mimeType) {
  const raw = removeDataURIPrefix(base64).replace(/\s/g, "");
  return `data:${mimeType};base64,${raw}`;
}
function removeDataURIPrefix(dataURI) {
  const t = dataURI.trim();
  const m = /^data:[^;]+;base64,(.+)$/i.exec(t);
  return m ? m[1] : t;
}
function extractJsonFromText(text) {
  try {
    const data = JSON.parse(text);
    if (typeof data === "object" && data !== null) {
      return data;
    }
  } catch {
  }
  const codeBlockRegex = /```json\s*([\s\S]*?)```/i;
  const match = codeBlockRegex.exec(text);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
    }
  }
  const objectRegex = /{[\s\S]*}/g;
  const braceMatch = text.match(objectRegex);
  if (braceMatch) {
    for (const s of braceMatch) {
      try {
        return JSON.parse(s);
      } catch {
      }
    }
  }
  return null;
}
function validateAnalysisResult(data) {
  const relatedConcepts = Array.isArray(data?.relatedConcepts) ? data.relatedConcepts.map((x) => String(x)) : void 0;
  return {
    problemType: typeof data?.problemType === "string" ? data.problemType : "\u672A\u77E5\u9898\u578B",
    knowledgePoints: Array.isArray(data?.knowledgePoints) ? data.knowledgePoints.map((k) => String(k)) : [],
    difficulty: typeof data?.difficulty === "string" ? data.difficulty : "\u672A\u77E5",
    thoughtProcess: typeof data?.thoughtProcess === "string" ? data.thoughtProcess : "\u6682\u65E0\u601D\u8DEF",
    steps: Array.isArray(data?.steps) ? data.steps.map((s) => String(s)) : [],
    cautions: Array.isArray(data?.cautions) ? data.cautions.map((c) => String(c)) : [],
    ...relatedConcepts && relatedConcepts.length > 0 ? { relatedConcepts } : {}
  };
}

// api-client.ts
var import_obsidian3 = require("obsidian");

// ollama.ts
var import_obsidian2 = require("obsidian");
var OllamaClient = class {
  constructor(baseUrl, visionModel, embeddingModel, timeoutMs = 3e4) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.visionModel = visionModel;
    this.embeddingModel = embeddingModel;
    this.timeoutMs = timeoutMs;
  }
  async analyzeMathProblem(base64Image) {
    const prompt = `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u8003\u7814\u6570\u5B66\u8F85\u5BFC\u8001\u5E08\u3002\u8BF7\u4ED4\u7EC6\u5206\u6790\u7528\u6237\u63D0\u4F9B\u7684\u6570\u5B66\u9898\u622A\u56FE\uFF0C\u6309\u4EE5\u4E0B JSON \u683C\u5F0F\u4E25\u683C\u8F93\u51FA\uFF0C\u4E0D\u8981\u6DFB\u52A0\u4EFB\u4F55 markdown \u4EE3\u7801\u5757\u6807\u8BB0\uFF0C\u76F4\u63A5\u8F93\u51FA\u7EAF JSON\uFF1A

{
  "problemType": "\u9898\u578B\u540D\u79F0\uFF0C\u5982\uFF1A\u4E0D\u5B9A\u79EF\u5206\u3001\u5B9A\u79EF\u5206\u3001\u53CD\u51FD\u6570\u6C42\u5BFC\u3001\u9690\u51FD\u6570\u6C42\u5BFC\u3001\u4E8C\u91CD\u79EF\u5206\u3001\u5FAE\u5206\u65B9\u7A0B\u3001\u7EA7\u6570\u6C42\u548C\u3001\u77E9\u9635\u8FD0\u7B97\u3001\u6982\u7387\u5206\u5E03\u7B49",
  "knowledgePoints": ["\u77E5\u8BC6\u70B91", "\u77E5\u8BC6\u70B92", "\u77E5\u8BC6\u70B93"],
  "difficulty": "\u7B80\u5355|\u4E2D\u7B49|\u56F0\u96BE",
  "thoughtProcess": "\u6574\u4F53\u89E3\u9898\u601D\u8DEF\u7684\u8BE6\u7EC6\u63CF\u8FF0\uFF0C\u5305\u542B\u5982\u4F55\u5BA1\u9898\u3001\u9009\u62E9\u65B9\u6CD5\u7684\u7406\u7531",
  "steps": ["\u6B65\u9AA41\uFF1A...", "\u6B65\u9AA42\uFF1A...", "\u6B65\u9AA43\uFF1A..."],
  "cautions": ["\u6613\u9519\u70B9/\u6CE8\u610F\u4E8B\u98791", "\u6613\u9519\u70B9/\u6CE8\u610F\u4E8B\u98792"]
}

\u8981\u6C42\uFF1A
1. problemType \u4F7F\u7528\u7B80\u77ED\u6807\u51C6\u9898\u578B\u540D\u79F0
2. knowledgePoints \u5FC5\u987B\u5177\u4F53\u5230\u7EC6\u5206\u77E5\u8BC6\u70B9
3. thoughtProcess \u8981\u4F53\u73B0"\u4E3A\u4EC0\u4E48\u8FD9\u6837\u505A"\u800C\u975E\u53EA\u5199"\u600E\u4E48\u505A"
4. steps \u6570\u7EC4\u5FC5\u987B\u5305\u542B\u5B8C\u6574\u7684 LaTeX \u516C\u5F0F\uFF08\u7528 $...$ \u5305\u88F9\uFF09
5. cautions \u5FC5\u987B\u5305\u542B\u5E38\u89C1\u8003\u7814\u9677\u9631\u548C\u8BA1\u7B97\u6613\u9519\u70B9
`;
    const payload = {
      model: this.visionModel,
      prompt,
      images: [base64Image],
      stream: false,
      format: "json"
    };
    let response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (e) {
      new import_obsidian2.Notice("Ollama \u670D\u52A1\u672A\u542F\u52A8\uFF0C\u8BF7\u5148\u8FD0\u884C ollama serve");
      throw new Error("Ollama network error");
    }
    if (!response.ok) {
      new import_obsidian2.Notice("Ollama API \u8C03\u7528\u5931\u8D25");
      throw new Error(`Ollama error: ${response.status}`);
    }
    let resultText = "";
    try {
      const data = await response.json();
      resultText = typeof data.response === "string" ? data.response : JSON.stringify(data);
    } catch (e) {
      resultText = await response.text();
    }
    let resultObj = extractJsonFromText(resultText);
    if (!resultObj) {
      new import_obsidian2.Notice("\u6A21\u578B\u8F93\u51FA\u65E0\u6CD5\u89E3\u6790\u4E3A JSON\uFF0C\u8BF7\u68C0\u67E5\u8F93\u5165\u56FE\u7247\u6216\u624B\u52A8\u5206\u6790");
      throw new Error("Model output is not valid JSON");
    }
    const finalResult = validateAnalysisResult(resultObj);
    return finalResult;
  }
  async getEmbedding(text) {
    const payload = {
      model: this.embeddingModel,
      prompt: text
    };
    let response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (e) {
      new import_obsidian2.Notice("Ollama embedding \u670D\u52A1\u4E0D\u53EF\u7528");
      throw new Error("Ollama embedding network error");
    }
    if (!response.ok) {
      throw new Error(`Embedding error: ${response.status}`);
    }
    try {
      const data = await response.json();
      if (Array.isArray(data.embedding)) return data.embedding;
      if (data.data && Array.isArray(data.data[0]?.embedding))
        return data.data[0].embedding;
      throw new Error("Invalid embedding result");
    } catch (e) {
      throw new Error("Embedding JSON parse error");
    }
  }
};

// api-client.ts
var VISION_PROMPT = `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u8003\u7814\u6570\u5B66\u8F85\u5BFC\u8001\u5E08\uFF0C\u62E5\u670920\u5E74\u6559\u5B66\u7ECF\u9A8C\u3002\u8BF7\u4ED4\u7EC6\u5206\u6790\u7528\u6237\u63D0\u4F9B\u7684\u6570\u5B66\u9898\u622A\u56FE\uFF0C\u6309\u4EE5\u4E0B JSON \u683C\u5F0F\u4E25\u683C\u8F93\u51FA\uFF1A

{
  "problemType": "\u9898\u578B\u540D\u79F0\uFF0C\u4F7F\u7528\u8003\u7814\u6570\u5B66\u6807\u51C6\u5206\u7C7B\uFF0C\u5982\uFF1A\u4E0D\u5B9A\u79EF\u5206\u8BA1\u7B97\u3001\u53CD\u51FD\u6570\u6C42\u5BFC\u3001\u9690\u51FD\u6570\u65B9\u7A0B\u3001\u4E8C\u91CD\u79EF\u5206\uFF08\u76F4\u89D2\u5750\u6807\uFF09\u3001\u4E8C\u91CD\u79EF\u5206\uFF08\u6781\u5750\u6807\uFF09\u3001\u5FAE\u5206\u65B9\u7A0B\uFF08\u4E00\u9636\u7EBF\u6027\uFF09\u3001\u5FAE\u5206\u65B9\u7A0B\uFF08\u4E8C\u9636\u5E38\u7CFB\u6570\uFF09\u3001\u5E42\u7EA7\u6570\u6C42\u548C\u3001\u77E9\u9635\u7279\u5F81\u503C\u3001\u6982\u7387\u5BC6\u5EA6\u51FD\u6570\u7B49",
  "knowledgePoints": ["\u7EC6\u5206\u77E5\u8BC6\u70B91", "\u7EC6\u5206\u77E5\u8BC6\u70B92", "\u7EC6\u5206\u77E5\u8BC6\u70B93"],
  "difficulty": "\u7B80\u5355|\u4E2D\u7B49|\u56F0\u96BE",
  "thoughtProcess": "\u8BE6\u7EC6\u89E3\u9898\u601D\u8DEF\uFF0C\u5305\u542B\uFF1A1) \u5982\u4F55\u5BA1\u9898\u8BC6\u522B\u9898\u578B\uFF1B2) \u4E3A\u4EC0\u4E48\u9009\u62E9\u8FD9\u79CD\u65B9\u6CD5\uFF1B3) \u5173\u952E\u7A81\u7834\u53E3\u5728\u54EA\u91CC",
  "steps": [
    "\u6B65\u9AA41\uFF1A...\uFF08\u5305\u542B\u5B8C\u6574 LaTeX \u516C\u5F0F $...$\uFF09",
    "\u6B65\u9AA42\uFF1A...",
    "\u6B65\u9AA43\uFF1A..."
  ],
  "cautions": [
    "\u6613\u9519\u70B91\uFF1A\u5177\u4F53\u8BF4\u660E\u5E38\u89C1\u9519\u8BEF\u548C\u6B63\u786E\u505A\u6CD5",
    "\u6613\u9519\u70B92\uFF1A..."
  ],
  "relatedConcepts": ["\u76F8\u5173\u6982\u5FF51", "\u76F8\u5173\u6982\u5FF52"]
}

\u4E25\u683C\u8981\u6C42\uFF1A
1. problemType \u5FC5\u987B\u7CBE\u786E\u5230\u5177\u4F53\u5B50\u7C7B\u578B\uFF0C\u4E0D\u8981\u53EA\u5199"\u79EF\u5206"\u6216"\u5BFC\u6570"
2. knowledgePoints \u8981\u5177\u4F53\u5230\u5B9A\u7406\u3001\u516C\u5F0F\u6216\u65B9\u6CD5\u540D\u79F0
3. thoughtProcess \u5FC5\u987B\u89E3\u91CA"\u4E3A\u4EC0\u4E48"\uFF0C\u4E0D\u80FD\u53EA\u8BF4"\u600E\u4E48\u505A"
4. steps \u4E2D\u6240\u6709\u6570\u5B66\u516C\u5F0F\u5FC5\u987B\u7528 LaTeX \u683C\u5F0F\uFF0C\u7528 $...$ \u5305\u88F9
5. cautions \u5FC5\u987B\u57FA\u4E8E\u5386\u5E74\u8003\u7814\u771F\u9898\u5E38\u89C1\u5931\u5206\u70B9
6. relatedConcepts \u7528\u4E8E\u540E\u7EED\u76F8\u4F3C\u9898\u5339\u914D\uFF0C\u8981\u51C6\u786E

\u4EC5\u8F93\u51FA JSON \u5BF9\u8C61\u672C\u8EAB\uFF0C\u4E0D\u8981 markdown \u4EE3\u7801\u5757\u6216\u5176\u5B83\u8BF4\u660E\u6587\u5B57\u3002`;
function messageContentToString(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (part?.type === "text" && typeof part.text === "string") return part.text;
      return "";
    }).join("");
  }
  return "";
}
function reportHttpError(status, _body) {
  if (status === 401) {
    new import_obsidian3.Notice("API Key \u65E0\u6548\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u68C0\u67E5");
  } else if (status === 429) {
    new import_obsidian3.Notice("\u8BF7\u6C42\u8FC7\u5FEB\u6216\u989D\u5EA6\u4E0D\u8DB3\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u5145\u503C");
  } else if (status >= 500) {
    new import_obsidian3.Notice(`\u670D\u52A1\u5546\u9519\u8BEF HTTP ${status}\uFF0C\u5C06\u81EA\u52A8\u91CD\u8BD5\u4E00\u6B21`);
  } else {
    new import_obsidian3.Notice(`API \u8C03\u7528\u5931\u8D25 HTTP ${status}`);
  }
}
var APIClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  base() {
    return this.settings.baseUrl.replace(/\/+$/, "");
  }
  async fetchOnce(url, init) {
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
  async fetchWithRetry(url, init) {
    let res = await this.fetchOnce(url, init);
    if (res.status === 500 || res.status === 503) {
      await new Promise((r) => setTimeout(r, 600));
      res = await this.fetchOnce(url, init);
    }
    return res;
  }
  async analyzeMathProblem(imageBase64) {
    const url = `${this.base()}/chat/completions`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.settings.apiKey}`
    };
    const imageUrl = this.buildImageUrl(imageBase64);
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: VISION_PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ];
    const baseBody = {
      model: this.settings.visionModel,
      messages,
      temperature: this.settings.temperature,
      max_tokens: 2048
    };
    let res;
    let text;
    try {
      res = await this.fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...baseBody,
          response_format: { type: "json_object" }
        })
      });
      text = await res.text();
    } catch (e) {
      const err = e;
      if (err?.name === "AbortError") {
        new import_obsidian3.Notice(`\u8BF7\u6C42\u8D85\u65F6\uFF08${this.settings.requestTimeout}ms\uFF09`);
      } else {
        new import_obsidian3.Notice(`\u7F51\u7EDC\u9519\u8BEF\uFF1A${err?.message ?? String(e)}`);
      }
      throw e;
    }
    if (!res.ok && (res.status === 400 || res.status === 422) && /response_format|json_object/i.test(text)) {
      try {
        res = await this.fetchWithRetry(url, {
          method: "POST",
          headers,
          body: JSON.stringify(baseBody)
        });
        text = await res.text();
      } catch (e) {
        const err = e;
        if (err?.name === "AbortError") {
          new import_obsidian3.Notice(`\u8BF7\u6C42\u8D85\u65F6\uFF08${this.settings.requestTimeout}ms\uFF09`);
        } else {
          new import_obsidian3.Notice(`\u7F51\u7EDC\u9519\u8BEF\uFF1A${err?.message ?? String(e)}`);
        }
        throw e;
      }
    }
    if (!res.ok) {
      reportHttpError(res.status, text);
      throw new Error(`Vision API HTTP ${res.status}`);
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      new import_obsidian3.Notice("\u8BC6\u56FE\u63A5\u53E3\u8FD4\u56DE\u975E JSON");
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
      new import_obsidian3.Notice("\u6A21\u578B\u8F93\u51FA\u65E0\u6CD5\u89E3\u6790\u4E3A JSON");
      throw new Error("Vision content parse failed");
    }
    return validateAnalysisResult(obj);
  }
  /** 在线 API 统一使用 data URL（通义 compatible-mode 与 OpenAI / 智谱一致） */
  buildImageUrl(pureBase64) {
    const trimmed = pureBase64.replace(/\s/g, "");
    return addDataURIPrefix(trimmed, "image/png");
  }
  async getEmbedding(text) {
    const url = `${this.base()}/embeddings`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.settings.apiKey}`
    };
    const body = JSON.stringify({
      model: this.settings.embeddingModel,
      input: text
    });
    let res;
    let respText;
    try {
      res = await this.fetchWithRetry(url, {
        method: "POST",
        headers,
        body
      });
      respText = await res.text();
    } catch (e) {
      const err = e;
      if (err?.name === "AbortError") {
        new import_obsidian3.Notice(`Embedding \u8D85\u65F6\uFF08${this.settings.requestTimeout}ms\uFF09`);
      } else {
        new import_obsidian3.Notice(`\u7F51\u7EDC\u9519\u8BEF\uFF1A${err?.message ?? String(e)}`);
      }
      throw e;
    }
    if (!res.ok) {
      reportHttpError(res.status, respText);
      throw new Error(`Embedding HTTP ${res.status}`);
    }
    let data;
    try {
      data = JSON.parse(respText);
    } catch {
      new import_obsidian3.Notice("Embedding \u63A5\u53E3\u8FD4\u56DE\u975E JSON");
      throw new Error("Embedding invalid JSON");
    }
    const emb = data?.data?.[0]?.embedding;
    if (!Array.isArray(emb)) {
      new import_obsidian3.Notice("Embedding \u7ED3\u679C\u683C\u5F0F\u5F02\u5E38");
      throw new Error("Embedding missing");
    }
    return emb;
  }
};
function createInferenceBackend(settings) {
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
async function testInferenceConnection(settings) {
  if (settings.provider === "ollama") {
    try {
      const base2 = settings.ollamaUrl.replace(/\/+$/, "");
      const res = await fetch(`${base2}/api/tags`, {
        signal: AbortSignal.timeout(settings.requestTimeout)
      });
      if (res.ok) return { success: true, message: "Ollama \u8FDE\u63A5\u6210\u529F" };
      return {
        success: false,
        message: `Ollama \u54CD\u5E94\u5F02\u5E38\uFF1AHTTP ${res.status}`
      };
    } catch (e) {
      const err = e;
      if (err?.name === "AbortError" || err?.name === "TimeoutError") {
        return {
          success: false,
          message: "\u8FDE\u63A5\u8D85\u65F6\uFF0C\u8BF7\u786E\u8BA4 Ollama \u5DF2\u542F\u52A8\u4E14\u5730\u5740\u6B63\u786E"
        };
      }
      return {
        success: false,
        message: `\u7F51\u7EDC\u9519\u8BEF\uFF1A${err?.message ?? String(e)}`
      };
    }
  }
  if (!settings.apiKey.trim()) {
    return { success: false, message: "\u8BF7\u5148\u586B\u5199 API Key" };
  }
  const base = settings.baseUrl.replace(/\/+$/, "");
  const auth = { Authorization: `Bearer ${settings.apiKey}` };
  try {
    let res = await fetch(`${base}/models`, {
      method: "GET",
      headers: auth,
      signal: AbortSignal.timeout(settings.requestTimeout)
    });
    if (res.ok) {
      return { success: true, message: "\u8FDE\u63A5\u6210\u529F\uFF08\u6A21\u578B\u5217\u8868\u53EF\u7528\uFF09" };
    }
    if (res.status === 401) {
      return { success: false, message: "API Key \u65E0\u6548" };
    }
    res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.embeddingModel,
        input: "ping"
      }),
      signal: AbortSignal.timeout(settings.requestTimeout)
    });
    if (res.ok) {
      return { success: true, message: "\u8FDE\u63A5\u6210\u529F\uFF08Embedding \u63A2\u6D4B\u901A\u8FC7\uFF09" };
    }
    if (res.status === 401) {
      return { success: false, message: "API Key \u65E0\u6548" };
    }
    if (res.status === 429) {
      return { success: false, message: "\u8BF7\u6C42\u8FC7\u5FEB\u6216\u989D\u5EA6\u4E0D\u8DB3" };
    }
    return {
      success: false,
      message: `\u63A2\u6D4B\u5931\u8D25 HTTP ${res.status}\uFF0C\u8BF7\u68C0\u67E5 Base URL \u4E0E\u6A21\u578B\u540D`
    };
  } catch (e) {
    const err = e;
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return {
        success: false,
        message: `\u8BF7\u6C42\u8D85\u65F6\uFF08${settings.requestTimeout}ms\uFF09`
      };
    }
    return {
      success: false,
      message: `\u7F51\u7EDC\u9519\u8BEF\uFF1A${err?.message ?? String(e)}`
    };
  }
}

// embedder.ts
var import_obsidian4 = require("obsidian");
var VectorIndex = class {
  constructor(app, backend, pluginId) {
    this.entries = /* @__PURE__ */ new Map();
    this.app = app;
    this.backend = backend;
    this.indexPath = `.obsidian/plugins/${pluginId}/vector-index.json`;
  }
  setBackend(backend) {
    this.backend = backend;
  }
  async indexNote(path, content, metadata) {
    let embedding;
    try {
      embedding = await this.backend.getEmbedding(content);
    } catch {
      new import_obsidian4.Notice("Embedding \u5931\u8D25\uFF0C\u5DF2\u964D\u7EA7\u4E3A\u5173\u952E\u8BCD\u7D22\u5F15");
      embedding = this.keywordToFakeEmbedding(content);
    }
    const entry = {
      path,
      embedding,
      problemType: metadata.problemType,
      knowledgePoints: metadata.knowledgePoints,
      indexedAt: Date.now()
    };
    this.entries.set(path, entry);
    this.saveIndex().catch(() => {
      new import_obsidian4.Notice("\u5411\u91CF\u7D22\u5F15\u4FDD\u5B58\u5931\u8D25");
    });
  }
  async findSimilar(path, content, topK) {
    let queryEmbedding;
    try {
      queryEmbedding = await this.backend.getEmbedding(content);
    } catch {
      queryEmbedding = this.keywordToFakeEmbedding(content);
    }
    const results = [];
    for (const [otherPath, entry] of this.entries) {
      if (otherPath === path) continue;
      if (queryEmbedding.length !== entry.embedding.length) continue;
      const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
      results.push({ ...entry, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).filter((r) => r.score >= 0.7);
  }
  async loadIndex() {
    try {
      const data = await this.app.vault.adapter.read(this.indexPath);
      const arr = JSON.parse(data);
      this.entries = new Map(arr.map((e) => [e.path, e]));
    } catch {
      this.entries = /* @__PURE__ */ new Map();
    }
  }
  async saveIndex() {
    const out = Array.from(this.entries.values());
    await this.app.vault.adapter.write(
      this.indexPath,
      JSON.stringify(out, null, 2)
    );
  }
  keywordToFakeEmbedding(text) {
    const arr = new Array(64).fill(0);
    for (const ch of text) {
      arr[ch.charCodeAt(0) % 64]++;
    }
    const len = Math.max(text.length, 1);
    return arr.map((x) => x / len);
  }
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let sum = 0, sa = 0, sb = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
      sa += a[i] * a[i];
      sb += b[i] * b[i];
    }
    if (sa === 0 || sb === 0) return 0;
    return sum / (Math.sqrt(sa) * Math.sqrt(sb));
  }
};

// main.ts
function formatSolution(result, imageName) {
  const related = result.relatedConcepts && result.relatedConcepts.length > 0 ? `
### \u{1F517} \u76F8\u5173\u6982\u5FF5

${result.relatedConcepts.map((c) => `- ${c}`).join("\n")}
` : "";
  return `## \u{1F9EE} \u9898\u89E3\u5206\u6790

> [!info] \u9898\u578B\u8BC6\u522B
> **\u9898\u578B**\uFF1A${result.problemType}
> **\u77E5\u8BC6\u70B9**\uFF1A${result.knowledgePoints.join("\u3001")}
> **\u96BE\u5EA6**\uFF1A${result.difficulty}

### \u{1F4A1} \u89E3\u9898\u601D\u8DEF

${result.thoughtProcess}

### \u{1F4DD} \u8BE6\u7EC6\u6B65\u9AA4

${result.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### \u26A0\uFE0F \u6CE8\u610F\u4E8B\u9879

${result.cautions.map((c) => `- ${c}`).join("\n")}
${related}
### \u{1F4CE} \u539F\u9898

![[${imageName}]]

---
*\u5206\u6790\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toLocaleString()}*
`;
}
var MathSolverPlugin = class extends import_obsidian5.Plugin {
  refreshBackend() {
    this.backend = createInferenceBackend(this.settings);
    if (this.vectorIndex) {
      this.vectorIndex.setBackend(this.backend);
    }
  }
  async testApiConnection() {
    const r = await testInferenceConnection(this.settings);
    new import_obsidian5.Notice(r.success ? `\u2713 ${r.message}` : `\u2717 ${r.message}`);
  }
  async onload() {
    await this.loadSettings();
    this.backend = createInferenceBackend(this.settings);
    this.vectorIndex = new VectorIndex(
      this.app,
      this.backend,
      this.manifest.id
    );
    await this.vectorIndex.loadIndex();
    this.addSettingTab(new MathSolverSettingTab(this.app, this));
    this.addCommand({
      id: "analyze-math-image",
      name: "\u{1F9EE} \u5206\u6790\u6570\u5B66\u9898\u5E76\u751F\u6210\u9898\u89E3",
      callback: async () => await this.analyzeLastImageInNote()
    });
    this.addCommand({
      id: "find-similar-problems",
      name: "\u{1F517} \u67E5\u627E\u76F8\u4F3C\u9898\u578B",
      callback: async () => await this.findSimilarProblems()
    });
    this.addCommand({
      id: "reindex-all-math-notes",
      name: "\u{1F504} \u91CD\u65B0\u7D22\u5F15\u6240\u6709\u6570\u5B66\u7B14\u8BB0",
      callback: async () => await this.reindexAllNotes()
    });
    this.addCommand({
      id: "test-api-connection",
      name: "\u{1F50C} \u6D4B\u8BD5 API / Ollama \u8FDE\u63A5",
      callback: async () => await this.testApiConnection()
    });
    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        async (evt, editor, view) => {
          if (this.settings.autoAnalyze && evt.clipboardData && evt.clipboardData.files && evt.clipboardData.files.length > 0) {
            for (const file of Array.from(evt.clipboardData.files)) {
              if (file.type.startsWith("image/")) {
                setTimeout(() => {
                  this.analyzeLastImageInNote();
                }, 500);
                break;
              }
            }
          }
        }
      )
    );
  }
  onunload() {
    if (this.vectorIndex) {
      this.vectorIndex.saveIndex().catch(() => {
      });
    }
  }
  async loadSettings() {
    const raw = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw ?? {});
    if (raw && raw.provider === void 0 && raw.ollamaUrl !== void 0) {
      this.settings.provider = "ollama";
    }
  }
  async saveSettings() {
    await super.saveData(this.settings);
  }
  async analyzeLastImageInNote() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (!view) {
      new import_obsidian5.Notice("\u8BF7\u5148\u5728 Markdown \u7F16\u8F91\u5668\u6FC0\u6D3B\u7B14\u8BB0");
      return;
    }
    const file = view.file;
    if (!file) {
      new import_obsidian5.Notice("\u8BF7\u5148\u6253\u5F00\u6709\u6548\u7684\u7B14\u8BB0\u6587\u4EF6");
      return;
    }
    let content = await this.app.vault.read(file);
    const imageLinks = Array.from(content.matchAll(/!\[\[(.*?)\]\]/g));
    if (imageLinks.length === 0) {
      new import_obsidian5.Notice("\u5F53\u524D\u7B14\u8BB0\u4E2D\u672A\u627E\u5230\u56FE\u7247");
      return;
    }
    const lastImage = imageLinks[imageLinks.length - 1][1];
    let imgFile = this.app.vault.getAbstractFileByPath(lastImage);
    if (!imgFile || !(imgFile instanceof import_obsidian5.TFile)) {
      const curDir = file.path.substring(0, file.path.lastIndexOf("/"));
      imgFile = this.app.vault.getAbstractFileByPath(
        curDir + "/" + lastImage
      );
    }
    if (!imgFile || !(imgFile instanceof import_obsidian5.TFile)) {
      new import_obsidian5.Notice("\u56FE\u7247\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u8DEF\u5F84\u8BC6\u522B\u5931\u8D25");
      return;
    }
    let buffer;
    try {
      buffer = await this.app.vault.readBinary(imgFile);
    } catch {
      new import_obsidian5.Notice("\u56FE\u7247\u8BFB\u53D6\u5931\u8D25");
      return;
    }
    const base64 = arrayBufferToBase64(buffer);
    let analysis;
    try {
      analysis = await this.backend.analyzeMathProblem(base64);
    } catch {
      return;
    }
    const md = formatSolution(analysis, lastImage);
    try {
      await this.app.vault.append(file, "\n" + md);
    } catch {
      new import_obsidian5.Notice("\u9898\u89E3\u5199\u5165\u5931\u8D25");
      return;
    }
    try {
      this.app.fileManager.processFrontMatter(file, (fm) => {
        fm["\u9898\u578B"] = analysis.problemType || "\u672A\u77E5\u9898\u578B";
        fm["\u77E5\u8BC6\u70B9"] = analysis.knowledgePoints || [];
        fm["\u96BE\u5EA6"] = analysis.difficulty || "\u672A\u77E5";
        fm["\u590D\u4E60\u72B6\u6001"] = "\u5F85\u590D\u4E60";
        fm["\u5206\u6790\u65F6\u95F4"] = (/* @__PURE__ */ new Date()).toISOString();
      });
    } catch {
    }
    await this.vectorIndex.indexNote(file.path, content, analysis);
    new import_obsidian5.Notice("\u9898\u89E3\u5206\u6790\u5DF2\u751F\u6210");
  }
  async findSimilarProblems() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (!view || !view.file) {
      new import_obsidian5.Notice("\u8BF7\u5148\u6FC0\u6D3B\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
      return;
    }
    const file = view.file;
    const content = await this.app.vault.read(file);
    const results = await this.vectorIndex.findSimilar(
      file.path,
      content,
      this.settings.maxSimilarResults
    );
    if (!results || results.length === 0) {
      new import_obsidian5.Notice("\u672A\u627E\u5230\u9AD8\u76F8\u4F3C\u5EA6\u7684\u5386\u53F2\u9898\u578B");
      return;
    }
    const md = `
## \u76F8\u4F3C\u9898\u578B\u94FE\u63A5
` + results.map(
      (r) => `- [[${r.path}]]\uFF08\u9898\u578B\uFF1A${r.problemType}\uFF0C\u76F8\u4F3C\u5EA6\uFF1A${(r.score * 100).toFixed(1)}%\uFF09`
    ).join("\n");
    try {
      await this.app.vault.append(file, "\n" + md);
    } catch {
      new import_obsidian5.Notice("\u76F8\u4F3C\u9898\u7ED3\u679C\u5199\u5165\u5931\u8D25");
      return;
    }
    new import_obsidian5.Notice("\u76F8\u4F3C\u9898\u578B\u5DF2\u63D2\u5165\u7B14\u8BB0\u672B\u5C3E");
  }
  async reindexAllNotes() {
    const files = this.app.vault.getMarkdownFiles();
    let cnt = 0;
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.frontmatter && cache.frontmatter["\u9898\u578B"]) {
        const content = await this.app.vault.read(file);
        const analysis = {
          problemType: cache.frontmatter["\u9898\u578B"],
          knowledgePoints: Array.isArray(cache.frontmatter["\u77E5\u8BC6\u70B9"]) ? cache.frontmatter["\u77E5\u8BC6\u70B9"] : [cache.frontmatter["\u77E5\u8BC6\u70B9"]].filter(Boolean),
          difficulty: cache.frontmatter["\u96BE\u5EA6"] || "\u672A\u77E5",
          thoughtProcess: "",
          steps: [],
          cautions: []
        };
        try {
          await this.vectorIndex.indexNote(file.path, content, analysis);
          cnt++;
        } catch {
        }
      }
    }
    new import_obsidian5.Notice(`\u5DF2\u91CD\u5EFA\u7D22\u5F15: \u5171 ${cnt} \u6761`);
  }
};
