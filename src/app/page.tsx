import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Share2, Sparkles, Calendar, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
              MP
            </div>
            <span className="font-semibold">MultiPoster TN</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-sm text-violet-700 mb-6">
            <Sparkles className="h-4 w-4" />
            Built for Tunisian creators
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Post once,
            <br />
            <span className="text-violet-600">publish everywhere</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Upload a short-form video and publish simultaneously to TikTok, Instagram Reels,
            Facebook Reels, and YouTube Shorts. AI-powered captions, scheduling, and analytics included.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Everything you need to grow
            </h2>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Share2, title: "Multi-Platform", desc: "Publish to 4 platforms at once" },
                { icon: Sparkles, title: "AI Optimization", desc: "Captions, hashtags, viral score" },
                { icon: Calendar, title: "Scheduling", desc: "Schedule up to 30 days ahead" },
                { icon: BarChart3, title: "Analytics", desc: "Track views and engagement" },
              ].map((feature) => (
                <div key={feature.title} className="rounded-xl border border-slate-200 p-6">
                  <feature.icon className="h-8 w-8 text-violet-600" />
                  <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Simple pricing</h2>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                { plan: "FREE", price: "0 TND", features: ["10 posts/month", "1 connected account"] },
                { plan: "PRO", price: "49 TND/mo", features: ["Unlimited posts", "AI features", "Scheduling"] },
                { plan: "AGENCY", price: "199 TND/mo", features: ["Multi-client", "Team members", "White-label"] },
              ].map((tier) => (
                <div
                  key={tier.plan}
                  className={`rounded-xl border p-8 ${tier.plan === "PRO" ? "border-violet-600 ring-2 ring-violet-600" : "border-slate-200 bg-white"}`}
                >
                  <h3 className="font-bold text-slate-900">{tier.plan}</h3>
                  <p className="mt-2 text-3xl font-bold text-violet-600">{tier.price}</p>
                  <ul className="mt-6 space-y-2 text-sm text-slate-600">
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MultiPoster TN. Made for Tunisian creators.
      </footer>
    </div>
  );
}
