import { App, PluginSettingTab, Setting, setIcon, Notice, Modal } from 'obsidian';
import MPPlugin from '../main';
import { CreateTemplateModal } from './CreateTemplateModal';
import { CreateFontModal } from './CreateFontModal';
import { CreateBackgroundModal } from './CreateBackgroundModal';
import { ConfirmModal } from './ConfirmModal';
import { TemplatePreviewModal }  from './templatePreviewModal';
import { WechatThemeStyle, THEME_STYLE_NAMES } from '../types/wechat-theme';
import { THEME_NAMES, ThemeManager } from '../core/themeManager';
export class MPSettingTab extends PluginSettingTab {
    plugin: MPPlugin; // 修改插件类型以匹配类名
    private expandedSections: Set<string> = new Set();

    constructor(app: App, plugin: MPPlugin) { // 修改插件类型以匹配类名
        super(app, plugin);
        this.plugin = plugin;
    }

    private createSection(containerEl: HTMLElement, title: string, renderContent: (contentEl: HTMLElement) => void) {
        const section = containerEl.createDiv('settings-section');
        const header = section.createDiv('settings-section-header');

        const toggle = header.createSpan('settings-section-toggle');
        setIcon(toggle, 'chevron-right');

        header.createEl('h4', { text: title });

        const content = section.createDiv('settings-section-content');
        renderContent(content);

        header.addEventListener('click', () => {
            const isExpanded = !section.hasClass('is-expanded');
            section.toggleClass('is-expanded', isExpanded);
            setIcon(toggle, isExpanded ? 'chevron-down' : 'chevron-right');
            if (isExpanded) {
                this.expandedSections.add(title);
            } else {
                this.expandedSections.delete(title);
            }
        });

        if (this.expandedSections.has(title) || (!containerEl.querySelector('.settings-section'))) {
            section.addClass('is-expanded');
            setIcon(toggle, 'chevron-down');
            this.expandedSections.add(title);
        }

        return section;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('mp-settings');

        containerEl.createEl('h2', { text: 'MP Preview' });

        this.createSection(containerEl, '基本选项', el => this.renderBasicSettings(el));
        this.createSection(containerEl, '模板选项', el => this.renderTemplateSettings(el));
        this.createSection(containerEl, '背景选项', el => this.renderBackgroundSettings(el));
        this.createSection(containerEl, 'CSS 主题', el => this.renderCssThemeSettings(el));
        this.createSection(containerEl, '微信公众号', el => this.renderWechatSettings(el));
    }

