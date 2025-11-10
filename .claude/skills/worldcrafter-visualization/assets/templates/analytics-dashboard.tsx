'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download, TrendingUp, Users, MapPin, Calendar, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
  worldId: string;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const ENTITY_COLORS = {
  characters: '#3b82f6',
  locations: '#22c55e',
  factions: '#ef4444',
  events: '#f59e0b',
  items: '#8b5cf6',
};

export default function AnalyticsDashboard({ worldId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['world-analytics', worldId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/worlds/${worldId}/analytics?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Export data to CSV
  const handleExportCSV = () => {
    if (!analytics) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Entities', analytics.totalEntities],
      ['Characters', analytics.entityCounts.characters],
      ['Locations', analytics.entityCounts.locations],
      ['Factions', analytics.entityCounts.factions],
      ['Events', analytics.entityCounts.events],
      ['Items', analytics.entityCounts.items],
      ['Average Completeness', `${analytics.averageCompleteness}%`],
      ['Total Relationships', analytics.totalRelationships],
      ['Orphaned Entities', analytics.orphanedCount],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `world-analytics-${worldId}-${Date.now()}.csv`;
    link.href = url;
    link.click();

    toast.success('Analytics exported to CSV');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="flex items-center justify-center h-96">No analytics data available</div>;
  }

  // Transform data for charts
  const entityCountsData = Object.entries(analytics.entityCounts).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS],
  }));

  const completenessData = Object.entries(analytics.completenessScores).map(([type, score]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    score,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">World Analytics</h2>
          <p className="text-muted-foreground">Insights and statistics for your world</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEntities}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Characters</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.entityCounts.characters}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.entityCounts.characters / analytics.totalEntities) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Relationships</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRelationships}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(analytics.totalRelationships / analytics.totalEntities).toFixed(1)} per entity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completeness</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageCompleteness}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all entities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity Counts Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Entity Distribution</CardTitle>
            <CardDescription>Breakdown by entity type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={entityCountsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {entityCountsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>Entities created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Entities Created"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completeness Scores Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Completeness Scores</CardTitle>
            <CardDescription>% of required fields filled</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completenessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Connected Entities */}
        <Card>
          <CardHeader>
            <CardTitle>Most Connected Entities</CardTitle>
            <CardDescription>Top 10 by relationship count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostConnected.slice(0, 10).map((entity: any, index: number) => (
                <div key={entity.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-bold">
                    {index + 1}
                  </div>
                  {entity.imageUrl && (
                    <img
                      src={entity.imageUrl}
                      alt={entity.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">{entity.type}</div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {entity._count.relationshipsFrom + entity._count.relationshipsTo}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orphaned Entities */}
      {analytics.orphaned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orphaned Entities</CardTitle>
            <CardDescription>
              Entities with no relationships ({analytics.orphaned.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.orphaned.map((entity: any) => (
                <div
                  key={entity.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ENTITY_COLORS[entity.type as keyof typeof ENTITY_COLORS],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">{entity.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Contributors (for shared worlds) */}
      {analytics.topContributors && analytics.topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Most active world collaborators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topContributors.map((contributor: any, index: number) => (
                <div key={contributor.userId} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-sm font-bold">
                    {index + 1}
                  </div>
                  {contributor.avatar && (
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contributor.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {contributor.contributions} contribution{contributor.contributions !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
