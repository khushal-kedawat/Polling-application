import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#1A4DFF', '#0A0F2C', '#5B7CFA', '#9CA3AF', '#3B5BDB', '#6B7280', '#1E40AF', '#4B5563'];

export function AnalyticsDashboard({ analytics, live }) {
  if (!analytics) return <p className="text-sm text-muted-foreground">No data yet.</p>;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total responses" value={analytics.totalResponses} live={live} />
        <StatCard label="Questions" value={analytics.questions.length} />
        <StatCard
          label="Status"
          value={
            analytics.isPublished ? 'Published' : analytics.expired ? 'Expired' : 'Live'
          }
        />
      </div>

      <div className="space-y-4">
        {analytics.questions.map((q, qi) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {qi + 1}. {q.text}
                  </CardTitle>
                  <CardDescription>
                    {q.options.reduce((s, o) => s + o.count, 0)} answered ·{' '}
                    {q.skipCount > 0 ? `${q.skipCount} skipped` : 'no skips'}
                  </CardDescription>
                </div>
                {q.isRequired && <Badge variant="secondary">Required</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={q.options.map((o) => ({ name: o.text, count: o.count, pct: o.pct }))}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, _name, item) => [`${value} (${item.payload.pct}%)`, 'Responses']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {q.options.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, live }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {live && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> live
            </span>
          )}
        </div>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
