import { App, PluginSettingTab, Setting, setIcon, Notice, Modal } from 'obsidian';
import MPPlugin from '../main';
import { CreateFontModal } from './CreateFontModal';
import { ConfirmModal } from './ConfirmModal';
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

    private createSubsection(containerEl: HTMLElement, title: string, renderContent: (contentEl: HTMLElement) => void) {
        const section = containerEl.createDiv('mp-settings-subsection');
        const header = section.createDiv('mp-settings-subsection-header');
        const toggle = header.createSpan('mp-settings-subsection-toggle');
        setIcon(toggle, 'chevron-right');

        header.createEl('h3', { text: title });

        const content = section.createDiv('mp-settings-subsection-content');
        renderContent(content);

        header.addEventListener('click', () => {
            const isExpanded = !section.hasClass('is-expanded');
            section.toggleClass('is-expanded', isExpanded);
            setIcon(toggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        section.addClass('is-expanded');
        setIcon(toggle, 'chevron-down');

        return section;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('mp-settings');

        containerEl.createEl('h2', { text: 'MP Preview' });

        this.createSection(containerEl, '基本选项', el => this.renderBasicSettings(el));
        this.createSection(containerEl, 'CSS 主题', el => this.renderCssThemeSettings(el));
        this.createSection(containerEl, '微信公众号', el => this.renderWechatSettings(el));
    }

    private renderBasicSettings(containerEl: HTMLElement): void {
        this.createSubsection(containerEl, '字体管理', fontContent => {
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
        });
    }


    private renderWechatSettings(containerEl: HTMLElement): void {
        this.createSubsection(containerEl, 'AppID', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, 'AppSecret', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, '图片存储位置', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, '启用微信样式渲染', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, '调试模式', contentEl => {
            new Setting(contentEl)
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
        });
    }

    private renderCssThemeSettings(containerEl: HTMLElement): void {
        const settings = this.plugin.settingsManager.getSettings();

        this.createSubsection(containerEl, '选择主题', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, '明暗模式', contentEl => {
            new Setting(contentEl)
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
        });

        this.createSubsection(containerEl, '管理自定义主题', contentEl => {
            new Setting(contentEl)
                .setName('管理自定义主题')
                .setDesc('创建、编辑或删除自定义主题')
                .addButton(btn => {
                    btn.setButtonText('管理主题')
                        .onClick(() => {
                            new ThemeManagerModal(this.app, this.plugin).open();
                        });
                });
        });

        this.createSubsection(containerEl, '导出当前主题', contentEl => {
            new Setting(contentEl)
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