    private renderBasicSettings(containerEl: HTMLElement): void {
        // 字体管理区域
        const fontSection = containerEl.createDiv('mp-settings-subsection');
        const fontHeader = fontSection.createDiv('mp-settings-subsection-header');
        const fontToggle = fontHeader.createSpan('mp-settings-subsection-toggle');
        setIcon(fontToggle, 'chevron-right');

        fontHeader.createEl('h3', { text: '字体管理' });

        const fontContent = fontSection.createDiv('mp-settings-subsection-content');

        // 折叠/展开逻辑
        fontHeader.addEventListener('click', () => {
            const isExpanded = !fontSection.hasClass('is-expanded');
            fontSection.toggleClass('is-expanded', isExpanded);
            setIcon(fontToggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        // 字体列表
        const fontList = fontContent.createDiv('font-management');
        this.plugin.settingsManager.getFontOptions().forEach(font => {
            const fontItem = fontList.createDiv('font-item');
            const setting = new Setting(fontItem)
                .setName(font.label)
                .setDesc(font.value);

            // 只为非预设字体添加编辑和删除按钮
            if (!font.isPreset) {
                setting
                    .addExtraButton(btn =>
                        btn.setIcon('pencil')
                            .setTooltip('编辑')
                            .onClick(() => {
                                new CreateFontModal(
                                    this.app,
                                    async (updatedFont) => {
                                        await this.plugin.settingsManager.updateFont(font.value, updatedFont);
                                        this.display();
                                        new Notice('请重启 Obsidian 或重新加载以使更改生效');
                                    },
                                    font
                                ).open();
                            }))
                    .addExtraButton(btn =>
                        btn.setIcon('trash')
                            .setTooltip('删除')
                            .onClick(() => {
                                // 新增确认模态框
                                new ConfirmModal(
                                    this.app,
                                    '确认删除字体',
                                    `确定要删除「${font.label}」字体配置吗？`,
                                    async () => {
                                        await this.plugin.settingsManager.removeFont(font.value);
                                        this.display();
                                        new Notice('请重启 Obsidian 或重新加载以使更改生效');
                                    }
                                ).open();
                            }));
            }
        });

        // 添加新字体按钮
        new Setting(fontContent)
            .addButton(btn => btn
                .setButtonText('+ 添加字体')
                .setCta()
                .onClick(() => {
                    new CreateFontModal(
                        this.app,
                        async (newFont) => {
                            await this.plugin.settingsManager.addCustomFont(newFont);
                            this.display();
                            new Notice('请重启 Obsidian 或重新加载以使更改生效');
                        }
                    ).open();
                }));
    }

    private renderTemplateSettings(containerEl: HTMLElement): void {
        // 模板显示设置部分 - 从基本设置移动到这里
        const templateVisibilitySection = containerEl.createDiv('mp-settings-subsection');
        const templateVisibilityHeader = templateVisibilitySection.createDiv('mp-settings-subsection-header');

        const templateVisibilityToggle = templateVisibilityHeader.createSpan('mp-settings-subsection-toggle');
        setIcon(templateVisibilityToggle, 'chevron-right');

        templateVisibilityHeader.createEl('h3', { text: '模板显示选项' });

        const templateVisibilityContent = templateVisibilitySection.createDiv('mp-settings-subsection-content');

        // 折叠/展开逻辑
        templateVisibilityHeader.addEventListener('click', () => {
            const isExpanded = !templateVisibilitySection.hasClass('is-expanded');
            templateVisibilitySection.toggleClass('is-expanded', isExpanded);
            setIcon(templateVisibilityToggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        // 模板选择容器
        const templateSelectionContainer = templateVisibilityContent.createDiv('template-selection-container');

        // 左侧：所有模板列表
        const allTemplatesContainer = templateSelectionContainer.createDiv('all-templates-container');
        allTemplatesContainer.createEl('h4', { text: '隐藏模板' });
        const allTemplatesList = allTemplatesContainer.createDiv('templates-list');

        // 中间：控制按钮
        const controlButtonsContainer = templateSelectionContainer.createDiv('control-buttons-container');
        const addButton = controlButtonsContainer.createEl('button', { text: '>' });
        const removeButton = controlButtonsContainer.createEl('button', { text: '<' });

        // 右侧：显示的模板列表
        const visibleTemplatesContainer = templateSelectionContainer.createDiv('visible-templates-container');
        visibleTemplatesContainer.createEl('h4', { text: '显示模板' });
        const visibleTemplatesList = visibleTemplatesContainer.createDiv('templates-list');

        // 获取所有模板
        const allTemplates = this.plugin.settingsManager.getAllTemplates();

        // 渲染模板列表
        const renderTemplateLists = () => {
            // 清空列表
            allTemplatesList.empty();
            visibleTemplatesList.empty();

            // 填充左侧列表（所有未显示的模板）
            allTemplates
                .filter(template => template.isVisible === false)
                .forEach(template => {
                    const templateItem = allTemplatesList.createDiv('template-list-item');
                    templateItem.textContent = template.name;
                    templateItem.dataset.templateId = template.id;

                    // 点击选中/取消选中
                    templateItem.addEventListener('click', () => {
                        templateItem.toggleClass('selected', !templateItem.hasClass('selected'));
                    });
                });

            // 填充右侧列表（所有显示的模板）
            allTemplates
                .filter(template => template.isVisible !== false) // 默认显示
                .forEach(template => {
                    const templateItem = visibleTemplatesList.createDiv('template-list-item');
                    templateItem.textContent = template.name;
                    templateItem.dataset.templateId = template.id;

                    // 点击选中/取消选中
                    templateItem.addEventListener('click', () => {
                        templateItem.toggleClass('selected', !templateItem.hasClass('selected'));
                    });
                });
        };

        // 初始渲染
        renderTemplateLists();

        // 添加按钮事件
        addButton.addEventListener('click', async () => {
            const selectedItems = Array.from(allTemplatesList.querySelectorAll('.template-list-item.selected'));
            if (selectedItems.length === 0) return;

            for (const item of selectedItems) {
                const templateId = (item as HTMLElement).dataset.templateId;
                if (!templateId) continue;

                const template = allTemplates.find(t => t.id === templateId);
                if (template) {
                    template.isVisible = true;
                    await this.plugin.settingsManager.updateTemplate(templateId, template);
                }
            }

            renderTemplateLists();
            new Notice('请重启 Obsidian 或重新加载以使更改生效');
        });

        // 移除按钮事件
        removeButton.addEventListener('click', async () => {
            const selectedItems = Array.from(visibleTemplatesList.querySelectorAll('.template-list-item.selected'));
            if (selectedItems.length === 0) return;

            for (const item of selectedItems) {
                const templateId = (item as HTMLElement).dataset.templateId;
                if (!templateId) continue;

                const template = allTemplates.find(t => t.id === templateId);
                if (template) {
                    template.isVisible = false;
                    await this.plugin.settingsManager.updateTemplate(templateId, template);
                }
            }

            renderTemplateLists();
            new Notice('请重启 Obsidian 或重新加载以使更改生效');
        });

        // 模板管理区域
        const templateList = containerEl.createDiv('template-management');
        // 渲染自定义模板
        templateList.createEl('h4', { text: '自定义模板', cls: 'template-custom-header' });
        this.plugin.settingsManager.getAllTemplates()
            .filter(template => !template.isPreset)
            .forEach(template => {
                const templateItem = templateList.createDiv('template-item');
                new Setting(templateItem)
                    .setName(template.name)
                    .setDesc(template.description)
                    .addExtraButton(btn => 
                        btn.setIcon('eye')
                            .setTooltip('预览')
                            .onClick(() => {
                                new TemplatePreviewModal(this.app, template, this.plugin.templateManager).open(); // 修改为使用预览模态框
                            }))
                    .addExtraButton(btn =>
                        btn.setIcon('pencil')
                            .setTooltip('编辑')
                            .onClick(() => {
                                new CreateTemplateModal(
                                    this.app,
                                    this.plugin,
                                    (updatedTemplate) => {
                                        this.plugin.settingsManager.updateTemplate(template.id, updatedTemplate);
                                        this.display();
                                        new Notice('请重启 Obsidian 或重新加载以使更改生效');
                                    },
                                    template
                                ).open();
                            }))
                    .addExtraButton(btn =>
                        btn.setIcon('trash')
                            .setTooltip('删除')
                            .onClick(() => {
                                // 新增确认模态框
                                new ConfirmModal(
                                    this.app,
                                    '确认删除模板',
                                    `确定要删除「${template.name}」模板吗？此操作不可恢复。`,
                                    async () => {
                                        await this.plugin.settingsManager.removeTemplate(template.id);
                                        this.display();
                                        new Notice('请重启 Obsidian 或重新加载以使更改生效');
                                    }
                                ).open();
                            }));
            });

        // 添加新模板按钮
        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('+ 新建模板')
                .setCta()
                .onClick(() => {
                    new CreateTemplateModal(
                        this.app,
                        this.plugin,
                        async (newTemplate) => {
                            await this.plugin.settingsManager.addCustomTemplate(newTemplate);
                            this.display();
                            new Notice('请重启 Obsidian 或重新加载以使更改生效');
                        }
                    ).open();
                }));
    }

    private renderBackgroundSettings(containerEl: HTMLElement): void {
        // 背景显示设置部分
        const backgroundVisibilitySection = containerEl.createDiv('mp-settings-subsection');
        const backgroundVisibilityHeader = backgroundVisibilitySection.createDiv('mp-settings-subsection-header');

        const backgroundVisibilityToggle = backgroundVisibilityHeader.createSpan('mp-settings-subsection-toggle');
        setIcon(backgroundVisibilityToggle, 'chevron-right');

        backgroundVisibilityHeader.createEl('h3', { text: '背景显示' });

        const backgroundVisibilityContent = backgroundVisibilitySection.createDiv('mp-settings-subsection-content');

        // 折叠/展开逻辑
        backgroundVisibilityHeader.addEventListener('click', () => {
            const isExpanded = !backgroundVisibilitySection.hasClass('is-expanded');
            backgroundVisibilitySection.toggleClass('is-expanded', isExpanded);
            setIcon(backgroundVisibilityToggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        // 背景选择容器
        const backgroundSelectionContainer = backgroundVisibilityContent.createDiv('background-selection-container');

        // 左侧：所有背景列表
        const allBackgroundsContainer = backgroundSelectionContainer.createDiv('all-backgrounds-container');
        allBackgroundsContainer.createEl('h4', { text: '隐藏背景' });
        const allBackgroundsList = allBackgroundsContainer.createDiv('backgrounds-list');

        // 中间：控制按钮
        const controlButtonsContainer = backgroundSelectionContainer.createDiv('control-buttons-container');
        const addButton = controlButtonsContainer.createEl('button', { text: '>' });
        const removeButton = controlButtonsContainer.createEl('button', { text: '<' });

        // 右侧：显示的背景列表
        const visibleBackgroundsContainer = backgroundSelectionContainer.createDiv('visible-backgrounds-container');
        visibleBackgroundsContainer.createEl('h4', { text: '显示背景' });
        const visibleBackgroundsList = visibleBackgroundsContainer.createDiv('backgrounds-list');

        // 获取所有背景
        const allBackgrounds = this.plugin.settingsManager.getAllBackgrounds();

        // 渲染背景列表
        const renderBackgroundLists = () => {
            // 清空列表
            allBackgroundsList.empty();
            visibleBackgroundsList.empty();

            // 填充左侧列表（所有未显示的背景）
            allBackgrounds
                .filter(background => background.isVisible === false)
                .forEach(background => {
                    const backgroundItem = allBackgroundsList.createDiv('background-list-item');
                    backgroundItem.textContent = background.name;
                    backgroundItem.dataset.backgroundId = background.id;

                    // 点击选中/取消选中
                    backgroundItem.addEventListener('click', () => {
                        backgroundItem.toggleClass('selected', !backgroundItem.hasClass('selected'));
                    });
                });

            // 填充右侧列表（所有显示的背景）
            allBackgrounds
                .filter(background => background.isVisible !== false) // 默认显示
                .forEach(background => {
                    const backgroundItem = visibleBackgroundsList.createDiv('background-list-item');
                    backgroundItem.textContent = background.name;
                    backgroundItem.dataset.backgroundId = background.id;

                    // 点击选中/取消选中
                    backgroundItem.addEventListener('click', () => {
                        backgroundItem.toggleClass('selected', !backgroundItem.hasClass('selected'));
                    });
                });
        };

        // 初始渲染
        renderBackgroundLists();

        // 添加按钮事件
        addButton.addEventListener('click', async () => {
            const selectedItems = Array.from(allBackgroundsList.querySelectorAll('.background-list-item.selected'));
            if (selectedItems.length === 0) return;

            for (const item of selectedItems) {
                const backgroundId = (item as HTMLElement).dataset.backgroundId;
                if (!backgroundId) continue;

                const background = allBackgrounds.find(b => b.id === backgroundId);
                if (background) {
                    background.isVisible = true;
                    await this.plugin.settingsManager.updateBackground(backgroundId, background);
                }
            }

            renderBackgroundLists();
            new Notice('背景显示设置已更新');
        });

        // 移除按钮事件
        removeButton.addEventListener('click', async () => {
            const selectedItems = Array.from(visibleBackgroundsList.querySelectorAll('.background-list-item.selected'));
            if (selectedItems.length === 0) return;

            for (const item of selectedItems) {
                const backgroundId = (item as HTMLElement).dataset.backgroundId;
                if (!backgroundId) continue;

                const background = allBackgrounds.find(b => b.id === backgroundId);
                if (background) {
                    background.isVisible = false;
                    await this.plugin.settingsManager.updateBackground(backgroundId, background);
                }
            }

            renderBackgroundLists();
            new Notice('背景显示已更新');
        });

        // 背景管理区域
        const backgroundList = containerEl.createDiv('background-management');

        // 渲染自定义背景
        backgroundList.createEl('h4', { text: '自定义背景', cls: 'background-custom-header' });
        this.plugin.settingsManager.getAllBackgrounds()
            .filter(background => !background.isPreset)
            .forEach(background => {
                const backgroundItem = backgroundList.createDiv('background-item');
                new Setting(backgroundItem)
                    .setName(background.name)
                    .addExtraButton(btn =>
                        btn.setIcon('pencil')
                            .setTooltip('编辑')
                            .onClick(() => {
                                // 使用背景编辑模态框
                                new CreateBackgroundModal(
                                    this.app,
                                    async (updatedBackground) => {
                                        await this.plugin.settingsManager.updateBackground(background.id, updatedBackground);
                                        this.display();
                                        new Notice('背景已更新');
                                    },
                                    background
                                ).open();
                            }))
                    .addExtraButton(btn =>
                        btn.setIcon('trash')
                            .setTooltip('删除')
                            .onClick(() => {
                                new ConfirmModal(
                                    this.app,
                                    '确认删除背景',
                                    `确定要删除「${background.name}」背景吗？此操作不可恢复。`,
                                    async () => {
                                        await this.plugin.settingsManager.removeBackground(background.id);
                                        this.display();
                                        new Notice('背景已删除');
                                    }
                                ).open();
                            }));
                
                // 添加背景预览
                const previewEl = backgroundItem.createDiv('background-preview');
                previewEl.setAttribute('style', background.style);
            });

        // 添加新背景按钮
        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('+ 新建背景')
                .setCta()
                .onClick(() => {
                    // 使用新的背景创建模态框
                    new CreateBackgroundModal(
                        this.app,
                        async (newBackground) => {
                            await this.plugin.settingsManager.addCustomBackground(newBackground);
                            this.display();
                            new Notice('背景已创建');
                        }
                    ).open();
                }));
    }

    private renderWechatSettings(containerEl: HTMLElement): void {
        // AppID设置
        new Setting(containerEl)
            .setName('AppID')
            .setDesc('微信公众号的AppID')
            .addText(text => text
                .setPlaceholder('输入AppID')
                .setValue(this.plugin.settingsManager.getSettings().wechatAppId || '')
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        wechatAppId: value
                    });
                }));

        // AppSecret设置
        new Setting(containerEl)
            .setName('AppSecret')
            .setDesc('微信公众号的AppSecret')
            .addText(text => text
                .setPlaceholder('输入AppSecret')
                .setValue(this.plugin.settingsManager.getSettings().wechatAppSecret || '')
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        wechatAppSecret: value
                    });
                }));

