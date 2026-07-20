import { faqItems } from "./site-data";

export default function FaqSection() {
  return (
    <section className="section faq-section" id="faq">
      <div className="section-heading">
        <p className="eyebrow">FAQ</p>
        <h2>Frequently asked questions</h2>
      </div>

      <div className="faq-list">
        {faqItems.map((item, index) => (
          <details className="faq-item" key={item.question} open={index === 0}>
            <summary>
              <span className="faq-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="faq-question">{item.question}</span>
              <span className="faq-chevron" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
