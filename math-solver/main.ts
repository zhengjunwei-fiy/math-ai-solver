import {
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  Editor,
} from "obsidian";

import {
  MathSolverSettings,
  DEFAULT_SETTINGS,
  MathSolverSettingTab,
  MathSolverPluginLike,
} from "./settings";
import { arrayBufferToBase64, MathAnalysisResult } from "./utils";
import {
  createInferenceBackend,
  testInferenceConnection,
  type InferenceBackend,
} from "./api-client";
import { VectorIndex } from "./embedder";

function formatSolution(result: MathAnalysisResult, imageName: string): string {
  const related =
    result.relatedConcepts && result.relatedConcepts.length > 0
      ? `\n### 🔗 相关概念\n\n${result.relatedConcepts.map((c) => `- ${c}`).join("\n")}\n`
      : "";

  return `## 🧮 题解分析

> [!info] 题型识别
> **题型**：${result.problemType}
> **知识点**：${result.knowledgePoints.join("、")}
> **难度**：${result.difficulty}

### 💡 解题思路

${result.thoughtProcess}

### 📝 详细步骤

${result.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### ⚠️ 注意事项

${result.cautions.map((c) => `- ${c}`).join("\n")}
${related}
### 📎 原题

![[${imageName}]]

---
*分析时间：${new Date().toLocaleString()}*
`;
}

export default class MathSolverPlugin extends Plugin implements MathSolverPluginLike {
  settings!: MathSolverSettings;
  backend!: InferenceBackend;
  vectorIndex!: VectorIndex;

  refreshBackend(): void {
    this.backend = createInferenceBackend(this.settings);
    if (this.vectorIndex) {
      this.vectorIndex.setBackend(this.backend);
    }
  }

  async testApiConnection(): Promise<void> {
    const r = await testInferenceConnection(this.settings);
    new Notice(r.success ? `✓ ${r.message}` : `✗ ${r.message}`);
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
      name: "🧮 分析数学题并生成题解",
      callback: async () => await this.analyzeLastImageInNote(),
    });

    this.addCommand({
      id: "find-similar-problems",
      name: "🔗 查找相似题型",
      callback: async () => await this.findSimilarProblems(),
    });

    this.addCommand({
      id: "reindex-all-math-notes",
      name: "🔄 重新索引所有数学笔记",
      callback: async () => await this.reindexAllNotes(),
    });

    this.addCommand({
      id: "test-api-connection",
      name: "🔌 测试 API / Ollama 连接",
      callback: async () => await this.testApiConnection(),
    });

    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        async (evt, editor: Editor, view: MarkdownView) => {
          if (
            this.settings.autoAnalyze &&
            evt.clipboardData &&
            evt.clipboardData.files &&
            evt.clipboardData.files.length > 0
          ) {
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

  onunload(): void {
    if (this.vectorIndex) {
      this.vectorIndex.saveIndex().catch(() => {});
    }
  }

  async loadSettings() {
    const raw = (await this.loadData()) as Partial<MathSolverSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw ?? {});
    if (raw && raw.provider === undefined && raw.ollamaUrl !== undefined) {
      this.settings.provider = "ollama";
    }
  }

  async saveSettings() {
    await super.saveData(this.settings);
  }

  async analyzeLastImageInNote() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("请先在 Markdown 编辑器激活笔记");
      return;
    }
    const file = view.file;
    if (!file) {
      new Notice("请先打开有效的笔记文件");
      return;
    }
    let content = await this.app.vault.read(file);

    const imageLinks = Array.from(content.matchAll(/!\[\[(.*?)\]\]/g));
    if (imageLinks.length === 0) {
      new Notice("当前笔记中未找到图片");
      return;
    }
    const lastImage = imageLinks[imageLinks.length - 1][1];

    let imgFile = this.app.vault.getAbstractFileByPath(lastImage) as TFile;
    if (!imgFile || !(imgFile instanceof TFile)) {
      const curDir = file.path.substring(0, file.path.lastIndexOf("/"));
      imgFile = this.app.vault.getAbstractFileByPath(
        curDir + "/" + lastImage
      ) as TFile;
    }
    if (!imgFile || !(imgFile instanceof TFile)) {
      new Notice("图片文件不存在或路径识别失败");
      return;
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await this.app.vault.readBinary(imgFile);
    } catch {
      new Notice("图片读取失败");
      return;
    }
    const base64 = arrayBufferToBase64(buffer);

    let analysis: MathAnalysisResult;
    try {
      analysis = await this.backend.analyzeMathProblem(base64);
    } catch {
      return;
    }

    const md = formatSolution(analysis, lastImage);

    try {
      await this.app.vault.append(file, "\n" + md);
    } catch {
      new Notice("题解写入失败");
      return;
    }

    try {
      this.app.fileManager.processFrontMatter(file, (fm) => {
        fm["题型"] = analysis.problemType || "未知题型";
        fm["知识点"] = analysis.knowledgePoints || [];
        fm["难度"] = analysis.difficulty || "未知";
        fm["复习状态"] = "待复习";
        fm["分析时间"] = new Date().toISOString();
      });
    } catch {}

    await this.vectorIndex.indexNote(file.path, content, analysis);

    new Notice("题解分析已生成");
  }

  async findSimilarProblems() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.file) {
      new Notice("请先激活一个笔记文件");
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
      new Notice("未找到高相似度的历史题型");
      return;
    }
    const md =
      `\n## 相似题型链接\n` +
      results
        .map(
          (r) =>
            `- [[${r.path}]]（题型：${r.problemType}，相似度：${(r.score * 100).toFixed(1)}%）`
        )
        .join("\n");
    try {
      await this.app.vault.append(file, "\n" + md);
    } catch {
      new Notice("相似题结果写入失败");
      return;
    }
    new Notice("相似题型已插入笔记末尾");
  }

  async reindexAllNotes() {
    const files = this.app.vault.getMarkdownFiles();
    let cnt = 0;
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.frontmatter && cache.frontmatter["题型"]) {
        const content = await this.app.vault.read(file);
        const analysis: MathAnalysisResult = {
          problemType: cache.frontmatter["题型"],
          knowledgePoints: Array.isArray(cache.frontmatter["知识点"])
            ? cache.frontmatter["知识点"]
            : [cache.frontmatter["知识点"]].filter(Boolean),
          difficulty: cache.frontmatter["难度"] || "未知",
          thoughtProcess: "",
          steps: [],
          cautions: [],
        };
        try {
          await this.vectorIndex.indexNote(file.path, content, analysis);
          cnt++;
        } catch {}
      }
    }
    new Notice(`已重建索引: 共 ${cnt} 条`);
  }
}
