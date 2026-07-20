import { disclaimerHighlights, disclaimerItems } from "./site-data";

export default function DisclaimerSection() {
  return (
    <section className="section disclaimer-section" id="disclaimer">
      <div className="section-heading">
        <p className="eyebrow">Legal</p>
        <h2>Disclaimer</h2>
        <p>
          Please read carefully. The following three points are mandatory and apply to every use of
          tcptun and this website.
        </p>
      </div>

      <div className="disclaimer-emphasis" role="note" aria-label="Core disclaimer terms">
        <p className="disclaimer-emphasis-lead">
          <strong>Emphasized terms.</strong> Lawful use is required. All consequences are yours.
          The author provides no warranty or promise.
        </p>
        <ol className="disclaimer-highlights">
          {disclaimerHighlights.map((item, index) => (
            <li key={item.key} className="disclaimer-highlight" data-key={item.key}>
              <span className="disclaimer-highlight-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.statement}</p>
              </div>
            </li>
          ))}
        </ol>
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
        <strong>Summary</strong>
        <p>
          <strong>Lawful use only.</strong> You must use this software legally.{" "}
          <strong>Consequences are yours.</strong> You alone bear all outcomes of use.{" "}
          <strong>No warranty or promise.</strong> The author does not guarantee or promise anything
          about this software or this website. If you do not accept these terms, do not use tcptun.
        </p>
      </div>
    </section>
  );
}
