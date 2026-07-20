"use client";

import { useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export default function CopyButton({
  value,
  label = "Copy",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`copy-button ${copied ? "is-copied" : ""} ${className}`.trim()}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
    >
      <span className="copy-button-icon" aria-hidden="true">
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
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
