"use client";

import { useMessages } from "./locale-context";

export default function DisclaimerSection() {
  const t = useMessages();
  return (
    <section className="section disclaimer-section" id="disclaimer">
      <div className="section-heading">
        <p className="eyebrow">{t.legal.eyebrow}</p>
        <h2>{t.legal.heading}</h2>
        <p>{t.legal.lead}</p>
      </div>

      <div className="disclaimer-grid">
        {t.legal.items.map((item, index) => (
          <article className="disclaimer-card" key={item.title}>
            <div className="disclaimer-meta">
              <span className="disclaimer-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
            </div>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="disclaimer-footnote">
        <strong>{t.legal.summary}</strong>
        <p>{t.legal.summaryBody}</p>
      </div>
    </section>
  );
}
