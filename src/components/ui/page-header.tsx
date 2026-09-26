type PageHeaderProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
};
export function PageHeader({
  eyebrow,
  title,
  intro,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`page-header ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {intro && <p className="lead">{intro}</p>}
    </header>
  );
}
