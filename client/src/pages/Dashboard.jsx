import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, BarChart3 } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function pollStateBadge(poll) {
  if (poll.isPublished) return <Badge variant="success">Published</Badge>;
  if (new Date(poll.expiresAt).getTime() < Date.now()) return <Badge variant="warning">Expired</Badge>;
  return <Badge>Live</Badge>;
}

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/polls')
      .then((r) => setPolls(r.data.polls))
      .catch((e) => toast.error(extractError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your polls</h1>
          <p className="text-sm text-muted-foreground">Create, share, analyze.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/new">
            <Plus className="h-4 w-4" /> New poll
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No polls yet. Create your first one.</p>
            <Button asChild>
              <Link to="/dashboard/new">Create poll</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {polls.map((poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg break-words">{poll.title}</CardTitle>
                  {pollStateBadge(poll)}
                </div>
                <CardDescription className="line-clamp-2">
                  {poll.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Responses</dt>
                  <dd>{poll.responseCount}</dd>
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd className="capitalize">{poll.responseMode}</dd>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd>{new Date(poll.expiresAt).toLocaleString()}</dd>
                </dl>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/dashboard/polls/${poll.id}`}>Manage</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" aria-label="Open public link">
                    <a href={`/p/${poll.shareSlug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
