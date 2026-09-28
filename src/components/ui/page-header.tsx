import Link from "next/link";
import { ui } from "@/config/content";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
  closeHref?: string;
};
export function PageHeader({
  eyebrow,
  title,
  intro,
  className = "",
  closeHref,
}: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`}>
      {closeHref && <Link className="close-link" href={closeHref} aria-label={ui.navigation.close}>
        <span aria-hidden="true">×</span>
      </Link>}
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {intro && <p className="lead">{intro}</p>}
    </header>
  );
}
