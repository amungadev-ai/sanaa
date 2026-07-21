import Link from 'next/link';
import { ChevronRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'About — Sanaa Through My Lens',
  description: 'About Sanaa Through My Lens — an arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About — Sanaa Through My Lens',
    description: 'An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — Sanaa Through My Lens',
    description: 'An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">About</span>
      </nav>

      <article className="prose prose-lg max-w-none">
        <h1 className="font-serif text-4xl font-bold mb-4">About Sanaa Through My Lens</h1>

        <p className="text-lg text-muted-foreground lead">
          <em>Sanaa</em> means <strong>Art</strong> in Swahili. And that is exactly what we are about — art, seen through a personal, critical, and unapologetically East African lens.
        </p>

        <p>
          Sanaa Through My Lens is an arts &amp; culture opinion blog dedicated to highlighting stories around the art scene in Kenya and the wider East African region. From the pulsating beats of Nairobi&apos;s gengetone clubs to the hushed galleries of contemporary visual art, from the pages of Kenyan novels to the silver screens of East African cinema — we cover it all.
        </p>

        <h2 className="font-serif">What We Cover</h2>

        <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {[
            { title: 'Music', desc: 'Gengetone, benga, Afro-fusion, and the evolving Kenyan sound' },
            { title: 'Film & Video', desc: 'Kenyan cinema, documentary, and the growing video content scene' },
            { title: 'Books & Literature', desc: 'Kenyan literature, poetry, publishing and the storytelling tradition' },
            { title: 'Visual Arts', desc: 'Contemporary and traditional painting, sculpture, photography, digital art' },
            { title: 'Theatre & Performance', desc: 'Stage arts, spoken word, dance and performance art' },
            { title: 'Opinion & Commentary', desc: 'Critical perspectives on arts, culture and creative industry policy' },
          ].map((item) => (
            <div key={item.title} className="p-4 border rounded-lg bg-muted/30">
              <h3 className="font-serif font-bold text-base">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="font-serif">Our Mission</h2>
        <p>
          We believe that East African art deserves thoughtful, critical coverage that goes beyond event listings and PR-driven reviews. Our mission is to provide a platform for genuine cultural commentary — writing that engages with art on its own terms, asks difficult questions, and celebrates the creativity that defines our region.
        </p>

        <h2 className="font-serif">Get In Touch</h2>
        <p>
          Have a story idea? Want to contribute? Just want to say jambo?
        </p>
        <div className="not-prose mt-4">
          <Button asChild variant="outline" className="gap-2">
            <a href="mailto:hello@sanaathrumylens.co.ke">
              <Mail className="h-4 w-4" />
              hello@sanaathrumylens.co.ke
            </a>
          </Button>
        </div>
      </article>
    </div>
  );
}
