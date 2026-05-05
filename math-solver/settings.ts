import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export type ApiProvider = "zhipu" | "dashscope" | "openai" | "ollama";

export interface MathSolverSettings {
  provider: ApiProvider;
  apiKey: string;
  baseUrl: string;
  visionModel: string;
  embeddingModel: string;
  autoAnalyze: boolean;
  maxSimilarResults: number;
  requestTimeout: number;
  temperature: number;
  /** 本地 Ollama 服务地址（provider === 'ollama' 时使用） */
  ollamaUrl: string;
}

export const DEFAULT_SETTINGS: MathSolverSettings = {
  provider: "zhipu",
  apiKey: "",
  baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  visionModel: "glm-4v-flash",
  embeddingModel: "embedding-3",
  autoAnalyze: true,
  maxSimilarResults: 5,
  requestTimeout: 30000,
  temperature: 0.3,
  ollamaUrl: "http://localhost:11434",
};

export const PROVIDER_LABELS: Record<ApiProvider, string> = {
  zhipu: "智谱 AI",
  dashscope: "阿里云通义",
  openai: "OpenAI 兼容",
  ollama: "本地 Ollama",
};

const DEFAULTS_BY_PROVIDER: Record<
  ApiProvider,
  Pick<MathSolverSettings, "baseUrl" | "visionModel" | "embeddingModel">
> = {
  zhipu: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    visionModel: "glm-4v-flash",
    embeddingModel: "embedding-3",
  },
  dashscope: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    visionModel: "qwen-vl-plus",
    embeddingModel: "text-embedding-v3",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    visionModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  },
  ollama: {
    baseUrl: "",
    visionModel: "qwen2-vl:7b",
    embeddingModel: "nomic-embed-text",
  },
};

