'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<{ days: number }>({ days: 30 });

  // Calculate date range - memoize to prevent infinite loop
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - dateRange.days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [dateRange.days]);

  // Fetch analytics data
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getUsageStats.useQuery(
    { startDate, endDate },
    { enabled: status === 'authenticated' }
  );

  const { data: mostUsed, isLoading: mostUsedLoading } = trpc.analytics.getMostUsedPrompts.useQuery(
    { limit: 10, startDate, endDate },
    { enabled: status === 'authenticated' }
  );

  const { data: timeline, isLoading: timelineLoading } = trpc.analytics.getUsageTimeline.useQuery(
    { days: dateRange.days },
    { enabled: status === 'authenticated' }
  );

  const { data: byLlm, isLoading: byLlmLoading } = trpc.analytics.getUsageByLlm.useQuery(
    { startDate, endDate },
    { enabled: status === 'authenticated' }
  );

  const { data: successRates, isLoading: successRatesLoading } =
    trpc.analytics.getPromptSuccessRates.useQuery(
      { limit: 10, startDate, endDate },
      { enabled: status === 'authenticated' }
    );

  const { data: recentActivity, isLoading: activityLoading } =
    trpc.analytics.getRecentActivity.useQuery({ limit: 20 }, { enabled: status === 'authenticated' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Get max usage for scaling charts
  const maxUsage = Math.max(...(timeline?.map((t) => t.count) ?? [0]), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange.days === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange({ days: 7 })}
              className="text-white border-white/20 hover:bg-white/10"
            >
              7 Days
            </Button>
            <Button
              variant={dateRange.days === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange({ days: 30 })}
              className="text-white border-white/20 hover:bg-white/10"
            >
              30 Days
            </Button>
            <Button
              variant={dateRange.days === 90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange({ days: 90 })}
              className="text-white border-white/20 hover:bg-white/10"
            >
              90 Days
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto p-4 md:p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/10" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.totalPrompts ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/10" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.totalUsage ?? 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/10" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-white">{stats?.successRate ?? 0}%</div>
                  {(stats?.successRate ?? 0) >= 75 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 bg-white/10" />
              ) : (
                <div className="text-3xl font-bold text-white">{stats?.favoritePrompts ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Timeline Chart */}
        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Usage Over Time
            </CardTitle>
            <CardDescription className="text-purple-200/70">
              Daily prompt usage for the last {dateRange.days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <Skeleton className="h-48 w-full bg-white/10" />
            ) : (
              <div className="h-48 flex items-end gap-1">
                {timeline?.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-sm hover:from-purple-400 hover:to-purple-200 transition-colors cursor-pointer"
                      style={{
                        height: `${(day.count / maxUsage) * 100}%`,
                        minHeight: day.count > 0 ? '4px' : '0px',
                      }}
                      title={`${day.date}: ${day.count} uses, ${day.successCount} successful`}
                    />
                    {index % Math.floor(dateRange.days / 7) === 0 && (
                      <div className="text-xs text-purple-300 mt-1">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="most-used" className="space-y-4">
          <TabsList className="bg-black/40 border border-white/10">
            <TabsTrigger value="most-used" className="text-white data-[state=active]:bg-purple-600">
              Most Used
            </TabsTrigger>
            <TabsTrigger value="by-llm" className="text-white data-[state=active]:bg-purple-600">
              By LLM
            </TabsTrigger>
            <TabsTrigger value="success-rates" className="text-white data-[state=active]:bg-purple-600">
              Success Rates
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-purple-600">
              Recent Activity
            </TabsTrigger>
          </TabsList>

          {/* Most Used Prompts */}
          <TabsContent value="most-used">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Most Used Prompts</CardTitle>
                <CardDescription className="text-purple-200/70">
                  Your top 10 most frequently used prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mostUsedLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-white/10" />
                    ))}
                  </div>
                ) : mostUsed && mostUsed.length > 0 ? (
                  <div className="space-y-3">
                    {mostUsed.map((item, index) => (
                      <div
                        key={item.promptId}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{item.prompt?.title ?? 'Unknown'}</h3>
                            {item.prompt?.description && (
                              <p className="text-sm text-purple-200/70 line-clamp-1">
                                {item.prompt.description}
                              </p>
                            )}
                            {item.prompt?.targetLlm && (
                              <Badge variant="outline" className="mt-1 text-xs border-purple-500/50 text-purple-300">
                                {item.prompt.targetLlm}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-300">{item.usageCount}</div>
                          <div className="text-xs text-purple-200/70">uses</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-purple-200/70">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No usage data yet. Start using your prompts to see analytics!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage by LLM */}
          <TabsContent value="by-llm">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Usage by LLM</CardTitle>
                <CardDescription className="text-purple-200/70">
                  Breakdown of usage across different language models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {byLlmLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-white/10" />
                    ))}
                  </div>
                ) : byLlm && byLlm.length > 0 ? (
                  <div className="space-y-3">
                    {byLlm.map((item) => {
                      const total = byLlm.reduce((sum, i) => sum + i.count, 0);
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;
                      return (
                        <div key={item.llm} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{item.llm}</span>
                            <span className="text-purple-300">
                              {item.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-purple-200/70">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No LLM usage data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Success Rates */}
          <TabsContent value="success-rates">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Prompt Success Rates</CardTitle>
                <CardDescription className="text-purple-200/70">
                  Prompts with the highest success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {successRatesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-white/10" />
                    ))}
                  </div>
                ) : successRates && successRates.length > 0 ? (
                  <div className="space-y-3">
                    {successRates.map((item) => (
                      <div
                        key={item.promptId}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-purple-200/70 line-clamp-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-purple-300">
                            <span>{item.successCount} successful</span>
                            <span>•</span>
                            <span>{item.totalUsage} total uses</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-purple-300">{item.successRate}%</div>
                          {item.successRate >= 75 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto mt-1" />
                          ) : item.successRate >= 50 ? (
                            <Target className="h-5 w-5 text-yellow-500 ml-auto mt-1" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-purple-200/70">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No success tracking data yet. Rate your prompt results to see analytics!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity */}
          <TabsContent value="activity">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                <CardDescription className="text-purple-200/70">
                  Your latest actions and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-white/10" />
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                            {activity.action}
                          </Badge>
                          <span className="text-sm text-white">{activity.entityType}</span>
                        </div>
                        <span className="text-xs text-purple-200/70">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-purple-200/70">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity to display.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
