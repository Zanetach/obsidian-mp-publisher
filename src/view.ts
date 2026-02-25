import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile, setIcon, MarkdownView, Notice } from 'obsidian';
import { MPConverter } from './converter';
import { CopyManager } from './copyManager';
import type { TemplateManager } from './templateManager';
import { DonateManager } from './donateManager';
import type { SettingsManager } from './settings/settings';
import { renderMermaidDiagrams, initializeMermaid, checkIsDarkMode } from './utils/mermaid-renderer';
import { ThemeManager, THEME_NAMES } from './core/themeManager';
export const VIEW_TYPE_MP = 'mp-preview';

export class MPView extends ItemView {
    private previewEl: HTMLElement;
    private currentFile: TFile | null = null;
    private updateTimer: NodeJS.Timeout | null = null;
    private isPreviewLocked: boolean = false;
    private lockButton: HTMLButtonElement;
    private copyButton: HTMLButtonElement;
    private templateManager: TemplateManager;
    private settingsManager: SettingsManager;
    private customTemplateSelect: HTMLElement;
    private customFontSelect: HTMLElement;
    private fontSizeSelect: HTMLInputElement;
    private plugin: any; // 添加 plugin 引用

    constructor(
        leaf: WorkspaceLeaf,
        templateManager: TemplateManager,
        settingsManager: SettingsManager,
        plugin: any // 添加 plugin 参数
    ) {
        super(leaf);
        this.templateManager = templateManager;
        this.settingsManager = settingsManager;
        this.plugin = plugin; // 保存 plugin 引用
    }

    getViewType() {
        return VIEW_TYPE_MP;
    }

    getDisplayText() {
        return '公众号预览';
    }

