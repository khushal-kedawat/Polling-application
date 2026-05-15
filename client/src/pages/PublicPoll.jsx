import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, CheckCircle2 } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { usePollSocket } from '@/hooks/usePollSocket';
import { getRespondentToken, hasSubmitted, markSubmitted } from '@/lib/respondentToken';

export default function PublicPoll() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({}); // questionId -> optionId
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/p/${slug}`);
      setPoll(data.poll);
      if (hasSubmitted(slug)) setSubmitted(true);
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const { analytics: liveAnalytics, published } = usePollSocket(poll?.id, { asCreator: false });

  // Live update for published view
  useEffect(() => {
    if (liveAnalytics && poll?.state === 'published') {
      setPoll((p) => (p ? { ...p, analytics: liveAnalytics } : p));
    }
  }, [liveAnalytics, poll?.state]);

  useEffect(() => {
    if (published) load();
  }, [published, load]);

  const setAnswer = (qId, optId) =>
    setAnswers((prev) => ({ ...prev, [qId]: optId }));

  const onSubmit = async () => {
    if (!poll) return;
    const missing = poll.questions.filter((q) => q.isRequired && !answers[q.id]);
    if (missing.length) {
      const errs = {};
      missing.forEach((q) => (errs[q.id] = 'Required'));
      setErrors(errs);
      toast.error('Please answer all required questions');
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.post(`/p/${slug}/responses`, {
        respondentToken: user ? undefined : getRespondentToken(slug),
        answers: poll.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id] ?? null,
        })),
      });
      markSubmitted(slug);
      setSubmitted(true);
      toast.success('Response recorded');
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!poll)
    return (
      <Card>
        <CardContent className="pt-6 text-center">Poll not found.</CardContent>
      </Card>
    );

  if (poll.state === 'published') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-2xl">{poll.title}</CardTitle>
                {poll.description && <CardDescription>{poll.description}</CardDescription>}
              </div>
              <Badge variant="success">Final results</Badge>
            </div>
          </CardHeader>
        </Card>
        <AnalyticsDashboard analytics={poll.analytics} />
      </div>
    );
  }

  if (poll.state === 'expired') {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6 text-center space-y-2">
          <h2 className="text-xl font-semibold">{poll.title}</h2>
          <p className="text-muted-foreground">This poll has closed. Results are not yet public.</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-semibold">Thanks for responding!</h2>
          <p className="text-muted-foreground">
            Your answers have been recorded. The creator will publish results when ready.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (poll.responseMode === 'authenticated' && !user) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">{poll.title}</h2>
          <p className="text-muted-foreground">This poll requires you to sign in to respond.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Button asChild>
              <Link to={`/login?redirect=/p/${slug}`}>Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/register?redirect=/p/${slug}`}>Sign up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {poll.description && <CardDescription>{poll.description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Closes in:</span>
          <CountdownTimer target={poll.expiresAt} onExpire={load} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {poll.questions.map((q, qi) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  {qi + 1}. {q.text}
                  {q.isRequired && <span className="text-destructive ml-1">*</span>}
                </CardTitle>
                {!q.isRequired && <Badge variant="secondary">Optional</Badge>}
              </div>
              {errors[q.id] && <p className="text-sm text-destructive">{errors[q.id]}</p>}
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[q.id] ?? ''}
                onValueChange={(v) => setAnswer(q.id, v)}
              >
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    htmlFor={`${q.id}-${o.id}`}
                    className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent"
                  >
                    <RadioGroupItem id={`${q.id}-${o.id}`} value={o.id} />
                    <span className="flex-1">{o.text}</span>
                  </label>
                ))}
              </RadioGroup>
              {!q.isRequired && answers[q.id] && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setAnswer(q.id, null)}
                >
                  Clear selection
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit response'}
      </Button>
    </div>
  );
}
