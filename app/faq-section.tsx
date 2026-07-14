import { faqItems } from "./site-data";

export default function FaqSection() {
  return (
    <section className="section faq-section" id="faq">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">常见问题</p>
          <h2>部署与配置时最常问的几件事。</h2>
          <p>内容与当前站点版本说明一致，便于快速核对能力边界与安装方式。</p>
        </div>
        <div className="chip-row">
          <span>config</span>
          <span>install</span>
          <span>interop</span>
        </div>
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