    getIcon() {
       return 'eye';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.classList.remove('view-content');
        container.classList.add('mp-view-content');
        
        // 顶部工具栏 - 合并为单行：功能按钮 + 样式选择
        const toolbar = container.createEl('div', { cls: 'mp-toolbar' });

        // 左侧按钮组
        const leftGroup = toolbar.createEl('div', { cls: 'mp-toolbar-group' });

        // 锁定按钮
        this.lockButton = leftGroup.createEl('button', {
            cls: 'mp-toolbar-btn',
            attr: { 'aria-label': '锁定预览' }
        });
        setIcon(this.lockButton, 'lock');
        this.lockButton.addEventListener('click', () => this.togglePreviewLock());

        // 明暗模式切换按钮
        const darkModeButton = leftGroup.createEl('button', {
            cls: 'mp-toolbar-btn',
            attr: { 'aria-label': '切换明暗模式' }
        });
        setIcon(darkModeButton, 'sun');
        const currentSettingsForInit = this.settingsManager.getSettings();
        if (currentSettingsForInit.themeMode === 'dark' || (currentSettingsForInit.themeMode === 'auto' && checkIsDarkMode())) {
            setIcon(darkModeButton, 'moon');
        }
        darkModeButton.addEventListener('click', async () => {
            const currentSettings = this.settingsManager.getSettings();
            const currentMode = currentSettings.themeMode;
            let newMode: 'auto' | 'light' | 'dark' = 'auto';
            if (currentMode === 'auto') newMode = 'light';
            else if (currentMode === 'light') newMode = 'dark';
            else newMode = 'auto';
            await this.settingsManager.updateSettings({ themeMode: newMode });
            if (newMode === 'dark' || (newMode === 'auto' && checkIsDarkMode())) {
                setIcon(darkModeButton, 'moon');
            } else {
                setIcon(darkModeButton, 'sun');
            }
            await this.updatePreview();
            new Notice(`主题模式已切换为: ${newMode === 'auto' ? '跟随系统' : newMode === 'light' ? '亮色' : '暗色'}`);
        });

        // 样式选择控件组
        const controlsGroup = toolbar.createEl('div', { cls: 'mp-controls-group' });

        // CSS 主题选择器
        const themeOptions = Object.entries(THEME_NAMES).map(([value, label]) => ({ value, label }));
        this.customTemplateSelect = this.createCustomSelect(
            controlsGroup,
            'mp-theme-select',
            themeOptions
        );
        this.customTemplateSelect.id = 'theme-select';

        // 添加主题选择器的 change 事件监听
        this.customTemplateSelect.querySelector('.custom-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            await this.settingsManager.updateSettings({
                themeId: value
            });
            await this.updatePreview();
            new Notice(`主题已切换为: ${THEME_NAMES[value] || value}`);
        });

        this.customFontSelect = this.createCustomSelect(
            controlsGroup,
            'mp-font-select',
            this.getFontOptions()
        );

        // 添加字体选择器的 change 事件监听
        this.customFontSelect.querySelector('.custom-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.templateManager.setFont(value);
            await this.settingsManager.updateSettings({
                fontFamily: value
            });
            this.templateManager.applyTemplate(this.previewEl);
        });
        this.customFontSelect.id = 'font-select';

        // 字号调整
        const fontSizeGroup = controlsGroup.createEl('div', { cls: 'mp-font-size-group' });
        const decreaseButton = fontSizeGroup.createEl('button', {
            cls: 'mp-font-size-btn',
            text: '-'
        });
        this.fontSizeSelect = fontSizeGroup.createEl('input', {
            cls: 'mp-font-size-input',
            type: 'text',
            value: '16',
            attr: {
                style: 'border: none; outline: none; background: transparent;'
            }
        });
        const increaseButton = fontSizeGroup.createEl('button', { 
            cls: 'mp-font-size-btn',
            text: '+'
        });

        // 从设置中恢复上次的选择
        const settings = this.settingsManager.getSettings();

        // 恢复主题设置
        const themeId = settings.themeId || 'basic';
        const themeSelect = this.customTemplateSelect.querySelector('.selected-text');
        const themeDropdown = this.customTemplateSelect.querySelector('.select-dropdown');
        if (themeSelect && themeDropdown) {
            const themeOption = Object.entries(THEME_NAMES).find(([value]) => value === themeId);
            if (themeOption) {
                themeSelect.textContent = themeOption[1];
                this.customTemplateSelect.querySelector('.custom-select')?.setAttribute('data-value', themeOption[0]);
                themeDropdown.querySelectorAll('.select-item').forEach(el => {
                    if (el.getAttribute('data-value') === themeOption[0]) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
            }
        }

        if (settings.fontFamily) {
            const fontSelect = this.customFontSelect.querySelector('.selected-text');
            const fontDropdown = this.customFontSelect.querySelector('.select-dropdown');
            if (fontSelect && fontDropdown) {
                const option = this.getFontOptions();
                const selected = option.find(o => o.value === settings.fontFamily);
                if (selected) {
                    fontSelect.textContent = selected.label;
                    this.customFontSelect.querySelector('.custom-select')?.setAttribute('data-value', selected.value);
                    fontDropdown.querySelectorAll('.select-item').forEach(el => {
                        if (el.getAttribute('data-value') === selected.value) {
                            el.classList.add('selected');
                        } else {
                            el.classList.remove('selected');
                        }
                    });
                }
            }
            this.templateManager.setFont(settings.fontFamily);
        }

        if (settings.fontSize) {
            this.fontSizeSelect.value = settings.fontSize.toString();
            this.templateManager.setFontSize(settings.fontSize);
        }

        // 更新字号调整事件
        const updateFontSize = async () => {
            const size = parseInt(this.fontSizeSelect.value);
            this.templateManager.setFontSize(size);
            await this.settingsManager.updateSettings({
                fontSize: size
            });
            this.templateManager.applyTemplate(this.previewEl);
        };

        // 字号调整按钮事件
        decreaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize > 12) {
                this.fontSizeSelect.value = (currentSize - 1).toString();
                updateFontSize();
            }
        });

        increaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize < 30) {
                this.fontSizeSelect.value = (currentSize + 1).toString();
                updateFontSize();
            }
        });

        this.fontSizeSelect.addEventListener('change', updateFontSize);

        // 右侧帮助按钮
        const rightGroup = toolbar.createEl('div', { cls: 'mp-toolbar-group mp-toolbar-group-right' });
        const helpButton = rightGroup.createEl('button', {
            cls: 'mp-toolbar-btn mp-help-button',
            attr: { 'aria-label': '帮助' }
        });
        setIcon(helpButton, 'help-circle');

        // 预览区域
        this.previewEl = container.createEl('div', { cls: 'mp-preview-area' });

        // 底部工具栏
        const bottomBar = container.createEl('div', { cls: 'mp-bottom-bar' });
        const bottomInfoGroup = bottomBar.createEl('div', { cls: 'mp-bottom-info' });
        const bottomActionsGroup = bottomBar.createEl('div', { cls: 'mp-bottom-actions' });

        // 帮助按钮和提示（悬停显示）
        const helpContainer = bottomInfoGroup.createEl('div', { cls: 'mp-help-container' });
        const helpButtonBottom = helpContainer.createEl('button', {
            cls: 'mp-about-button',
            attr: { 'aria-label': '帮助' }
        });
        setIcon(helpButtonBottom, 'help-circle');
        // 帮助提示框 - 悬停显示
        helpContainer.createEl('div', {
            cls: 'mp-help-tooltip',
            text: `使用指南：
                1. 选择喜欢的主题模板
                2. 调整字体和字号
                3. 实时预览效果
                4. 点击【复制按钮】即可粘贴到公众号
                5. 编辑实时查看效果，点🔓关闭实时刷新
                6. 如果你喜欢这个插件，欢迎关注打赏`
        });

        // 关于按钮
        const aboutButton = bottomInfoGroup.createEl('button', {
            cls: 'mp-about-button',
            attr: { 'aria-label': '关于插件' }
        });
        setIcon(aboutButton, 'info');

        // 复制按钮 - 尺寸增大
        this.copyButton = bottomActionsGroup.createEl('button', {
            text: '复制公众号',
            cls: 'mp-copy-button mp-action-button'
        });
        // 发布按钮 - 尺寸增大
        const publishButton = bottomActionsGroup.createEl('button', {
            text: '发布',
            cls: 'mp-publish-button mp-action-button'
        });

        // 添加复制按钮点击事件
        this.copyButton.addEventListener('click', async () => {
            if (this.previewEl) {
                this.copyButton.disabled = true;
                this.copyButton.setText('复制中...');
                
                try {
                    await CopyManager.copyToClipboard(this.previewEl);
                    this.copyButton.setText('复制成功');
                    
                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('复制公众号');
                    }, 2000);
                } catch (error) {
                    this.copyButton.setText('复制失败');
                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('复制公众号');
                    }, 2000);
                }
            }
        });

        // 添加发布按钮点击事件
        publishButton.addEventListener('click', async () => {
            if (!this.currentFile) {
                return;
            }
            
            // 获取当前文件的 MarkdownView
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            let markdownView: MarkdownView | null = null;
            
            for (const leaf of leaves) {
                const view = leaf.view;
                if (view instanceof MarkdownView && view.file === this.currentFile) {
                    markdownView = view;
                    break;
                }
            }
            
            if (!markdownView) {
                // 如果没有找到对应的 MarkdownView，尝试打开文件
                await this.app.workspace.openLinkText(this.currentFile.path, '', false);
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && activeView.file === this.currentFile) {
                    markdownView = activeView;
                }
            }
            
            if (markdownView && this.plugin && typeof this.plugin.showPublishModal === 'function') {
                // 调用插件的发布功能
                this.plugin.showPublishModal.call(this.plugin, markdownView);
            }
        });

        // 监听文档变化
        this.registerEvent(
            this.app.workspace.on('file-open', this.onFileOpen.bind(this))
        );

        // 监听文档内容变化
        this.registerEvent(
            this.app.vault.on('modify', this.onFileModify.bind(this))
        );

        // 检查当前打开的文件
        const currentFile = this.app.workspace.getActiveFile();
        await this.onFileOpen(currentFile);
    }

    private updateControlsState(enabled: boolean) {
        this.lockButton.disabled = !enabled;
        // 更新所有自定义选择器的禁用状态
        const templateSelect = this.customTemplateSelect.querySelector('.custom-select');
        const fontSelect = this.customFontSelect.querySelector('.custom-select');

        [templateSelect, fontSelect].forEach(select => {
            if (select) {
                select.classList.toggle('disabled', !enabled);
                select.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
            }
        });

        this.fontSizeSelect.disabled = !enabled;
        this.copyButton.disabled = !enabled;
        
        // 字号调节按钮的状态控制
        const fontSizeButtons = this.containerEl.querySelectorAll('.mp-font-size-btn');
        fontSizeButtons.forEach(button => {
            (button as HTMLButtonElement).disabled = !enabled;
        });
    }

    async onFileOpen(file: TFile | null) {
        this.currentFile = file;
        if (!file || file.extension !== 'md') {
            this.previewEl.empty();
            this.previewEl.createEl('div', {
                text: '只能预览 markdown 文本文档',
                cls: 'mp-empty-message'
            });
            this.updateControlsState(false);
            return;
        }

        this.updateControlsState(true);
        this.isPreviewLocked = false;
        setIcon(this.lockButton, 'unlock');
        await this.updatePreview();
    }

    private async togglePreviewLock() {
        this.isPreviewLocked = !this.isPreviewLocked;
        const lockIcon = this.isPreviewLocked ? 'lock' : 'unlock';
        const lockStatus = this.isPreviewLocked ? '开启实时预览状态' : '关闭实时预览状态';
        setIcon(this.lockButton, lockIcon);
        this.lockButton.setAttribute('aria-label', lockStatus);
        
        if (!this.isPreviewLocked) {
            await this.updatePreview();
        }
    }

    async onFileModify(file: TFile) {
        if (file === this.currentFile && !this.isPreviewLocked) {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            
            this.updateTimer = setTimeout(() => {
                this.updatePreview();
            }, 500);
        }
    }

    async updatePreview() {
        if (!this.currentFile) return;

        // 保存当前滚动位置和内容高度
        const scrollPosition = this.previewEl.scrollTop;
        const prevHeight = this.previewEl.scrollHeight;
        const isAtBottom = (this.previewEl.scrollHeight - this.previewEl.scrollTop) <= (this.previewEl.clientHeight + 100);

        this.previewEl.empty();
        const content = await this.app.vault.cachedRead(this.currentFile);
        
        await MarkdownRenderer.render(
            this.app,
            content,
            this.previewEl,
            this.currentFile.path,
            this
        );

        // 应用 CSS 主题
        const settings = this.settingsManager.getSettings();
        const themeId = settings.themeId || 'basic';
        const isDarkMode = settings.themeMode === 'dark' ||
            (settings.themeMode === 'auto' && checkIsDarkMode());

        // 创建 ThemeManager 实例并应用主题 CSS
        const themeManager = new ThemeManager({
            defaultTheme: themeId,
            themeMode: settings.themeMode,
            customThemeStyles: settings.customThemeStyles,
            customThemes: settings.customThemes
        });
        const themeCss = themeManager.getThemeCss(themeId, isDarkMode);

        // 移除旧的主题样式元素
        const oldStyleEl = this.previewEl.querySelector('#mp-theme-style');
        if (oldStyleEl) {
            oldStyleEl.remove();
        }

        // 注入新的主题样式
        // 将 #mdb 选择器替换为 .mp-content-section
        const processedCss = themeCss.replace(/#mdb\s/g, '.mp-content-section ');
        const styleEl = document.createElement('style');
        styleEl.id = 'mp-theme-style';
        styleEl.textContent = processedCss;
        this.previewEl.insertBefore(styleEl, this.previewEl.firstChild);

        MPConverter.formatContent(this.previewEl);
        this.templateManager.applyTemplate(this.previewEl);

        // 渲染 Mermaid 图表
        await renderMermaidDiagrams(this.previewEl, isDarkMode, 'preview');

        // 根据滚动位置决定是否自动滚动
        if (isAtBottom) {
            // 如果用户在底部附近，自动滚动到底部
            requestAnimationFrame(() => {
                this.previewEl.scrollTop = this.previewEl.scrollHeight;
            });
        } else {
            // 否则保持原来的滚动位置
            const heightDiff = this.previewEl.scrollHeight - prevHeight;
            this.previewEl.scrollTop = scrollPosition + heightDiff;
        }
    }

    // 添加自定义下拉选择器创建方法
    private createCustomSelect(
        parent: HTMLElement,
        className: string,
        options: { value: string; label: string }[]
    ) {
        const container = parent.createEl('div', { cls: 'custom-select-container' });
        const select = container.createEl('div', { cls: 'custom-select' });
        const selectedText = select.createEl('span', { cls: 'selected-text' });
        const arrow = select.createEl('span', { cls: 'select-arrow', text: '▾' });
        
        const dropdown = container.createEl('div', { cls: 'select-dropdown' });
        
        options.forEach(option => {
            const item = dropdown.createEl('div', {
                cls: 'select-item',
                text: option.label
            });
            
            item.dataset.value = option.value;
            item.addEventListener('click', () => {
                // 移除其他项的选中状态
                dropdown.querySelectorAll('.select-item').forEach(el => 
                    el.classList.remove('selected'));
                // 添加当前项的选中状态
                item.classList.add('selected');
                selectedText.textContent = option.label;
                select.dataset.value = option.value;
                dropdown.classList.remove('show');
                select.dispatchEvent(new CustomEvent('change', {
                    detail: { value: option.value }
                }));
            });
        });
        
        // 设置默认值和选中状态
        if (options.length > 0) {
            selectedText.textContent = options[0].label;
            select.dataset.value = options[0].value;
            dropdown.querySelector('.select-item')?.classList.add('selected');
        }
        
        // 点击显示/隐藏下拉列表
        select.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // 点击其他地方关闭下拉列表
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
        
        return container;
    }

    // 获取模板选项
    private async getTemplateOptions() {

        const templates = this.settingsManager.getVisibleTemplates();
        
        return templates.length > 0
            ? templates.map(t => ({ value: t.id, label: t.name }))
            : [{ value: 'default', label: '默认模板' }];
    }

    // 获取字体选项
    private getFontOptions() {
        return this.settingsManager.getFontOptions();
    }
}