        // 图片存储位置设置
        new Setting(containerEl)
            .setName('图片存储位置')
            .setDesc('设置图片保存的文件夹路径。支持使用 ${filename} 代表当前文档的文件名')
            .addText(text => text
                .setPlaceholder('${filename}__assets')
                .setValue(this.plugin.settingsManager.getSettings().imageAttachmentLocation || '')
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        imageAttachmentLocation: value
                    });
                }));

        // 启用微信样式
        new Setting(containerEl)
            .setName('启用微信样式渲染')
            .setDesc('启用后将使用微信公众号优化的样式渲染')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().enableWechatStyle)
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        enableWechatStyle: value
                    });
                    new Notice(`微信样式渲染已${value ? '启用' : '禁用'}`);
                }));

        // 调试模式
        new Setting(containerEl)
            .setName('调试模式')
            .setDesc('启用后将显示详细的调试日志信息')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().debugMode)
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        debugMode: value
                    });
                    this.plugin.logger.setDebugMode(value);
                }));
    }

    private renderCssThemeSettings(containerEl: HTMLElement): void {
        const settings = this.plugin.settingsManager.getSettings();

        // 主题选择
        new Setting(containerEl)
            .setName('选择主题')
            .setDesc('选择用于预览和发布的主题')
            .addDropdown(dropdown => {
                // 预设主题
                const builtInThemes = Object.keys(THEME_NAMES);
                builtInThemes.forEach(themeKey => {
                    dropdown.addOption(themeKey, THEME_NAMES[themeKey] || themeKey);
                });

                // 自定义主题
                if (settings.customThemes && settings.customThemes.length > 0) {
                    dropdown.addOption('', '--- 自定义主题 ---');
                    settings.customThemes.forEach(themeName => {
                        dropdown.addOption(themeName, themeName);
                    });
                }

                dropdown.setValue(settings.themeId || 'basic')
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSettings({
                            themeId: value
                        });
                        new Notice(`主题已切换为: ${THEME_NAMES[value] || value}`);
                    });
            });

        // 明暗模式选择
        new Setting(containerEl)
            .setName('明暗模式')
            .setDesc('选择预览视图的主题模式')
            .addDropdown(dropdown => {
                dropdown.addOption('auto', '跟随系统');
                dropdown.addOption('light', '亮色模式');
                dropdown.addOption('dark', '暗色模式');
                dropdown.setValue(settings.themeMode || 'auto')
                    .onChange(async (value) => {
                        await this.plugin.settingsManager.updateSettings({
                            themeMode: value as 'auto' | 'light' | 'dark'
                        });
                        new Notice(`明暗模式已切换为: ${value === 'auto' ? '跟随系统' : value === 'light' ? '亮色' : '暗色'}`);
                    });
            });

        // 主题管理按钮
        new Setting(containerEl)
            .setName('管理自定义主题')
            .setDesc('创建、编辑或删除自定义主题')
            .addButton(btn => {
                btn.setButtonText('管理主题')
                    .onClick(() => {
                        new ThemeManagerModal(this.app, this.plugin).open();
                    });
            });

        // 导出主题按钮
        new Setting(containerEl)
            .setName('导出当前主题')
            .setDesc('将当前选中的主题导出为 CSS 文件')
            .addButton(btn => {
                btn.setButtonText('导出 CSS')
                    .onClick(() => {
                        const themeId = settings.themeId || 'basic';
                        const tm = new ThemeManager({
                            defaultTheme: themeId,
                            customThemeStyles: settings.customThemeStyles,
                            customThemes: settings.customThemes
                        });
                        const css = tm.getThemeCss(themeId);

                        // 创建下载链接
                        const blob = new Blob([css], { type: 'text/css' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${themeId}.css`;
                        a.click();
                        URL.revokeObjectURL(url);

                        new Notice(`主题 ${themeId} 已导出为 CSS 文件`);
                    });
            });
    }
}

// 主题管理器模态框
class ThemeManagerModal extends Modal {
    private plugin: MPPlugin;

    constructor(app: App, plugin: MPPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '主题管理器' });

        const settings = this.plugin.settingsManager.getSettings();
        const customThemes = settings.customThemes || [];
        const customStyles = settings.customThemeStyles || {};

        // 如果没有自定义主题
        if (customThemes.length === 0) {
            contentEl.createEl('p', { text: '暂无自定义主题' });
        } else {
            // 列出所有自定义主题
            const list = contentEl.createDiv('theme-list');
            customThemes.forEach(themeName => {
                const item = list.createDiv('theme-item');
                item.createSpan({ text: themeName, cls: 'theme-name' });

                const actions = item.createDiv('theme-actions');
                actions.createEl('button', {
                    text: '编辑',
                    cls: 'theme-edit-btn'
                }).addEventListener('click', () => {
                    this.editTheme(themeName, customStyles[themeName] || '');
                });

                actions.createEl('button', {
                    text: '删除',
                    cls: 'theme-delete-btn'
                }).addEventListener('click', () => {
                    this.deleteTheme(themeName);
                });
            });
        }

        // 新建主题按钮
        new Setting(contentEl)
            .setName('新建主题')
            .addButton(btn => {
                btn.setButtonText('+ 新建主题')
                    .onClick(() => {
                        this.createNewTheme();
                    });
            });
    }

    private createNewTheme() {
        const name = prompt('请输入主题名称:');
        if (!name) return;

        const defaultCss = `/* 自定义主题: ${name} */
#mdb {
  font-size: 16px;
  color: #000000;
}

#mdb h1 {
  font-size: 24px;
  color: #333;
}
`;

        const settings = this.plugin.settingsManager.getSettings();
        const customThemes = settings.customThemes || [];
        const customStyles = settings.customThemeStyles || {};

        if (!customThemes.includes(name)) {
            customThemes.push(name);
        }
        customStyles[name] = defaultCss;

        this.plugin.settingsManager.updateSettings({
            customThemes,
            customThemeStyles: customStyles
        });

        this.close();
        new ThemeManagerModal(this.app, this.plugin).open();
    }

    private editTheme(name: string, css: string) {
        const textarea = document.createElement('textarea');
        textarea.value = css;
        textarea.rows = 20;
        textarea.style.width = '100%';

        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: `编辑主题: ${name}` });

        contentEl.appendChild(textarea);

        new Setting(contentEl)
            .addButton(btn => {
                btn.setButtonText('保存')
                    .onClick(async () => {
                        const settings = this.plugin.settingsManager.getSettings();
                        const customStyles = { ...settings.customThemeStyles };
                        customStyles[name] = textarea.value;

                        await this.plugin.settingsManager.updateSettings({
                            customThemeStyles: customStyles
                        });

                        new Notice('主题已保存');
                        this.close();
                    });
            })
            .addButton(btn => {
                btn.setButtonText('取消')
                    .onClick(() => {
                        this.close();
                    });
            });
    }

    private deleteTheme(name: string) {
        if (!confirm(`确定要删除主题 "${name}" 吗？`)) return;

        const settings = this.plugin.settingsManager.getSettings();
        const customThemes = settings.customThemes.filter(t => t !== name);
        const customStyles = { ...settings.customThemeStyles };
        delete customStyles[name];

        this.plugin.settingsManager.updateSettings({
            customThemes,
            customThemeStyles: customStyles
        });

        new Notice(`主题 "${name}" 已删除`);
        this.close();
        new ThemeManagerModal(this.app, this.plugin).open();
    }
}