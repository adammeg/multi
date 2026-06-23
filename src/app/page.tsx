import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Share2, Sparkles, Calendar, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
              MP
            </div>
            <span className="truncate font-semibold text-slate-900">MultiPoster TN</span>
          </div>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="hidden text-sm text-slate-600 hover:text-slate-900 sm:inline"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="sm:h-10 sm:px-4">
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-20 lg:py-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs text-violet-700 sm:mb-6 sm:px-4 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            Built for Tunisian creators
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Post once,
            <br />
            <span className="text-violet-600">publish everywhere</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:mt-6 sm:text-lg">
            Upload a short-form video and publish simultaneously to TikTok, Instagram Reels,
            Facebook Reels, and YouTube Shorts. AI-powered captions, scheduling, and analytics included.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything you need to grow
            </h2>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
              {[
                { icon: Share2, title: "Multi-Platform", desc: "Publish to 4 platforms at once" },
                { icon: Sparkles, title: "AI Optimization", desc: "Captions, hashtags, viral score" },
                { icon: Calendar, title: "Scheduling", desc: "Schedule up to 30 days ahead" },
                { icon: BarChart3, title: "Analytics", desc: "Track views and engagement" },
              ].map((feature) => (
                <div key={feature.title} className="rounded-xl border border-slate-200 p-5 sm:p-6">
                  <feature.icon className="h-7 w-7 text-violet-600 sm:h-8 sm:w-8" />
                  <h3 className="mt-3 font-semibold text-slate-900 sm:mt-4">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Simple pricing</h2>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3">
              {[
                { plan: "FREE", price: "0 TND", features: ["10 posts/month", "1 connected account"] },
                { plan: "PRO", price: "49 TND/mo", features: ["Unlimited posts", "AI features", "Scheduling"] },
                { plan: "AGENCY", price: "199 TND/mo", features: ["Multi-client", "Team members", "White-label"] },
              ].map((tier) => (
                <div
                  key={tier.plan}
                  className={`rounded-xl border p-6 sm:p-8 ${
                    tier.plan === "PRO"
                      ? "border-violet-600 ring-2 ring-violet-600 sm:col-span-2 lg:col-span-1"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <h3 className="font-bold text-slate-900">{tier.plan}</h3>
                  <p className="mt-2 text-2xl font-bold text-violet-600 sm:text-3xl">{tier.price}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 sm:mt-6">
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

      <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500 sm:py-8">
        © {new Date().getFullYear()} MultiPoster TN. Made for Tunisian creators.
      </footer>
    </div>
  );
}