/** 切换 provider 时写入默认 Base URL 与模型 ID（不覆盖 apiKey） */
export function applyProviderDefaults(s: MathSolverSettings): void {
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

export interface MathSolverPluginLike extends Plugin {
  settings: MathSolverSettings;
  saveSettings(): Promise<void>;
  refreshBackend(): void;
  testApiConnection(): Promise<void>;
}

export class MathSolverSettingTab extends PluginSettingTab {
  plugin: MathSolverPluginLike;

  constructor(app: App, plugin: MathSolverPluginLike) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;

    containerEl.createEl("h2", { text: "考研数学 AI 题解 — 插件设置" });

    const privacy = containerEl.createDiv({ cls: "math-solver-privacy-notice" });
    privacy.createEl("p", {
      text:
        s.provider === "ollama"
          ? "当前为本地 Ollama：图片与笔记内容仅在本地处理。"
          : `当前为在线 API（${PROVIDER_LABELS[s.provider]}）：题目截图与用于 Embedding 的笔记正文将发送至服务商，请勿上传敏感内容。API Key 仅保存在本仓库的插件 data.json 中。`,
    });

    new Setting(containerEl)
      .setName("推理后端")
      .setDesc("在线 API 零本地显存；本地 Ollama 需自行运行模型服务。")
      .addDropdown((dd) =>
        dd
          .addOption("zhipu", "智谱 AI（推荐）")
          .addOption("dashscope", "阿里云通义千问")
          .addOption("openai", "OpenAI / 兼容接口")
          .addOption("ollama", "本地 Ollama")
          .setValue(s.provider)
          .onChange(async (v) => {
            this.plugin.settings.provider = v as ApiProvider;
            applyProviderDefaults(this.plugin.settings);
            await this.plugin.saveSettings();
            this.plugin.refreshBackend();
            this.display();
          })
      );

    if (s.provider !== "ollama") {
      new Setting(containerEl)
        .setName("API Key")
        .setDesc("不会上传到任何第三方除所选服务商以外的地址。")
        .addText((text) => {
          text.inputEl.type = "password";
          text.setPlaceholder("填写 API Key")
            .setValue(s.apiKey)
            .onChange(async (value) => {
              this.plugin.settings.apiKey = value.trim();
              await this.plugin.saveSettings();
            });
        });

      new Setting(containerEl)
        .setName("Base URL")
        .setDesc("切换服务商时会自动填入默认值，可按需改为代理或兼容网关。")
        .addText((text) =>
          text
            .setPlaceholder("https://...")
            .setValue(s.baseUrl)
            .onChange(async (value) => {
              this.plugin.settings.baseUrl = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("多模态识图模型")
        .setDesc("例如智谱 glm-4v-flash、通义 qwen-vl-plus、OpenAI gpt-4o-mini。")
        .addText((text) =>
          text
            .setPlaceholder("模型 ID")
            .setValue(s.visionModel)
            .onChange(async (value) => {
              this.plugin.settings.visionModel = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Embedding 模型")
        .setDesc("更换 Embedding 模型后建议执行「重新索引」以保证向量维度一致。")
        .addText((text) =>
          text
            .setPlaceholder("模型 ID")
            .setValue(s.embeddingModel)
            .onChange(async (value) => {
              this.plugin.settings.embeddingModel = value.trim();
              await this.plugin.saveSettings();
            })
        );
    } else {
      new Setting(containerEl)
        .setName("Ollama 服务地址")
        .setDesc("本地 REST 入口，例如 http://localhost:11434")
        .addText((text) =>
          text
            .setPlaceholder("http://localhost:11434")
            .setValue(s.ollamaUrl)
            .onChange(async (value) => {
              this.plugin.settings.ollamaUrl = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("多模态模型")
        .setDesc("Ollama 中的 vision 模型名称")
        .addText((text) =>
          text
            .setPlaceholder("qwen2-vl:7b")
            .setValue(s.visionModel)
            .onChange(async (value) => {
              this.plugin.settings.visionModel = value.trim();
              await this.plugin.saveSettings();
              this.plugin.refreshBackend();
            })
        );

      new Setting(containerEl)
        .setName("Embedding 模型")
        .setDesc("Ollama embeddings 模型名称")
        .addText((text) =>
          text
            .setPlaceholder("nomic-embed-text")
            .setValue(s.embeddingModel)
            .onChange(async (value) => {
              this.plugin.settings.embeddingModel = value.trim();
              await this.plugin.saveSettings();
              this.plugin.refreshBackend();
            })
        );
    }

    new Setting(containerEl)
      .setName("请求超时（毫秒）")
      .setDesc("识图与 Embedding 共用，默认 30000。")
      .addText((text) =>
        text
          .setPlaceholder("30000")
          .setValue(String(s.requestTimeout))
          .onChange(async (value) => {
            const n = parseInt(value.trim(), 10);
            this.plugin.settings.requestTimeout =
              Number.isFinite(n) && n >= 5000 ? n : DEFAULT_SETTINGS.requestTimeout;
            await this.plugin.saveSettings();
            this.plugin.refreshBackend();
          })
      );

    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("数学解题建议偏低（默认 0.3）。仅在线 API 识图请求生效。")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.05)
          .setValue(s.temperature)
          .onChange(async (value) => {
            this.plugin.settings.temperature = value;
            await this.plugin.saveSettings();
            slider.setDynamicTooltip();
          })
      );

    new Setting(containerEl)
      .setName("测试 API 连接")
      .setDesc("在线：尝试列出模型或探测 Embedding；Ollama：请求 /api/tags。")
      .addButton((btn) =>
        btn.setButtonText("测试连接").onClick(async () => {
          btn.setDisabled(true);
          try {
            await this.plugin.testApiConnection();
          } finally {
            btn.setDisabled(false);
          }
        })
      );

    new Setting(containerEl)
      .setName("粘贴图片后自动分析")
      .setDesc("开启后，粘贴图片时会自动触发题解生成（需当前笔记含 wiki 图片链接）。")
      .addToggle((toggle) =>
        toggle.setValue(s.autoAnalyze).onChange(async (value) => {
          this.plugin.settings.autoAnalyze = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("相似题型返回数量")
      .setDesc("1–10")
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(s.maxSimilarResults)
          .onChange(async (value) => {
            this.plugin.settings.maxSimilarResults = value;
            await this.plugin.saveSettings();
            slider.setDynamicTooltip();
          })
      );
  }
}
