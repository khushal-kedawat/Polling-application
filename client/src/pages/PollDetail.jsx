import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareLinkCard } from '@/components/ShareLinkCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { usePollSocket } from '@/hooks/usePollSocket';

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const { analytics: liveAnalytics, connected } = usePollSocket(id, { asCreator: true });

  useEffect(() => {
    if (liveAnalytics) setAnalytics(liveAnalytics);
  }, [liveAnalytics]);

  const loadAll = useCallback(async () => {
    try {
      const [pollRes, analyticsRes] = await Promise.all([
        api.get(`/polls/${id}`),
        api.get(`/polls/${id}/analytics`),
      ]);
      setPoll(pollRes.data.poll);
      setAnalytics(analyticsRes.data.analytics);
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handlePublish = async () => {
    if (!confirm('Publish results? This makes them visible on the public link and closes responses.'))
      return;
    setPublishing(true);
    try {
      await api.post(`/polls/${id}/publish`);
      toast.success('Results published');
      loadAll();
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this poll and all responses? This cannot be undone.')) return;
    try {
      await api.delete(`/polls/${id}`);
      toast.success('Poll deleted');
      navigate('/dashboard');
    } catch (e) {
      toast.error(extractError(e));
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!poll) return <p>Poll not found.</p>;

  const expired = new Date(poll.expiresAt).getTime() < Date.now();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              {poll.description && <CardDescription>{poll.description}</CardDescription>}
            </div>
            <div className="flex flex-col items-end gap-1">
              {poll.isPublished ? (
                <Badge variant="success">Published</Badge>
              ) : expired ? (
                <Badge variant="warning">Expired</Badge>
              ) : (
                <Badge>Live</Badge>
              )}
              <span className="text-xs text-muted-foreground capitalize">{poll.responseMode}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Time remaining</p>
              <CountdownTimer target={poll.expiresAt} onExpire={loadAll} />
            </div>
            <div>
              <p className="text-muted-foreground">Expires at</p>
              <p>{new Date(poll.expiresAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Connection</p>
              <p>{connected ? 'Live (Socket.io)' : 'Connecting…'}</p>
            </div>
          </div>
          <ShareLinkCard slug={poll.shareSlug} />
          <div className="flex flex-wrap gap-2">
            {!poll.isPublished && (
              <Button onClick={handlePublish} disabled={publishing}>
                <CheckCircle2 className="h-4 w-4" />
                {publishing ? 'Publishing…' : 'Publish results'}
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3">Analytics</h2>
        <AnalyticsDashboard analytics={analytics} live={connected && !poll.isPublished} />
      </section>
    </div>
  );
}
