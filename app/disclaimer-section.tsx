import { disclaimerItems } from "./site-data";

export default function DisclaimerSection() {
  return (
    <section className="section disclaimer-section" id="disclaimer">
      <div className="section-heading">
        <p className="eyebrow">Legal</p>
        <h2>Disclaimer</h2>
        <p>
          Use this software only under lawful conditions. You assume all consequences of use.
          The author provides no warranty or promise.
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
          By downloading, installing, or using tcptun or this website, you agree to use the software
          lawfully, accept full responsibility for any consequences, and acknowledge that the author
          offers no warranty or promise. If you do not agree, do not use this software.
        </p>
      </div>
    </section>
  );
}
