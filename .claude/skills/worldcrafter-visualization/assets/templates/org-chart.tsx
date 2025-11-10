'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrgChartProps {
  factionId: string;
}

interface OrgNode {
  id: string;
  characterId: string;
  name: string;
  role: string;
  title?: string;
  rank: number;
  imageUrl?: string;
  children?: OrgNode[];
}

export default function OrgChart({ factionId }: OrgChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch faction hierarchy
  const { data: orgData, isLoading } = useQuery({
    queryKey: ['org-chart', factionId],
    queryFn: async () => {
      const response = await fetch(`/api/factions/${factionId}/org-chart`);
      if (!response.ok) throw new Error('Failed to fetch org chart');
      return response.json() as Promise<OrgNode>;
    }
  });

  // Fetch faction details
  const { data: faction } = useQuery({
    queryKey: ['faction', factionId],
    queryFn: async () => {
      const response = await fetch(`/api/factions/${factionId}`);
      if (!response.ok) throw new Error('Failed to fetch faction');
      return response.json();
    }
  });

  useEffect(() => {
    if (!orgData || !svgRef.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 800;
    const nodeWidth = 180;
    const nodeHeight = 100;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g').attr('transform', `translate(${width / 2},50)`);

    // Create tree layout
    const tree = d3
      .tree<OrgNode>()
      .nodeSize([nodeWidth + 40, nodeHeight + 60])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

    // Create hierarchy
    const root = d3.hierarchy(orgData);
    const treeData = tree(root);

    // Add links
    const link = g
      .selectAll('.link')
      .data(treeData.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('d', (d: any) => {
        return `
          M${d.source.x},${d.source.y + nodeHeight / 2}
          V${d.source.y + nodeHeight / 2 + 30}
          H${d.target.x}
          V${d.target.y - nodeHeight / 2}
        `;
      });

    // Add nodes
    const node = g
      .selectAll('.node')
      .data(treeData.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Add node rectangles
    node
      .append('rect')
      .attr('x', -nodeWidth / 2)
      .attr('y', -nodeHeight / 2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', '#ffffff')
      .attr('stroke', (d) => {
        // Color by rank
        if (d.data.rank === 1) return '#ef4444'; // Leader
        if (d.data.rank === 2) return '#f59e0b'; // Officers
        if (d.data.rank === 3) return '#3b82f6'; // Members
        return '#94a3b8'; // Default
      })
      .attr('stroke-width', 3)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');

    // Add character images
    node
      .filter((d) => d.data.imageUrl)
      .append('image')
      .attr('xlink:href', (d) => d.data.imageUrl!)
      .attr('x', -nodeWidth / 2 + 10)
      .attr('y', -nodeHeight / 2 + 10)
      .attr('width', 60)
      .attr('height', 60)
      .attr('clip-path', 'circle(30px at 30px 30px)');

    // Add character names
    node
      .append('text')
      .attr('x', 20)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text((d) => {
        // Truncate long names
        const name = d.data.name;
        return name.length > 18 ? name.substring(0, 16) + '...' : name;
      });

    // Add titles
    node
      .append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .attr('font-size', '12px')
      .attr('fill', '#64748b')
      .text((d) => d.data.title || d.data.role);

    // Add role badges
    node
      .append('text')
      .attr('x', 20)
      .attr('y', 28)
      .attr('text-anchor', 'start')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .text((d) => `Rank ${d.data.rank}`);

    // Add expand/collapse indicator
    node
      .filter((d) => d.children || (d as any)._children)
      .append('circle')
      .attr('cx', nodeWidth / 2 - 15)
      .attr('cy', nodeHeight / 2 - 15)
      .attr('r', 12)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    node
      .filter((d) => d.children || (d as any)._children)
      .append('text')
      .attr('x', nodeWidth / 2 - 15)
      .attr('y', nodeHeight / 2 - 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text((d) => (d.children ? '−' : '+'));

    // Add click handler
    node.on('click', (event: any, d: any) => {
      event.stopPropagation();

      if (d.children) {
        (d as any)._children = d.children;
        d.children = null;
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          next.delete(d.data.id);
          return next;
        });
      } else if ((d as any)._children) {
        d.children = (d as any)._children;
        (d as any)._children = null;
        setExpandedNodes((prev) => new Set(prev).add(d.data.id));
      }

      // Simple re-render trigger
      toast.info('Expand/collapse - updating chart');
    });

    // Add zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${width / 2 + event.transform.x},${50 + event.transform.y}) scale(${event.transform.k})`);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

  }, [orgData, expandedNodes]);

  // Export to SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `org-chart-${factionId}-${Date.now()}.svg`;
    link.href = url;
    link.click();

    toast.success('Org chart exported as SVG');
  };

  // Export to PNG
  const handleExportPNG = async () => {
    if (!containerRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `org-chart-${factionId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Org chart exported as PNG');
    } catch (error) {
      toast.error('Failed to export org chart');
    }
  };

  // Expand/collapse all
  const handleExpandAll = () => {
    if (!orgData) return;
    const allIds = new Set<string>();
    function collectIds(node: OrgNode) {
      allIds.add(node.id);
      node.children?.forEach(collectIds);
    }
    collectIds(orgData);
    setExpandedNodes(allIds);
    toast.info('Expanded all nodes');
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    toast.info('Collapsed all nodes');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading org chart...</div>;
  }

  if (!orgData) {
    return <div className="flex items-center justify-center h-96">No organizational data found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {faction && (
        <div className="flex items-center gap-4">
          {faction.imageUrl && (
            <img
              src={faction.imageUrl}
              alt={faction.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{faction.name}</h2>
            <p className="text-sm text-muted-foreground">Organizational Structure</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button onClick={handleExpandAll} variant="outline" size="sm">
          <Maximize2 className="w-4 h-4 mr-2" />
          Expand All
        </Button>

        <Button onClick={handleCollapseAll} variant="outline" size="sm">
          <Minimize2 className="w-4 h-4 mr-2" />
          Collapse All
        </Button>

        <Button onClick={handleExportSVG} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export SVG
        </Button>

        <Button onClick={handleExportPNG} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export PNG
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        className="w-full border rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden"
      >
        <svg ref={svgRef} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-4 border-red-500 rounded" />
          <span>Leader (Rank 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-4 border-amber-500 rounded" />
          <span>Officer (Rank 2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-4 border-blue-500 rounded" />
          <span>Member (Rank 3+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Click to expand/collapse</span>
        </div>
      </div>
    </div>
  );
}
