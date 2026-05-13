const DEFAULT_REPO = 'https://github.com/krish500/Credit-Risk'

export default function SiteFooter() {
  const repo = process.env.NEXT_PUBLIC_REPO_URL?.trim() || DEFAULT_REPO

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] py-6 text-center">
      <p className="text-xs text-[var(--muted)]">Krish Singh</p>
      <a href={repo} className="mt-2 inline-block text-sm text-[var(--accent-soft)] underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]">
        source on github
      </a>
    </footer>
  )
}
