import MarkdownIt from "markdown-it";
import markdownItDeflist from "markdown-it-deflist";
import markdownItTaskLists from "markdown-it-task-lists";
import highlightjs from "./utils/langHighlight";

/**
 * 创建 Markdown 解析器
 * 精简版 - 只保留核心功能
 */
export const createMarkdownParser = () => {
  const markdownParser: MarkdownIt = new MarkdownIt({
    html: true,
    highlight: (str: string, lang: string): string => {
      const language = (lang || "").trim().toLowerCase();

      // Mermaid diagrams: output pre.mermaid for frontend rendering
      if (language === "mermaid") {
        const escaped = markdownParser.utils.escapeHtml(str);
        return `<pre class="mermaid">\n${escaped}\n</pre>\n`;
      }

      if (language === undefined || language === "") {
        lang = "bash";
      }

      if (lang && highlightjs.getLanguage(lang)) {
        try {
          const formatted = highlightjs.highlight(str, {
            language: lang,
            ignoreIllegals: true,
          }).value;
          return (
            '<pre class="custom"><code class="hljs">' +
            formatted +
            "</code></pre>"
          );
        } catch {
          // Ignore highlight errors
        }
      }
      return (
        '<pre class="custom"><code class="hljs">' +
        markdownParser.utils.escapeHtml(str) +
        "</code></pre>"
      );
    },
  });

  // 添加基本插件
  markdownParser
    .use(markdownItDeflist)
    .use(markdownItTaskLists, {
      enabled: true,
      label: true,
      labelAfter: true,
    });

  // 自定义图片渲染：支持尺寸语法
  const defaultImageRender =
    markdownParser.renderer.rules.image ||
    function (tokens: any, idx: number, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  markdownParser.renderer.rules.image = function (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any
  ) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex("src");
    let src = token.attrs![srcIndex][1];

    // 匹配 URL 中的 mdb-size 参数
    const sizeMatch = src.match(/[?&]mdb-size=([^&]+)/);
    if (sizeMatch) {
      const size = decodeURIComponent(sizeMatch[1]);
      src = src.replace(sizeMatch[0], "");
      src = src.replace(/[?&]$/, "");
      token.attrs![srcIndex][1] = src;

      const cleanSize = size.startsWith("=") ? size.substring(1) : size;

      if (cleanSize.includes("x")) {
        const [width, height] = cleanSize.split("x");
        if (width) token.attrPush(["width", width]);
        if (height) token.attrPush(["height", height]);
      } else {
        token.attrPush(["width", cleanSize]);
      }
    }

    // 支持 Obsidian 风格的图片尺寸语法：![alt|100](url)
    const altIndex = token.attrIndex("alt");
    let altText = "";

    if (altIndex >= 0 && token.attrs && token.attrs[altIndex]) {
      altText = token.attrs[altIndex][1] || "";
    }
    if (!altText && token.content) {
      altText = token.content;
    }

    if (altText) {
      const match = altText.match(/\|(\d+)(?:x(\d+))?$/);
      if (match) {
        const width = match[1];
        const height = match[2];

        if (width && token.attrIndex("width") === -1) {
          token.attrPush(["width", width]);
        }
        if (height && token.attrIndex("height") === -1) {
          token.attrPush(["height", height]);
        }

        const styleIndex = token.attrIndex("style");
        let styleValue = "";
        if (width) {
          styleValue += `width: ${width}px !important; max-width: none !important;`;
        }
        if (height) {
          styleValue += ` height: ${height}px !important; max-height: none !important;`;
        }

        if (styleValue) {
          if (styleIndex >= 0) {
            token.attrs![styleIndex][1] += "; " + styleValue;
          } else {
            token.attrPush(["style", styleValue]);
          }
        }

        const cleanAlt = altText.substring(0, match.index);
        token.content = cleanAlt;

        if (altIndex >= 0 && token.attrs) {
          token.attrs[altIndex][1] = cleanAlt;
        }
      }
    }

    return defaultImageRender(tokens, idx, options, env, self);
  };

  // 自定义链接渲染
  const defaultLinkOpenRender =
    markdownParser.renderer.rules.link_open ||
    function (tokens: any, idx: number, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  markdownParser.renderer.rules.link_open = function (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any
  ) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex("href");

    if (hrefIndex >= 0) {
      const href = token.attrs![hrefIndex][1];

      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        token.attrPush(["target", "_blank"]);
        token.attrPush(["rel", "noopener noreferrer"]);
      }
    }

    return defaultLinkOpenRender(tokens, idx, options, env, self);
  };

  return markdownParser;
};
