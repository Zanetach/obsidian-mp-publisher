// Type declarations for markdown-it and plugins

declare module 'markdown-it' {
  class MarkdownIt {
    constructor(...args: any[]);
    use(plugin: any, ...args: any[]): MarkdownIt;
    render(src: string, env?: any): string;
    utils: any;
    renderer: {
      rules: any;
    };
    core: {
      ruler: any;
    };
    block: {
      ruler: any;
    };
    inline: {
      ruler: any;
    };
  }
  export default MarkdownIt;
}

declare module 'markdown-it/lib/token' {
  export default class Token {
    constructor();
    type: string;
    tag: string;
    attrs: [string, string][] | null;
    map: [number, number] | null;
    nesting: number;
    level: number;
    children: Token[] | null;
    content: string;
    markup: string;
    info: string;
    meta: any;
    block: boolean;
    pos: number;
    posMax: number;
    pending: string;
    bMarks: number[];
    eMarks: number[];
    tShift: number[];
    line: number;
    push(token: Token): void;
    attrPush(attrs: [string, string][]): void;
    attrIndex(name: string): number;
    attrSet(name: string, value: string): void;
    attrGet(name: string): string | null;
    getLines(): string[];
  }
}

declare module 'markdown-it/lib/rules_core/state_core' {
  export default class StateCore {
    src: string;
    env: any;
    tokens: any[];
    Token: any;
  }
}

declare module 'markdown-it/lib/rules_block/state_block' {
  export default class StateBlock {
    src: string;
    env: any;
    tokens: any[];
    bMarks: number[];
    eMarks: number[];
    tShift: number[];
    line: number;
    blkIndent: number;
    push(token: any): void;
    getLines(): string[];
  }
}

declare module 'markdown-it/lib/rules_inline/state_inline' {
  export default class StateInline {
    src: string;
    env: any;
    tokens: any[];
    pos: number;
    posMax: number;
    md: any;
    pending: string;
    push(token: any): void;
  }
}

declare module 'markdown-it/lib/renderer' {
  export default class Renderer {
    rules: any;
  }
}

declare module '../i18n' {
  export function t(key: string, ...args: any[]): string;
}

declare module 'markdown-it-task-lists' {
  const plugin: any;
  export default plugin;
}

declare module 'markdown-it-deflist' {
  const plugin: any;
  export default plugin;
}
