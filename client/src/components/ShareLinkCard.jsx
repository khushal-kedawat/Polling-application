import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function ShareLinkCard({ slug }) {
  const url = `${window.location.origin}/p/${slug}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <code className="flex-1 text-sm bg-secondary px-3 py-2 rounded-md truncate">{url}</code>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button asChild variant="ghost">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Open
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
