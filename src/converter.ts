import { App, MarkdownRenderer, Component } from 'obsidian';
import { applyWechatStyle } from './utils/wechat-styler';
import { cleanObsidianUIElements } from './utils/html-cleaner';

export class MPConverter {
    private static app: App;

    static initialize(app: App) {
        this.app = app;
    }

    static formatContent(element: HTMLElement): void {
        // 创建 section 容器
        const section = document.createElement('section');
        section.className = 'mp-content-section';
        // 移动原有内容到 section 中
        while (element.firstChild) {
            section.appendChild(element.firstChild);
        }
        element.appendChild(section);

        // 处理元素
        this.processElements(section);
    }

    private static processElements(container: HTMLElement | null): void {
        if (!container) return;
        // 处理列表项内部元素，用section包裹
        container.querySelectorAll('li').forEach(li => {
            // 创建section元素
            const section = document.createElement('section');
            // 将li的所有子元素移动到section中
            while (li.firstChild) {
                section.appendChild(li.firstChild);
            }
            // 将section添加到li中
            li.appendChild(section);
        });

        // 处理代码块
        container.querySelectorAll('pre').forEach(pre => {
            // 过滤掉 frontmatter
            if (pre.classList.contains('frontmatter')) {
                // 如果是 frontmatter，直接移除整个元素
                pre.remove();
                return;
            }
            
            const codeEl = pre.querySelector('code');
            if (codeEl) {
                // 添加 macOS 风格的窗口按钮
                const header = document.createElement('div');
                header.className = 'mp-code-header';

                // 添加三个窗口按钮
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('span');
                    dot.className = 'mp-code-dot';
                    header.appendChild(dot);
                }

                pre.insertBefore(header, pre.firstChild);
                
                // 移除原有的复制按钮
                const copyButton = pre.querySelector('.copy-code-button');
                if (copyButton) {
                    copyButton.remove();
                }
            }
        });

        // 处理图片
        container.querySelectorAll('span.internal-embed[alt][src]').forEach(async el => {
            const originalSpan = el as HTMLElement;
            const src = originalSpan.getAttribute('src');
            const alt = originalSpan.getAttribute('alt');
            
            if (!src) return;
            
            try {
                const linktext = src.split('|')[0];
                const file = this.app.metadataCache.getFirstLinkpathDest(linktext, '');
                if (file) {
                    const absolutePath = this.app.vault.adapter.getResourcePath(file.path);
                    const newImg = document.createElement('img');
                    newImg.src = absolutePath;
                    if (alt) newImg.alt = alt;
                    originalSpan.parentNode?.replaceChild(newImg, originalSpan);
                }
            } catch (error) {
                console.error('图片处理失败:', error);
            }
        });
    }
}

// 导出 markdownToHtml 函数供发布模块使用
export async function markdownToHtml(
    app: App,
    markdown: string,
    sourcePath: string = '',
    convertMath: boolean = false,
    enableWechatStyle: boolean = true,
    themeStyle: string = 'modern-minimal'
): Promise<string> {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '1000px';
    document.body.appendChild(tempDiv);

    try {
        // 使用 Obsidian 的 MarkdownRenderer 渲染
        await MarkdownRenderer.render(
            app,
            markdown,
            tempDiv,
            sourcePath,
            new Component()
        );

        // 等待异步渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));

        // 清理 Obsidian UI 元素
        cleanObsidianUIElements(tempDiv);

        // 移除定位样式
        tempDiv.removeAttribute('style');

        // 序列化 HTML
        const serializer = new XMLSerializer();
        const cleanContainer = document.createElement('div');
        while (tempDiv.firstChild) {
            cleanContainer.appendChild(tempDiv.firstChild);
        }

        let htmlContent = serializer.serializeToString(cleanContainer);
        htmlContent = htmlContent.replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');

        // 如果启用微信样式，应用微信样式
        if (enableWechatStyle) {
            const themeConfig = {
                style: themeStyle as any
            };
            return applyWechatStyle(htmlContent, app, themeConfig, markdown, convertMath, false);
        }

        return htmlContent;
    } finally {
        if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
        }
    }
}