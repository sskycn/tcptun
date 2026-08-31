"use client";

import { useMessages } from "./locale-context";

export default function FaqSection() {
  const t = useMessages();
  return (
    <section className="section faq-section" id="faq">
      <div className="section-heading">
        <p className="eyebrow">{t.faq.heading}</p>
        <h2>{t.faq.sectionTitle}</h2>
      </div>

      <div className="faq-list">
        {t.faq.items.map((item, index) => (
          <details className="faq-item" key={item.q} open={index === 0}>
            <summary>
              <span className="faq-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="faq-question">{item.q}</span>
              <span className="faq-chevron" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
