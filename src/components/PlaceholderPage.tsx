export default function PlaceholderPage({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="glass-strong max-w-2xl rounded-[1.6rem] p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">In arrivo</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-3 text-ink-soft">{text}</p>
    </div>
  );
}
