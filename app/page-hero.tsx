import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{ href: string; label: string; variant?: "primary" | "secondary" | "ghost" }>;
};

export default function PageHero({ eyebrow, title, description, actions = [] }: PageHeroProps) {
  return (
    <section className="page-hero" id="top">
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
        {actions.length > 0 ? (
          <div className="hero-actions page-hero-actions">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                className={`button ${action.variant ?? "secondary"}`}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
