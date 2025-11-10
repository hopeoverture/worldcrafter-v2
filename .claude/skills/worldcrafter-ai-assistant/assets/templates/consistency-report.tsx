/**
 * Consistency Report Component
 *
 * Displays world consistency check results with severity filtering,
 * grouping by category, and actionable suggestions.
 */

"use client";

import { useState, useMemo } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ConsistencyIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "date" | "location" | "description" | "reference" | "relationship";
  title: string;
  description: string;
  affectedEntities: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  suggestedFix?: string;
}

interface ConsistencyReportProps {
  issues: ConsistencyIssue[];
  worldId: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  low: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
};

const categoryLabels = {
  date: "Date Conflicts",
  location: "Location Conflicts",
  description: "Description Issues",
  reference: "Orphaned References",
  relationship: "Relationship Issues",
};

export function ConsistencyReport({
  issues,
  worldId,
  onRefresh,
  isRefreshing = false,
}: ConsistencyReportProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedSeverity !== "all" && issue.severity !== selectedSeverity) {
        return false;
      }
      if (selectedCategory !== "all" && issue.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [issues, selectedSeverity, selectedCategory]);

  // Group by category
  const issuesByCategory = useMemo(() => {
    const grouped: Record<string, ConsistencyIssue[]> = {};
    filteredIssues.forEach((issue) => {
      if (!grouped[issue.category]) {
        grouped[issue.category] = [];
      }
      grouped[issue.category].push(issue);
    });
    return grouped;
  }, [filteredIssues]);

  // Statistics
  const stats = useMemo(() => {
    const bySeverity = {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    };

    return {
      total: issues.length,
      bySeverity,
      criticalOrHigh: bySeverity.critical + bySeverity.high,
    };
  }, [issues]);

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            No Issues Found
          </CardTitle>
          <CardDescription>
            Your world appears to be consistent. Great work!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Consistency Check Summary</CardTitle>
          <CardDescription>
            {stats.total} issue{stats.total !== 1 ? "s" : ""} found
            {stats.criticalOrHigh > 0 && (
              <span className="text-red-600 font-medium ml-2">
                ({stats.criticalOrHigh} critical/high priority)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.bySeverity.high}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.bySeverity.medium}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.bySeverity.low}</div>
              <div className="text-sm text-muted-foreground">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="date">Date Conflicts</SelectItem>
                  <SelectItem value="location">Location Conflicts</SelectItem>
                  <SelectItem value="description">Description Issues</SelectItem>
                  <SelectItem value="reference">Orphaned References</SelectItem>
                  <SelectItem value="relationship">Relationship Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {onRefresh && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Checking..." : "Refresh"}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredIssues.length} of {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>

      {/* Issues by Category */}
      <div className="space-y-4">
        {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </CardTitle>
              <CardDescription>
                {categoryIssues.length} issue{categoryIssues.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryIssues.map((issue) => {
                const config = severityConfig[issue.severity];
                const Icon = config.icon;
                const isExpanded = expandedIssues.has(issue.id);

                return (
                  <div
                    key={issue.id}
                    className={cn(
                      "border rounded-lg",
                      config.border,
                      config.bg
                    )}
                  >
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <button
                          onClick={() => toggleIssue(issue.id)}
                          className="w-full p-4 flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
                        >
                          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{issue.title}</h4>
                              <Badge className={config.badge}>{issue.severity}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {issue.description}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 flex-shrink-0" />
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 border-t pt-3">
                          {/* Affected Entities */}
                          <div>
                            <h5 className="font-medium text-sm mb-2">Affected Entities</h5>
                            <div className="flex flex-wrap gap-2">
                              {issue.affectedEntities.map((entity) => (
                                <a
                                  key={entity.id}
                                  href={`/worlds/${worldId}/${entity.type}s/${entity.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-sm hover:bg-accent transition-colors"
                                >
                                  <span className="text-muted-foreground capitalize">
                                    {entity.type}:
                                  </span>
                                  <span className="font-medium">{entity.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Suggested Fix */}
                          {issue.suggestedFix && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Suggested Fix</h5>
                              <p className="text-sm text-muted-foreground">
                                {issue.suggestedFix}
                              </p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
