export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="font-serif text-xl font-semibold leading-snug text-[var(--fg)]">Credit Risk Engine</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Hi, I&apos;m Krish. This is a demo of what I&apos;ve been working on during the school year. Let&apos;s see if you can get a loan; I use a real pipeline (XGBoost + SHAP). You can change the sliders, name it,
          and see what my model fixates on.
        </p>
      </div>
    </header>
  )
}
