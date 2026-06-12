# 我是如何用 AI 工具 4 天搭建一个 RAG 知识库系统的

> 完整从零到上线，前端 Next.js + 后端 FastAPI + ChromaDB + DeepSeek

---

## 项目概述

**AI Document Assistant** 是一个基于 RAG（检索增强生成）技术的智能文档问答系统。用户可以上传 PDF、Word、TXT 文档，然后用自然语言提问，AI 会根据文档内容回答，并标注信息来源。

- **GitHub**: https://github.com/Fhonglei/ai-doc-assistant
- **在线 Demo**: https://fhonglei.github.io/ai-doc-assistant
- **技术栈**: Next.js 14 + FastAPI + ChromaDB + DeepSeek

---

## 技术架构

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────┐
│   Next.js 14     │────▶│    FastAPI       │────▶│  DeepSeek  │
│   GitHub Pages   │◀────│    Python        │◀────│    API     │
└──────────────────┘     └────────┬─────────┘     └────────────┘
                                  │
                          ┌───────┴───────┐
                          │   ChromaDB    │
                          │  (向量数据库)  │
                          └───────────────┘
```

### 数据流

**上传管线**：文件 → 校验(magic bytes) → 解析(PDF/DOCX/TXT) → 分块(1000字, 200重叠) → 嵌入(sentence-transformers) → ChromaDB

**查询管线**：提问 → 嵌入 → ChromaDB相似度搜索(top10) → LLM Rerank(top4) → 构建Prompt → DeepSeek流式生成 → 解析引用 → SSE返回

---

## 核心技术细节

### 1. 文档分块策略

使用 LangChain 的 `RecursiveCharacterTextSplitter`，递归按段落→句子→词分割：

```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # 每块约 250 tokens
    chunk_overlap=200,      # 重叠确保上下文连贯
    separators=["\n\n", "\n", ".", "。", " ", ""],
)
```

中文文档特别需要注意：分隔符必须包含 `"。"`（中文句号），否则分块质量很差。

### 2. 两阶段检索

这是整个系统**最关键的优化**：

**Stage 1 - 语义搜索**：用 ChromaDB 的余弦相似度检索 top 10 候选

**Stage 2 - LLM 重排序**：把 10 个候选送给 DeepSeek，让它给每个候选打分（1-10），保留 top 4

```python
# Rerank prompt 核心
prompt = f"""Rate how relevant each passage is to answering the query.
Query: {query}
Passages:
[0] {text1}...
[1] {text2}...
Output strictly as JSON: [{{"id": 0, "score": 8}}, ...]"""
```

效果对比：纯相似度检索精度约 75%，加了 LLM Rerank 后提升到 90%+。

### 3. 引用追踪

系统 prompt 要求 LLM 在引用信息时插入 `[N]` 标记：

```
System: "When you use information from an excerpt, cite it inline using [N]."
```

前端把 `[1]` `[2]` 渲染为可点击的角标，点击弹出原文。这比裸输出引用链接体验好得多。

### 4. 流式输出

使用 SSE（Server-Sent Events）协议，比 WebSocket 更简单：

```
data: {"type":"chunk","content":"根据"}
data: {"type":"chunk","content":"文档"}
data: {"type":"sources","sources":[...]}
data: {"type":"done","conversation_id":"..."}
```

前端用 `fetch` + `ReadableStream` 解析，实现打字机效果。首 token 延迟约 1.5 秒。

### 5. 本地 Embedding

放弃了 API 方案（DeepSeek 没有 embedding 端点），改用本地 `sentence-transformers` 模型：

```python
model = SentenceTransformer("all-MiniLM-L6-v2")
```

优点：免费、离线可用、384维向量足够好用。模型 90MB，首次下载后缓存。

---

## AI 工具怎么帮我做的

这个项目大量使用了 AI 编程工具，分享一下真实的协作方式：

| 工具 | 用途 | 效率提升 |
|------|------|----------|
| Claude Code | 项目架构设计、全栈代码生成、代码审查、Git 操作 | 80% 代码由它生成 |
| DeepSeek API | 项目中的 LLM 服务（回答生成、Rerank） | 核心 AI 能力 |
| sentence-transformers | 本地文本嵌入 | 替代付费 embedding API |

### 我的角色
- 定义需求和架构方向
- 测试和验证每个模块
- 修复 AI 生成代码中的 bug（比如 HuggingFace 被墙、CORS 配置、无限渲染循环）
- 代码审查发现的问题修复

### AI 不能替代的事
- 处理国内网络环境问题（HuggingFace 镜像、GitHub 终端连接）
- 海外服务的手机号验证
- 用户体验设计决策
- 最终的质量把关

---

## 踩过的坑

1. **HuggingFace 在国内被墙**：改用了 `hf-mirror.com` 镜像，但 ChromaDB 内部下载不走镜像，最后切回 `sentence-transformers` 手动调用

2. **Zustand 无限渲染循环**：`useCallback` 依赖整个 `store` 对象导致每次渲染都重建，改用单属性 selector 解决

3. **ChromaDB 空集合查询直接崩溃**：`n_results=0` 时 ChromaDB 抛 TypeError，加了空集合保护

4. **LLM 重排序 JSON 解析失败**：LLM 输出中含有 `[N]` 引用标记，贪婪正则把整个字符串当 JSON 解析。改用定位最后一个 `[{...}]` 解决

---

## 可以改进的方向

- [ ] 支持扫描 PDF 的 OCR
- [ ] 多模态支持（图片问答）
- [ ] 用户认证和权限管理
- [ ] 异步任务队列（大文件上传不阻塞）
- [ ] 更多文档格式（Markdown、HTML、EPUB）

---

## 总结

4 天时间，用 AI 工具辅助完成了从设计到上线的完整 RAG 系统。GitHub 72 个文件、11,200+ 行代码、前端在线 Demo 可用。

*2026 年 6 月 | 项目地址: https://github.com/Fhonglei/ai-doc-assistant*
