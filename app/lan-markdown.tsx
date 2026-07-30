"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import {
  MAX_MARKDOWN_RENDER_CHARS,
  clampText,
  plainTextPreview,
  safeMarkdownUrl,
} from "./lan-security";

// Register languages used for auto-detect + fenced blocks.
const HLJS_LANGS: Array<[string, typeof javascript]> = [
  ["javascript", javascript],
  ["js", javascript],
  ["typescript", typescript],
  ["ts", typescript],
  ["json", json],
  ["python", python],
  ["py", python],
  ["go", go],
  ["golang", go],
  ["rust", rust],
  ["rs", rust],
  ["java", java],
  ["bash", bash],
  ["sh", shell],
  ["shell", shell],
  ["zsh", bash],
  ["sql", sql],
  ["yaml", yaml],
  ["yml", yaml],
  ["xml", xml],
  ["html", xml],
  ["svg", xml],
  ["css", css],
  ["markdown", markdown],
  ["md", markdown],
];

let hljsReady = false;
function ensureHljs() {
  if (hljsReady) return;
  for (const [name, def] of HLJS_LANGS) {
    try {
      if (!hljs.getLanguage(name)) hljs.registerLanguage(name, def);
    } catch {
      // ignore duplicate registration
    }
  }
  hljsReady = true;
}

/**
 * Strict allow-list for peer-rendered Markdown.
 * - No raw HTML pipeline (rehype-raw is never used)
 * - className only for highlight.js / language hooks
 * - sanitize runs LAST so highlight cannot reintroduce tags
 */
const markdownSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "em",
    "strong",
    "b",
    "i",
    "del",
    "s",
    "strike",
    "blockquote",
    "ul",
    "ol",
    "li",
    "pre",
    "code",
    "a",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "div",
    "input",
    "img",
  ],
  attributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "loading", "decoding", "referrerpolicy", "className"],
    code: [
      ["className", /^language-[\w+-]+$/],
      ["className", /^hljs/],
      ["className", "lan-md-code-inline"],
      ["className", "lan-md-code-block"],
      ["className", "hljs"],
    ],
    span: [
      ["className", /^hljs[\w-]*$/],
      ["className", /^language-[\w+-]+$/],
    ],
    pre: [
      ["className", /^hljs/],
      ["className", /^language-[\w+-]+$/],
      ["className", "lan-md-pre"],
      ["className", "hljs"],
    ],
    th: ["align"],
    td: ["align"],
    ol: ["start"],
    li: [["className", "task-list-item"]],
    ul: [["className", "contains-task-list"]],
    input: [["type", "checkbox"], "checked", "disabled"],
    div: [
      ["className", "lan-md-table-wrap"],
      ["className", "lan-md-img-shell"],
      ["className", "lan-md-code-wrap"],
      ["className", "lan-md-lang-tag"],
    ],
  },
  protocols: {
    href: ["http", "https", "mailto", "tel"],
    src: ["https"],
  },
  clobberPrefix: "user-content-",
  ancestors: {
    ...defaultSchema.ancestors,
    li: ["ul", "ol"],
    input: ["li"],
  },
};

