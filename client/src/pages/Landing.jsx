import { Link } from 'react-router-dom';
import { ArrowUpRight, Zap, Lock, Clock, ChartNoAxesColumn, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="space-y-24 pb-8">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <FinalCTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 grid-backdrop opacity-60 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center pt-12 lg:pt-20">
        <div className="space-y-8">
          <span className="mono-label flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-primary inline-block" />
            001 / REAL-TIME FEEDBACK
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tightest">
            Polling, made <span className="text-primary">Easy.</span>
          </h1>
          <p className="font-mono text-xs tracking-wider text-muted-foreground">
            &gt;&gt;&gt; SHIP A POLL IN UNDER 60 SECONDS
          </p>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Build single-choice polls, share a public link, and watch responses arrive over
            WebSockets — no refresh, no spreadsheets, no friction. From idea to insights in the
            time it takes to brew coffee.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild size="lg">
              <Link to="/register">
                Start polling <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I have an account</Link>
            </Button>
          </div>
        </div>

        <HeroMock />
      </div>
    </section>
  );
}

function HeroMock() {
  // Static, hand-coded "live poll" mock that mirrors the actual product UI.
  const bars = [
    { label: 'Option A', pct: 72, count: 218 },
    { label: 'Option B', pct: 41, count: 124 },
    { label: 'Option C', pct: 23, count: 69 },
    { label: 'Option D', pct: 9, count: 27 },
  ];
  return (
    <div className="relative bg-card border border-border-strong corners">
      <span className="c1" />
      <span className="c2" />
      <div className="flex items-center justify-between border-b border-border-strong/30 px-4 py-2">
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
          004 / LIVE POLL
        </span>
        <span className="font-mono text-[11px] tracking-widest text-primary flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          STREAMING
        </span>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <p className="mono-label">Q1 / SINGLE CHOICE</p>
          <h3 className="font-display text-2xl mt-1">Which feature should we ship next?</h3>
        </div>
        <div className="space-y-3">
          {bars.map((b, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{b.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {b.count} · {b.pct}%
                </span>
              </div>
              <div className="h-2 bg-secondary relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border-soft pt-3 text-xs">
          <span className="mono-label">438 RESPONSES</span>
          <span className="mono-label">↑ +12 IN LAST 30s</span>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { value: '<100ms', label: 'Update latency' },
    { value: '60s', label: 'From signup to first poll' },
    { value: '2', label: 'Response modes' },
    { value: '∞', label: 'Concurrent respondents' },
  ];
  return (
    <section className="border-y border-border-strong/40">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-soft">
        {stats.map((s) => (
          <div key={s.label} className="py-8 px-6">
            <div className="font-display text-5xl tracking-tightest">{s.value}</div>
            <div className="mono-label mt-3">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      n: '01',
      icon: Zap,
      title: 'Real-time analytics',
      body: 'Every response streams to the creator dashboard over Socket.io — bar charts redraw the instant a response lands, with no polling and no page refresh.',
    },
    {
      n: '02',
      icon: Lock,
      title: 'Anonymous or authenticated',
      body: 'Pick the mode that fits the audience. Anonymous polls open the doors wide; authenticated mode locks responses to one-per-user with a unique index.',
    },
    {
      n: '03',
      icon: Clock,
      title: 'Built-in expiry',
      body: 'Set a deadline at creation. After it passes, submissions return 410 Gone server-side and the public page flips to a clean closed state automatically.',
    },
    {
      n: '04',
      icon: ChartNoAxesColumn,
      title: 'Publish final results',
      body: 'When you’re ready, publish the poll. The same share link now renders the final outcome — every question, every option, every count — to anyone who visits.',
    },
  ];
  return (
    <section className="space-y-10">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="mono-label">002 / WHAT YOU GET</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tightest mt-2">
            Everything you need.
            <br />
            <span className="text-muted-foreground">is just a click away.</span>
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          A purposefully small surface area. Single-choice questions, one share link, live counts,
          publish-when-ready. That’s the product.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-px bg-border-strong/40 border border-border-strong/40">
        {items.map((it) => (
          <div key={it.n} className="bg-card p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="mono-label">{it.n}</span>
              <it.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display text-2xl tracking-tight">{it.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Create',
      body: 'Compose your poll with a dynamic form — title, questions, options, expiry, response mode. Validation runs as you type.',
    },
    {
      n: '02',
      title: 'Share',
      body: 'Copy the public link. Respondents see a clean form; required questions enforce on both frontend and backend.',
    },
    {
      n: '03',
      title: 'Analyze',
      body: 'Watch responses stream in. When you’re ready, publish — the same link now serves the final report.',
    },
  ];
  return (
    <section className="space-y-10">
      <div>
        <p className="mono-label">003 / HOW IT WORKS</p>
        <h2 className="font-display text-4xl sm:text-5xl tracking-tightest mt-2">
          Three steps. <span className="text-muted-foreground">No magic.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-border-strong/40 border border-border-strong/40">
        {steps.map((s) => (
          <div key={s.n} className="bg-card p-8 space-y-4">
            <div className="font-display text-6xl text-primary tracking-tightest">{s.n}</div>
            <h3 className="font-display text-2xl">{s.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  const checks = [
    'No credit card · no trial',
    'Live in under a minute',
    'Realtime by default',
  ];
  return (
    <section className="bg-foreground text-background p-8 sm:p-16 relative">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <p className="font-mono text-xs tracking-widest text-background/60">
            005 / READY WHEN YOU ARE
          </p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tightest leading-[1]">
            Run your first poll today.
          </h2>
          <ul className="space-y-2 text-background/80">
            {checks.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row lg:justify-end gap-3">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/register">
              Create free account <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-background/40 text-background hover:bg-background hover:text-foreground"
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
