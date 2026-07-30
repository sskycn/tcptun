"use client";

import { useMemo, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import {
  MAX_MARKDOWN_RENDER_CHARS,
  clampText,
  plainTextPreview,
  safeMarkdownUrl,
} from "./lan-security";

/**
 * Strict allow-list for peer-rendered Markdown.
 * - No raw HTML pipeline (rehype-raw is never used)
 * - No style/on* attributes
 * - No svg/math/iframe/script/form
 * - className only on code/span for highlight.js prefixes
 * - sanitize runs LAST so highlight cannot reintroduce tags
 */
const markdownSchema: SanitizeOptions = {
  ...defaultSchema,
  // Explicit tag list — do not inherit overly broad defaults for custom elements
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
    // img rendered via custom component with click-to-load; still allow after confirm
    "img",
  ],
  attributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "loading", "decoding", "referrerpolicy", "className"],
    code: [["className", /^language-./], ["className", /^hljs/], ["className", "lan-md-code-inline"], ["className", "lan-md-code-block"]],
    span: [["className", /^hljs/], ["className", /^language-./]],
    pre: [["className", /^hljs/], ["className", "lan-md-pre"]],
    th: ["align"],
    td: ["align"],
    ol: ["start"],
    li: [["className", "task-list-item"]],
    ul: [["className", "contains-task-list"]],
    input: [["type", "checkbox"], "checked", "disabled"],
    div: [["className", "lan-md-table-wrap"], ["className", "lan-md-img-shell"]],
    // Strip id/name/style everywhere — prevent anchor hijack & CSS injection
  },
  protocols: {
    href: ["http", "https", "mailto", "tel"],
    // Images only over https; custom component enforces click-to-load
    src: ["https"],
  },
  // Drop unknown protocols instead of keeping the node with empty href
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
      // Do not set crossOrigin — avoid credentialed requests to foreign hosts
    />
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
        // Prevent tab-nabbing / reverse tabnabbing
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
    // Task-list checkboxes only — never free-form inputs from peers
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
  // Strip potentially dangerous headings IDs by not forwarding props
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
  pre({ children }) {
    return <pre className="lan-md-pre">{children}</pre>;
  },
  code({ className, children }) {
    // Only keep highlight / language classes — drop anything else
    const safeClass = (className || "")
      .split(/\s+/)
      .filter((c) => /^language-[\w-]+$/.test(c) || /^hljs[\w-]*$/.test(c) || c === "hljs")
      .join(" ");
    const isBlock = Boolean(safeClass);
    return (
      <code className={[safeClass, isBlock ? "lan-md-code-block" : "lan-md-code-inline"].filter(Boolean).join(" ")}>
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
 * CommonMark + GFM, syntax highlight, strict sanitize, safe URL policy.
 */
export default function LanMarkdown({ source, className }: LanMarkdownProps) {
  const text = useMemo(() => clampText(source ?? "", MAX_MARKDOWN_RENDER_CHARS), [source]);
  if (!text.trim()) return null;

  return (
    <div className={["lan-md", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        // Never enable rehype-raw — raw HTML from peers must not execute.
        skipHtml
        unwrapDisallowed
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[
          // Highlight first (adds class names only)
          [rehypeHighlight, { detect: false, ignoreMissing: true }],
          // Sanitize last — final authority on DOM shape
          [rehypeSanitize, markdownSchema],
        ]}
        components={components}
        urlTransform={(url) => {
          // react-markdown URL hook — empty string drops the URL
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
