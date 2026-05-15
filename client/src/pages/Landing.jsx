import { Link } from 'react-router-dom';
import { BarChart3, Clock, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: BarChart3,
    title: 'Live analytics',
    body: 'Watch responses pour in with WebSocket-driven charts.',
  },
  { icon: Clock, title: 'Auto-expiry', body: 'Set a deadline and submissions auto-close.' },
  { icon: Lock, title: 'Anonymous or authed', body: 'You decide whether respondents need to log in.' },
  { icon: Users, title: 'Public results', body: 'Publish a single link for everyone to see outcomes.' },
];

export default function Landing() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 pt-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Polls. <span className="text-primary">Live.</span> Simple.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Build single-choice polls, share a link, and watch results come in real-time.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link to="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">I have an account</Link>
          </Button>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6 space-y-2">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
