import { disclaimerItems } from "./site-data";

export default function DisclaimerSection() {
  return (
    <section className="section disclaimer-section" id="disclaimer">
      <div className="section-heading">
        <p className="eyebrow">Legal</p>
        <h2>Disclaimer</h2>
        <p>
          By downloading, installing, configuring, or using tcptun or this website, you acknowledge
          and accept the following terms.
        </p>
      </div>

      <div className="disclaimer-grid">
        {disclaimerItems.map((item, index) => (
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
        <strong>Important</strong>
        <p>
          If you do not agree with this disclaimer, do not use tcptun or the tools on this site.
          Continued use constitutes acceptance of these conditions.
        </p>
      </div>
    </section>
  );
}
