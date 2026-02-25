## 为什么

现有 obsidian-mp-publisher 项目的主题系统基于 JSON 模板配置，功能相对基础。同时，obsidian-md-beautify-plugin 项目提供了更完整的主题系统，包括 13 个现代化 CSS 主题、Mermaid 图表渲染、KaTeX 数学公式支持、GitHub 风格代码高亮以及明暗模式切换等特性。将这些功能完整集成可以大幅提升用户的预览和发布体验。

## 变更内容

1. **引入 @mdb/core 核心模块** - 将外部项目的核心解析引擎（MarkdownParser、ThemeProcessor、wechatDarkMode）完整复制到项目中
2. **添加 13 个 CSS 预设主题** - 包括 basic、codeGithub、academicPaper、auroraGlass、bauhaus、cyberpunkNeon、knowledgeBase、luxuryGold、morandiForest、neoBrutalism、receipt、sunsetFilm、template
3. **集成 Mermaid 图表渲染** - 支持流程图、时序图、类图等多种图表的实时渲染
4. **集成 KaTeX 数学公式** - 支持 LaTeX 语法渲染数学公式
5. **添加代码高亮** - 基于 highlight.js 的 GitHub 风格代码高亮
6. **实现明暗模式切换** - 支持 auto/light/dark 三种模式
7. **添加主题管理器 UI** - 允许用户创建、编辑、删除自定义主题
8. **重构渲染管线** - 将现有基于 Obsidian MarkdownRenderer 的渲染切换到自定义 markdown-it 解析器

## 功能 (Capabilities)

### 新增功能
- `css-theme-system`: 基于 CSS 的现代化主题系统，支持 13 个预设主题和用户自定义主题
- `mermaid-rendering`: Mermaid 图表实时渲染功能，支持多种图表类型
- `katex-math`: KaTeX 数学公式渲染支持
- `code-highlighting`: 基于 highlight.js 的代码高亮
- `theme-manager-ui`: 主题管理界面，用于创建、编辑、删除自定义主题
- `dark-mode`: 明暗模式自动/手动切换

### 修改功能
- (无)

## 影响

- 需要新增 `src/core/` 目录存放核心解析模块
- 需要新增 `src/plugins/` 目录存放 markdown-it 插件
- 需要修改 `src/converter.ts` 使用新解析器
- 需要修改 `src/templateManager.ts` 支持 CSS 主题
- 需要修改 `src/settings/MPSettingTab.ts` 添加主题管理界面
- 需要添加新依赖：markdown-it、highlight.js、juice、katex、mermaid 等
- 需要修改 `src/view.ts` 添加 Mermaid 渲染支持
