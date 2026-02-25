// 预设主题导入
import {
  basicTheme,
  customDefaultTheme,
  codeGithubTheme,
  academicPaperTheme,
  auroraGlassTheme,
  bauhausTheme,
  cyberpunkNeonTheme,
  knowledgeBaseTheme,
  luxuryGoldTheme,
  morandiForestTheme,
  neoBrutalismTheme,
  receiptTheme,
  sunsetFilmTheme,
  templateTheme
} from './themes';

export interface ThemeManagerOptions {
  defaultTheme?: string;
  themeMode?: 'auto' | 'light' | 'dark';
  customThemeStyles?: Record<string, string>;
  customThemes?: string[];
}

// 预设主题映射
const allThemes: Record<string, string> = {
  basic: basicTheme + '\n' + customDefaultTheme + '\n' + codeGithubTheme,
  codeGithub: basicTheme + '\n' + codeGithubTheme,
  academicPaper: basicTheme + '\n' + academicPaperTheme + '\n' + codeGithubTheme,
  auroraGlass: basicTheme + '\n' + auroraGlassTheme + '\n' + codeGithubTheme,
  bauhaus: basicTheme + '\n' + bauhausTheme + '\n' + codeGithubTheme,
  cyberpunkNeon: basicTheme + '\n' + cyberpunkNeonTheme + '\n' + codeGithubTheme,
  knowledgeBase: basicTheme + '\n' + knowledgeBaseTheme + '\n' + codeGithubTheme,
  luxuryGold: basicTheme + '\n' + luxuryGoldTheme + '\n' + codeGithubTheme,
  morandiForest: basicTheme + '\n' + morandiForestTheme + '\n' + codeGithubTheme,
  neoBrutalism: basicTheme + '\n' + neoBrutalismTheme + '\n' + codeGithubTheme,
  receipt: basicTheme + '\n' + receiptTheme + '\n' + codeGithubTheme,
  sunsetFilm: basicTheme + '\n' + sunsetFilmTheme + '\n' + codeGithubTheme,
  template: basicTheme + '\n' + templateTheme + '\n' + codeGithubTheme
};

// 主题显示名称
export const THEME_NAMES: Record<string, string> = {
  basic: '基础风格',
  codeGithub: 'GitHub 代码',
  academicPaper: '学术论文',
  auroraGlass: '极光玻璃',
  bauhaus: '包豪斯',
  cyberpunkNeon: '赛博朋克霓虹',
  knowledgeBase: '知识库',
  luxuryGold: '轻奢金',
  morandiForest: '莫兰迪森林',
  neoBrutalism: '新野兽主义',
  receipt: '小票样式',
  sunsetFilm: '落日胶片',
  template: '模板'
};

export class ThemeManager {
  private defaultTheme: string;
  private themeMode: 'auto' | 'light' | 'dark';
  private customThemeStyles: Record<string, string>;
  private customThemes: string[];

  constructor(options: ThemeManagerOptions = {}) {
    this.defaultTheme = options.defaultTheme || 'basic';
    this.themeMode = options.themeMode || 'auto';
    this.customThemeStyles = options.customThemeStyles || {};
    this.customThemes = options.customThemes || [];
  }

  /**
   * 获取主题 CSS
   * @param themeId 主题 ID，如果不提供则使用默认主题
   * @param isDark 是否为暗色模式
   */
  getThemeCss(themeId?: string, isDark?: boolean): string {
    const id = themeId || this.defaultTheme;
    let css = this.customThemeStyles[id] || allThemes[id] || allThemes['basic'];

    // 如果是暗色模式且存在暗色变体，可以在这里处理
    // 目前简单处理：直接返回主题 CSS
    if (isDark) {
      // TODO: 实现暗色模式变体
    }

    return css;
  }

  /**
   * 获取所有可用主题列表
   */
  getAvailableThemes(): string[] {
    return [...Object.keys(allThemes), ...this.customThemes];
  }

  /**
   * 获取预设主题列表
   */
  getBuiltInThemes(): string[] {
    return Object.keys(allThemes);
  }

  /**
   * 获取自定义主题列表
   */
  getCustomThemes(): string[] {
    return this.customThemes;
  }

  /**
   * 获取主题显示名称
   */
  getThemeName(themeId: string): string {
    return THEME_NAMES[themeId] || themeId;
  }

  /**
   * 检查是否为预设主题
   */
  isBuiltInTheme(themeId: string): boolean {
    return themeId in allThemes;
  }

  /**
   * 添加自定义主题
   */
  addCustomTheme(name: string, css: string): void {
    if (!this.customThemes.includes(name)) {
      this.customThemes.push(name);
    }
    this.customThemeStyles[name] = css;
  }

  /**
   * 更新自定义主题
   */
  updateCustomTheme(name: string, css: string): void {
    if (this.customThemes.includes(name)) {
      this.customThemeStyles[name] = css;
    }
  }

  /**
   * 删除自定义主题
   */
  removeCustomTheme(name: string): void {
    this.customThemes = this.customThemes.filter(t => t !== name);
    delete this.customThemeStyles[name];
  }

  /**
   * 设置当前主题
   */
  setDefaultTheme(themeId: string): void {
    this.defaultTheme = themeId;
  }

  /**
   * 获取当前主题
   */
  getDefaultTheme(): string {
    return this.defaultTheme;
  }

  /**
   * 设置明暗模式
   */
  setThemeMode(mode: 'auto' | 'light' | 'dark'): void {
    this.themeMode = mode;
  }

  /**
   * 获取明暗模式
   */
  getThemeMode(): 'auto' | 'light' | 'dark' {
    return this.themeMode;
  }

  /**
   * 判断是否为暗色模式
   */
  isDarkMode(): boolean {
    if (this.themeMode === 'dark') return true;
    if (this.themeMode === 'light') return false;
    // auto 模式跟随系统
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('theme-dark');
    }
    return false;
  }

  /**
   * 导出自定义主题为 CSS 文件内容
   */
  exportTheme(themeId: string): string | null {
    if (this.customThemeStyles[themeId]) {
      return this.customThemeStyles[themeId];
    }
    return null;
  }

  /**
   * 导出设置数据（用于保存）
   */
  exportSettings() {
    return {
      defaultTheme: this.defaultTheme,
      themeMode: this.themeMode,
      customThemeStyles: this.customThemeStyles,
      customThemes: this.customThemes
    };
  }

  /**
   * 导入设置数据（用于加载）
   */
  importSettings(settings: {
    defaultTheme?: string;
    themeMode?: 'auto' | 'light' | 'dark';
    customThemeStyles?: Record<string, string>;
    customThemes?: string[];
  }): void {
    if (settings.defaultTheme) this.defaultTheme = settings.defaultTheme;
    if (settings.themeMode) this.themeMode = settings.themeMode;
    if (settings.customThemeStyles) this.customThemeStyles = settings.customThemeStyles;
    if (settings.customThemes) this.customThemes = settings.customThemes;
  }
}
