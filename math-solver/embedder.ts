import { App, Notice } from "obsidian";
import type { InferenceBackend } from "./api-client";
import { MathAnalysisResult } from "./utils";

export interface IndexEntry {
  path: string;
  embedding: number[];
  problemType: string;
  knowledgePoints: string[];
  indexedAt: number;
}

export interface SimilarResult extends IndexEntry {
  score: number;
}

export class VectorIndex {
  private app: App;
  private backend: InferenceBackend;
  private entries: Map<string, IndexEntry> = new Map();
  private indexPath: string;

  constructor(app: App, backend: InferenceBackend, pluginId: string) {
    this.app = app;
    this.backend = backend;
    this.indexPath = `.obsidian/plugins/${pluginId}/vector-index.json`;
  }

  setBackend(backend: InferenceBackend): void {
    this.backend = backend;
  }

  async indexNote(path: string, content: string, metadata: MathAnalysisResult) {
    let embedding: number[];
    try {
      embedding = await this.backend.getEmbedding(content);
    } catch {
      new Notice("Embedding 失败，已降级为关键词索引");
      embedding = this.keywordToFakeEmbedding(content);
    }
    const entry: IndexEntry = {
      path,
      embedding,
      problemType: metadata.problemType,
      knowledgePoints: metadata.knowledgePoints,
      indexedAt: Date.now(),
    };
    this.entries.set(path, entry);
    this.saveIndex().catch(() => {
      new Notice("向量索引保存失败");
    });
  }

  async findSimilar(
    path: string,
    content: string,
    topK: number
  ): Promise<SimilarResult[]> {
    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.backend.getEmbedding(content);
    } catch {
      queryEmbedding = this.keywordToFakeEmbedding(content);
    }
    const results: SimilarResult[] = [];
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
      const arr = JSON.parse(data) as IndexEntry[];
      this.entries = new Map(arr.map((e) => [e.path, e]));
    } catch {
      this.entries = new Map();
    }
  }

  async saveIndex() {
    const out = Array.from(this.entries.values());
    await this.app.vault.adapter.write(
      this.indexPath,
      JSON.stringify(out, null, 2)
    );
  }

  private keywordToFakeEmbedding(text: string): number[] {
    const arr = new Array(64).fill(0);
    for (const ch of text) {
      arr[ch.charCodeAt(0) % 64]++;
    }
    const len = Math.max(text.length, 1);
    return arr.map((x) => x / len);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let sum = 0,
      sa = 0,
      sb = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
      sa += a[i] * a[i];
      sb += b[i] * b[i];
    }
    if (sa === 0 || sb === 0) return 0;
    return sum / (Math.sqrt(sa) * Math.sqrt(sb));
  }
}
