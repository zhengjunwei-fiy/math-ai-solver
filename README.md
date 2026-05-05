# 考研数学 AI 题解

一个 Obsidian 桌面端插件，用于识别数学题截图、生成结构化题解，并基于向量索引查找历史相似题型。

## 功能特性

- 识别笔记中的数学题图片，自动生成题型、知识点、难度、解题思路、详细步骤和易错提醒
- 支持在线 API 后端：智谱 AI、阿里云通义千问、OpenAI 兼容接口
- 支持本地 Ollama 后端，可在本机运行视觉模型和 Embedding 模型
- 自动为已分析题目建立向量索引，用于查找相似题型
- 支持粘贴图片后自动分析
- 支持手动重建全部数学笔记索引

## 目录结构

```text
math-solver/
├── api-client.ts      # 在线 API 后端与统一推理接口
├── embedder.ts        # 向量索引与相似题检索
├── main.ts            # Obsidian 插件入口
├── ollama.ts          # Ollama 本地后端
├── settings.ts        # 插件设置页
├── utils.ts           # 通用工具与结果校验
├── manifest.json      # Obsidian 插件清单
├── package.json       # 构建脚本与依赖
└── styles.css         # 插件样式
```

## 安装使用

1. 进入插件目录：

```bash
cd math-solver
```

2. 安装依赖：

```bash
npm install
```

3. 构建插件：

```bash
npm run build
```

4. 将 `math-solver` 文件夹复制到你的 Obsidian 仓库插件目录：

```text
你的仓库/.obsidian/plugins/math-ai-solver/
```

5. 在 Obsidian 中打开设置，进入“第三方插件”，启用 `考研数学 AI 题解`。

## 配置说明

进入 Obsidian 插件设置页后，选择推理后端并填写对应配置。

### 在线 API

可选后端：

- 智谱 AI
- 阿里云通义千问
- OpenAI / OpenAI 兼容接口

需要配置：

- `API Key`
- `Base URL`
- 多模态识图模型
- Embedding 模型
- 请求超时时间
- Temperature

默认模型示例：

| 后端 | 视觉模型 | Embedding 模型 |
| --- | --- | --- |
| 智谱 AI | `glm-4v-flash` | `embedding-3` |
| 通义千问 | `qwen-vl-plus` | `text-embedding-v3` |
| OpenAI 兼容接口 | `gpt-4o-mini` | `text-embedding-3-small` |

### 本地 Ollama

需要先启动 Ollama：

```bash
ollama serve
```

推荐配置：

- Ollama 地址：`http://localhost:11434`
- 视觉模型：`qwen2-vl:7b`
- Embedding 模型：`nomic-embed-text`

请确保对应模型已在本地拉取。

## 使用方式

### 分析数学题图片

1. 在 Obsidian 笔记中插入或粘贴题目截图
2. 确保图片以 wiki 链接形式出现在笔记中，例如：

```markdown
![[example.png]]
```

3. 执行命令：

```text
分析数学题并生成题解
```

插件会在当前笔记末尾追加题解分析，并写入题型、知识点、难度、复习状态等 frontmatter 信息。

### 查找相似题型

在已分析过的题目笔记中执行：

```text
查找相似题型
```

插件会根据当前笔记内容和历史向量索引，在笔记末尾插入相似题链接。

### 重建索引

如果更换了 Embedding 模型，或历史索引不完整，可以执行：

```text
重新索引所有数学笔记
```

插件会扫描带有题型 frontmatter 的 Markdown 笔记，并重建相似题索引。

### 测试连接

在插件设置页点击“测试连接”，或执行命令：

```text
测试 API / Ollama 连接
```

## 开发命令

在 `math-solver` 目录下运行：

```bash
npm run check
```

执行 TypeScript 类型检查。

```bash
npm run build
```

构建 Obsidian 可加载的 `main.js`。

```bash
npm run dev
```

以 watch 模式构建，适合开发时实时调试。

## 数据与隐私

- 使用在线 API 时，题目截图和用于 Embedding 的笔记内容会发送到所选服务商
- API Key 保存在当前 Obsidian 仓库的插件数据文件中
- 使用本地 Ollama 时，图片和笔记内容由本地模型处理
- 向量索引保存在插件目录下的 `vector-index.json`

## 注意事项

- 该插件仅支持 Obsidian 桌面端
- 当前笔记必须是 Markdown 编辑视图
- 图片需要能被 Obsidian 识别为有效附件
- 相似题检索依赖 Embedding 质量，模型变化后建议重新索引
- 在线 API 的响应格式和模型能力会影响题解质量
<img width="1454" height="648" alt="image" src="https://github.com/user-attachments/assets/a9296717-850c-4807-8a05-e05f32eaa94f" />
//
<img width="1383" height="1056" alt="image" src="https://github.com/user-attachments/assets/fdb2df57-5ccc-4f27-902b-5b584d1758ef" />
//
<img width="1304" height="695" alt="image" src="https://github.com/user-attachments/assets/885c447a-5899-43f5-b922-798bd480975e" />
//
<img width="1463" height="1142" alt="image" src="https://github.com/user-attachments/assets/d6ed537c-9795-4af5-a77c-748efa89c6ee" />



