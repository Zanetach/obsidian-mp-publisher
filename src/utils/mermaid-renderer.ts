// Mermaid diagram rendering utility

let mermaidInitialized = false;

/**
 * 初始化 Mermaid
 */
export async function initializeMermaid(): Promise<void> {
    if (mermaidInitialized) return;

    try {
        // 动态导入 mermaid
        const mermaid = await import('mermaid');
        mermaid.default.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
        mermaidInitialized = true;
    } catch (error) {
        console.error('Mermaid 初始化失败:', error);
    }
}

/**
 * 渲染 Mermaid 图表
 * @param container HTML 容器元素
 * @param isDarkMode 是否为暗色模式
 * @param renderId 渲染 ID（用于区分不同渲染）
 */
export async function renderMermaidDiagrams(
    container: HTMLElement,
    isDarkMode: boolean = false,
    renderId: string = ''
): Promise<void> {
    if (!mermaidInitialized) {
        await initializeMermaid();
    }

    // 查找所有 mermaid 代码块
    const mermaidNodes = container.querySelectorAll(
        '.mermaid, pre.language-mermaid, pre.lang-mermaid, pre > code.language-mermaid, pre > code.lang-mermaid'
    );

    if (mermaidNodes.length === 0) return;

    try {
        const mermaid = await import('mermaid');

        // 设置主题
        const theme = isDarkMode ? 'dark' : 'default';

        mermaidNodes.forEach(async (node, index) => {
            // 获取图表代码
            let diagram = '';
            const preEl = node.parentElement?.tagName === 'PRE' ? node.parentElement : node;

            if (preEl) {
                diagram = preEl.textContent || '';
            }

            if (!diagram.trim()) return;

            // 创建 wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper';

            // 创建唯一的 ID
            const diagramId = `mermaid-${renderId}-${Date.now()}-${index}`;

            try {
                // 渲染图表
                const { svg } = await mermaid.default.render(diagramId, diagram);
                wrapper.innerHTML = svg;

                // 替换原来的代码块
                if (preEl && preEl.parentElement) {
                    preEl.parentElement.replaceChild(wrapper, preEl);
                }
            } catch (error) {
                // 渲染失败，显示错误信息
                console.error('Mermaid 渲染失败:', error);
                const errorEl = document.createElement('div');
                errorEl.className = 'mermaid-error';
                errorEl.textContent = `图表渲染失败: ${(error as Error).message}`;
                errorEl.style.padding = '10px';
                errorEl.style.background = '#fee';
                errorEl.style.color = '#c00';
                errorEl.style.borderRadius = '4px';

                if (preEl && preEl.parentElement) {
                    preEl.parentElement.replaceChild(errorEl, preEl);
                }
            }
        });
    } catch (error) {
        console.error('Mermaid 渲染出错:', error);
    }
}

/**
 * 检查是否为暗色模式
 */
export function checkIsDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    return document.body.classList.contains('theme-dark');
}
