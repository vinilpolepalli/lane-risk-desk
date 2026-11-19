import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lane Risk Desk: disruption to reroute decision',
  description: 'Independent demo: cited disruption events turned into reroute decisions by a deterministic model. Not live status; not affiliated with Ekho Labs.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen font-sans antialiased">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
          <Link href="/" className="text-base font-semibold text-ink">Lane Risk Desk <span className="font-normal text-mute">independent demo</span></Link>
          <nav className="flex gap-5 text-sm"><Link className="text-ink hover:text-accent" href="/">Decision desk</Link><Link className="text-ink hover:text-accent" href="/briefs">Disruption briefs</Link></nav>
        </header>
        {children}
        <footer className="mt-12 border-t border-line py-5 text-xs leading-relaxed text-mute">
          Demo built by Vinil Polepalli - sources cited per disruption. Independent demo; not affiliated with or endorsed by Ekho Labs. Estimates are labeled; not logistics advice.
        </footer>
      </div>
    </body></html>
  );
}
