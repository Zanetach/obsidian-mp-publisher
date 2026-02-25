## 1. 环境搭建

- [x] 1.1 创建 `src/core/` 目录结构
- [x] 1.2 创建 `src/plugins/` 目录结构
- [x] 1.3 向 package.json 添加核心依赖 (markdown-it, highlight.js, juice, katex, mermaid 等)
- [x] 1.4 运行 npm install 安装依赖

## 2. 核心模块集成

- [x] 2.1 复制 MarkdownParser.ts 到 src/core/
- [x] 2.2 复制 ThemeProcessor.ts 到 src/core/
- [x] 2.3 复制 wechatDarkMode.ts 到 src/core/
- [x] 2.4 创建 src/core/index.ts 统一导出
- [x] 2.5 复制 langHighlight.ts 工具文件到 src/utils/

## 3. 主题系统集成

- [x] 3.1 创建 src/core/themes/ 目录
- [x] 3.2 复制 13 个预设主题 CSS 文件到 src/core/themes/
- [x] 3.3 创建 src/core/themes/index.ts 统一导出
- [x] 3.4 修改 settings.ts 添加主题相关配置字段
- [x] 3.5 实现 ThemeManager 类管理主题切换

## 4. Markdown 插件集成

- [x] 4.1 复制 markdown-it-math.ts 到 src/plugins/
- [x] 4.2 复制 markdown-it-task-lists.ts 到 src/plugins/
- [x] 4.3 复制 markdown-it-github-alert.ts 到 src/plugins/
- [x] 4.4 复制其他必要插件到 src/plugins/
- [x] 4.5 创建 src/plugins/index.ts 统一导出

## 5. 渲染管线重构

- [x] 5.1 重构 converter.ts 使用 markdown-it 解析器
- [x] 5.2 修改 markdownToHtml 函数调用 ThemeProcessor
- [x] 5.3 保留原有 MarkdownRenderer 作为后备方案
- [ ] 5.4 测试渲染结果与原有功能一致性

## 6. 主题管理器 UI

- [x] 6.1 在 MPSettingTab.ts 添加主题管理入口
- [x] 6.2 创建 ThemeManagerModal 组件
- [x] 6.3 实现主题列表展示功能
- [x] 6.4 实现自定义主题创建/编辑/删除功能
- [x] 6.5 添加主题 CSS 编辑器（textarea）
- [x] 6.6 实现主题预览功能 - 通过主题选择实时预览
- [x] 6.7 添加主题导入/导出功能 - 支持导出 CSS 文件

## 7. Mermaid 集成

- [x] 7.1 在 view.ts 添加 Mermaid 渲染逻辑
- [x] 7.2 实现 mermaid.initialize 配置
- [x] 7.3 实现 Mermaid 代码块识别和渲染
- [x] 7.4 实现明暗模式主题适配
- [x] 7.5 添加渲染错误处理和错误信息显示
- [x] 7.6 测试各类 Mermaid 图表渲染

## 8. KaTeX 集成

- [x] 8.1 复制 katex-inline.css 到 src/styles/
- [x] 8.2 修改 MarkdownParser 配置启用 KaTeX 支持
- [x] 8.3 实现行内公式渲染 ($...$) - 使用 markdown-it 内置支持
- [x] 8.4 实现块级公式渲染 ($$...$$) - 使用 markdown-it 内置支持
- [x] 8.5 添加 KaTeX 字体样式适配

## 9. 代码高亮集成

- [x] 9.1 在 MarkdownParser 中集成 highlight.js
- [x] 9.2 实现代码块语法高亮
- [x] 9.3 添加代码主题样式到预设主题
- [x] 9.4 实现复制按钮功能（复制纯代码）
- [ ] 9.5 测试多语言代码高亮

## 10. 明暗模式支持

- [x] 10.1 在设置中添加明暗模式选择器 (auto/light/dark)
- [x] 10.2 实现跟随系统主题功能
- [x] 10.3 为预设主题创建暗色变体 CSS - 使用代码主题中的暗色变量
- [x] 10.4 实现主题实时切换功能
- [x] 10.5 添加预览视图明暗模式切换按钮

## 11. 微信深色模式

- [x] 11.1 集成 convertCssToWeChatDarkMode 函数
- [x] 11.2 在复制功能中添加深色模式转换选项
- [x] 11.3 测试微信深色模式渲染效果

## 12. 测试与优化

- [x] 12.1 测试所有 13 个预设主题渲染效果
- [x] 12.2 测试自定义主题创建/编辑/删除流程
- [x] 12.3 测试 Mermaid 图表渲染
- [x] 12.4 测试 KaTeX 公式渲染
- [x] 12.5 测试代码高亮效果
- [x] 12.6 测试明暗模式切换
- [x] 12.7 测试微信发布流程兼容性
- [x] 12.8 性能优化（渲染速度、内存占用）
- [ ] 12.9 更新 README 文档说明新功能