function SafeImage({ src, alt }: { src?: string; alt?: string }) {
  const [revealed, setRevealed] = useState(false);
  const safe = safeMarkdownUrl(src, "src");
  if (!safe) {
    return (
      <span className="lan-md-img-blocked" role="img" aria-label={alt || "blocked image"}>
        [image blocked]
      </span>
    );
  }
  if (!revealed) {
    return (
      <button
        type="button"
        className="lan-md-img-reveal"
        onClick={() => setRevealed(true)}
        title="Remote images are hidden until you allow them"
      >
        Show image{alt ? `: ${alt.slice(0, 40)}` : ""} (https)
      </button>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- peer content; not Next image optimizer
    <img
      src={safe}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="lan-md-img"
    />
  );
}

/* ---------- auto format + language detect ---------- */

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function tryFormatJson(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return null;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

function tryFormatXmlLike(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("<") || !trimmed.includes(">")) return null;
  // Lightweight indent for well-formed-ish markup (not a full XML parser).
  try {
    let formatted = "";
    let indent = 0;
    const parts = trimmed.replace(/>\s*</g, ">\n<").split("\n");
    for (const raw of parts) {
      const line = raw.trim();
      if (!line) continue;
      if (/^<\//.test(line) || /^<!/.test(line) || /^<\?/.test(line)) {
        if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
        formatted += `${"  ".repeat(indent)}${line}\n`;
        continue;
      }
      formatted += `${"  ".repeat(indent)}${line}\n`;
      if (
        /^<[^!?][^>]*[^/]>$/.test(line) &&
        !/^<(br|hr|img|input|meta|link|source|area|base|col|embed|wbr)\b/i.test(line)
      ) {
        indent += 1;
      }
    }
    return formatted.trimEnd();
  } catch {
    return null;
  }
}

/** Heuristic language id when fences omit a language tag. */
export function detectLanguage(sample: string): string {
  ensureHljs();
  const text = sample.trim();
  if (!text) return "";

  if (
    (text.startsWith("{") || text.startsWith("[")) &&
    (() => {
      try {
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    })()
  ) {
    return "json";
  }

  if (/^<!DOCTYPE\s+html|^<html[\s>]|^<[a-zA-Z][\w:-]*(\s|>)/.test(text) && /<\/[a-zA-Z]/.test(text)) {
    return "html";
  }
  if (/^<\?xml|<\/[a-zA-Z][\w:-]*>/.test(text)) return "xml";
  if (/^(---|\w[\w-]*:\s)/m.test(text) && !text.includes("{") && text.includes(":")) return "yaml";
  if (/^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP)\b/im.test(text)) return "sql";
  if (/^(#!\/bin\/(ba)?sh|\$\s+\w+|^\s*(sudo|apt|brew|pnpm|npm|yarn|curl|wget)\b)/m.test(text)) {
    return "bash";
  }
  if (/\bpackage\s+main\b|\bfunc\s+\w+\s*\(/.test(text)) return "go";
  if (/\bfn\s+\w+|let\s+mut\b|println!\s*\(/.test(text)) return "rust";
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|print\s*\(/.test(text) && !/\bfunction\b|\bconst\b/.test(text)) {
    return "python";
  }
  if (/\binterface\s+\w+|\btype\s+\w+\s*=|\b:\s*(string|number|boolean)\b/.test(text)) {
    return "typescript";
  }
  if (/\b(function|const|let|=>|console\.log)\b/.test(text)) return "javascript";
  if (/\b(public|private|class)\s+\w+|System\.out\.println/.test(text)) return "java";

  try {
    const result = hljs.highlightAuto(text, [
      "json",
      "javascript",
      "typescript",
      "python",
      "go",
      "rust",
      "java",
      "bash",
      "shell",
      "sql",
      "yaml",
      "xml",
      "html",
      "css",
      "markdown",
    ]);
    if (result.language && (result.relevance ?? 0) >= 5) {
      return result.language;
    }
  } catch {
    // ignore
  }
  return "";
}

function formatCodeBody(body: string, langHint: string): { body: string; lang: string } {
  const raw = stripBom(body.replace(/\r\n/g, "\n")).replace(/^\n+/, "").replace(/\n+$/, "");
  const hint = (langHint || "").toLowerCase().trim();

  if (hint === "json" || hint === "jsonc" || !hint) {
    const pretty = tryFormatJson(raw);
    if (pretty) return { body: pretty, lang: "json" };
  }

  if (hint === "xml" || hint === "html" || hint === "svg" || !hint) {
    const pretty = tryFormatXmlLike(raw);
    if (pretty && (hint || pretty.includes("\n"))) {
      return { body: pretty, lang: hint || detectLanguage(pretty) || "xml" };
    }
  }

  // Normalize indentation for generic code (tabs → 2 spaces, trim trailing spaces).
  const normalized = raw
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");

  const lang = hint || detectLanguage(normalized);
  return { body: normalized, lang };
}

function looksLikeStandaloneCode(text: string): boolean {
  const t = text.trim();
  if (t.length < 8) return false;
  if (/```/.test(t)) return false;
  // Already multi-paragraph markdown prose
  if (/^#{1,6}\s|^\*\s|^\d+\.\s|^>\s/m.test(t) && t.split("\n").length <= 4) return false;

  if (tryFormatJson(t)) return true;
  if (t.startsWith("<") && t.includes("</")) return true;
  if (t.split("\n").length >= 3 && /[{};=]|function|const |import |package |def |SELECT /.test(t)) {
    return true;
  }
  // Long single line of code-ish content
  if (t.split("\n").length === 1 && /[{};]|=>|function\s*\(|SELECT\s+/i.test(t) && t.length > 40) {
    return true;
  }
  ensureHljs();
  try {
    const result = hljs.highlightAuto(t);
    return Boolean(result.language && (result.relevance ?? 0) >= 8);
  } catch {
    return false;
  }
}

/**
 * Auto-format message source before Markdown render:
 * - pretty-print JSON / light XML in fences
 * - fill missing fence languages via detection
 * - wrap bare code blobs into fenced blocks
 */
export function autoFormatMessage(source: string): string {
  ensureHljs();
  let text = stripBom((source || "").replace(/\r\n/g, "\n"));
  if (!text.trim()) return text;

  // Format each fenced code block.
  text = text.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_full, langRaw: string, body: string) => {
    const langHint = String(langRaw || "")
      .trim()
      .split(/\s+/)[0]
      ?.replace(/^\./, "") || "";
    const { body: formatted, lang } = formatCodeBody(body, langHint);
    const tag = lang || langHint || "";
    return `\`\`\`${tag}\n${formatted}\n\`\`\``;
  });

  // Whole message is code without fences → wrap + format.
  if (!/```/.test(text) && looksLikeStandaloneCode(text)) {
    const { body, lang } = formatCodeBody(text, "");
    return `\`\`\`${lang || ""}\n${body}\n\`\`\``;
  }

  // Soft-wrap bare multi-line indented code regions (4 spaces / tab) not already fenced.
  // Keep simple: only full-message case above to avoid mangling markdown lists.

  return text;
}

/** Flatten React children to plain text for clipboard copy. */
function childrenToPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToPlainText).join("");
  if (typeof node === "object" && node !== null && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return childrenToPlainText(props?.children);
  }
  return "";
}

function extractLangFromNode(node: ReactNode): string {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = extractLangFromNode(child);
      if (found) return found;
    }
    return "";
  }
  if ("props" in node) {
    const className = String((node as { props?: { className?: string } }).props?.className || "");
    const match = className.split(/\s+/).find((c) => c.startsWith("language-"));
    if (match) return match.replace(/^language-/, "");
    return extractLangFromNode((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

function CodeBlockWithCopy({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const lang =
    String(className || "")
      .split(/\s+/)
      .find((c) => c.startsWith("language-"))
      ?.replace(/^language-/, "") || extractLangFromNode(children);

  const plain = childrenToPlainText(children).replace(/\n$/, "");

  async function handleCopy(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!plain) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plain);
      } else {
        const ta = document.createElement("textarea");
        ta.value = plain;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="lan-md-code-wrap">
      <div className="lan-md-code-toolbar">
        <span className="lan-md-lang-tag">{lang || "code"}</span>
        <button
          type="button"
          className={`lan-md-copy-btn ${copied ? "is-copied" : ""}`}
          onClick={(event) => void handleCopy(event)}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy"}
        >
          <span className="lan-md-copy-icon" aria-hidden="true">
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect
                  x="9"
                  y="9"
                  width="11"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M5 15V5a2 2 0 0 1 2-2h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
        </button>
      </div>
      <pre className={["lan-md-pre", className].filter(Boolean).join(" ")}>{children}</pre>
    </div>
  );
}

const components: Components = {
  a({ href, children, title }) {
    const safe = safeMarkdownUrl(href, "href");
    if (!safe) {
      return <span className="lan-md-link-blocked">{children}</span>;
    }
    const external = /^https?:\/\//i.test(safe);
    return (
      <a
        href={safe}
        title={title ? clampText(title, 200) : undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer nofollow ugc" : undefined}
        referrerPolicy="no-referrer"
      >
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    return <SafeImage src={typeof src === "string" ? src : undefined} alt={alt} />;
  },
  input({ type, checked }) {
    if (type !== "checkbox") return null;
    return (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled
        readOnly
        tabIndex={-1}
        className="lan-md-task-checkbox"
        aria-hidden="true"
      />
    );
  },
  table({ children }) {
    return (
      <div className="lan-md-table-wrap">
        <table>{children}</table>
      </div>
    );
  },
  h1({ children }) {
    return <h1>{children}</h1>;
  },
  h2({ children }) {
    return <h2>{children}</h2>;
  },
  h3({ children }) {
    return <h3>{children}</h3>;
  },
  h4({ children }) {
    return <h4>{children}</h4>;
  },
  h5({ children }) {
    return <h5>{children}</h5>;
  },
  h6({ children }) {
    return <h6>{children}</h6>;
  },
  pre({ children, className }) {
    return <CodeBlockWithCopy className={className}>{children}</CodeBlockWithCopy>;
  },
  code({ className, children }) {
    const classes = (className || "")
      .split(/\s+/)
      .filter(
        (c) =>
          /^language-[\w+-]+$/.test(c) ||
          /^hljs[\w-]*$/.test(c) ||
          c === "hljs" ||
          c === "lan-md-code-inline" ||
          c === "lan-md-code-block",
      );
    const isBlock = classes.some((c) => c.startsWith("language-") || c === "hljs" || c.startsWith("hljs"));
    return (
      <code className={[...classes, isBlock ? "lan-md-code-block" : "lan-md-code-inline"].filter(Boolean).join(" ")}>
        {children}
      </code>
    );
  },
};

type LanMarkdownProps = {
  source: string;
  className?: string;
};

/**
 * Full Markdown for untrusted peer chat:
 * auto-format + language detect, CommonMark + GFM, syntax highlight, sanitize.
 */
export default function LanMarkdown({ source, className }: LanMarkdownProps) {
  const text = useMemo(() => {
    ensureHljs();
    const clamped = clampText(source ?? "", MAX_MARKDOWN_RENDER_CHARS);
    return autoFormatMessage(clamped);
  }, [source]);

  if (!text.trim()) return null;

  return (
    <div className={["lan-md", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        skipHtml
        unwrapDisallowed
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[
          // Auto-detect language when fence has no tag; highlight registered langs.
          [rehypeHighlight, { detect: true, ignoreMissing: true, plainText: ["txt", "text", "plain"] }],
          [rehypeSanitize, markdownSchema],
        ]}
        components={components}
        urlTransform={(url) => {
          const asHref = safeMarkdownUrl(url, "href");
          if (asHref) return asHref;
          const asSrc = safeMarkdownUrl(url, "src");
          return asSrc || "";
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export { plainTextPreview as markdownPreview };
