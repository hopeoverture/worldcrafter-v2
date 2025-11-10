'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyTreeProps {
  characterId: string;
  worldId: string;
}

interface TreeNode {
  id: string;
  name: string;
  imageUrl?: string;
  birthDate?: string;
  deathDate?: string;
  children?: TreeNode[];
  spouses?: TreeNode[];
}

type LayoutDirection = 'TB' | 'LR' | 'radial';

export default function FamilyTree({ characterId, worldId }: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutDirection>('TB');
  const [zoom, setZoom] = useState(1);

  // Fetch family relationships
  const { data: familyData, isLoading } = useQuery({
    queryKey: ['family-tree', characterId],
    queryFn: async () => {
      const response = await fetch(`/api/characters/${characterId}/family-tree`);
      if (!response.ok) throw new Error('Failed to fetch family tree');
      return response.json() as Promise<TreeNode>;
    }
  });

  useEffect(() => {
    if (!familyData || !svgRef.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 800;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    // Create tree layout
    let tree;
    if (layout === 'TB') {
      tree = d3.tree<TreeNode>().size([width - 200, height - 200]);
    } else if (layout === 'LR') {
      tree = d3.tree<TreeNode>().size([height - 200, width - 200]);
    } else {
      // Radial layout
      tree = d3.tree<TreeNode>().size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
    }

    // Create hierarchy
    const root = d3.hierarchy(familyData);
    const treeData = tree(root);

    // Add links (parent-child relationships)
    const link = g
      .selectAll('.link')
      .data(treeData.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('d', (d: any) => {
        if (layout === 'radial') {
          return d3
            .linkRadial<any, d3.HierarchyPointNode<TreeNode>>()
            .angle((d) => d.x)
            .radius((d) => d.y)(d);
        } else if (layout === 'LR') {
          return d3
            .linkHorizontal<any, d3.HierarchyPointNode<TreeNode>>()
            .x((d) => d.y)
            .y((d) => d.x)(d);
        } else {
          return d3
            .linkVertical<any, d3.HierarchyPointNode<TreeNode>>()
            .x((d) => d.x)
            .y((d) => d.y)(d);
        }
      });

    // Add nodes
    const node = g
      .selectAll('.node')
      .data(treeData.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        if (layout === 'radial') {
          const angle = d.x;
          const radius = d.y;
          const x = radius * Math.cos(angle - Math.PI / 2);
          const y = radius * Math.sin(angle - Math.PI / 2);
          return `translate(${x + width / 2},${y + height / 2})`;
        } else if (layout === 'LR') {
          return `translate(${d.y + 100},${d.x + 100})`;
        } else {
          return `translate(${d.x + 100},${d.y + 100})`;
        }
      })
      .style('cursor', 'pointer');

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', 30)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3);

    // Add images if available
    node
      .filter((d) => d.data.imageUrl)
      .append('image')
      .attr('xlink:href', (d) => d.data.imageUrl!)
      .attr('x', -25)
      .attr('y', -25)
      .attr('width', 50)
      .attr('height', 50)
      .attr('clip-path', 'circle(25px at 25px 25px)');

    // Add names
    node
      .append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text((d) => d.data.name);

    // Add dates if available
    node
      .filter((d) => d.data.birthDate || d.data.deathDate)
      .append('text')
      .attr('dy', 60)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text((d) => {
        const birth = d.data.birthDate || '?';
        const death = d.data.deathDate || '?';
        return `${birth} - ${death}`;
      });

    // Add click handler to expand/collapse
    node.on('click', (event: any, d: any) => {
      event.stopPropagation();
      if (d.children) {
        (d as any)._children = d.children;
        d.children = null;
      } else if ((d as any)._children) {
        d.children = (d as any)._children;
        (d as any)._children = null;
      }
      // Re-render (simplified - in production, use proper state management)
      toast.info('Expand/collapse feature - re-render tree');
    });

    // Add zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

  }, [familyData, layout]);

  // Export to SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `family-tree-${characterId}-${Date.now()}.svg`;
    link.href = url;
    link.click();

    toast.success('Family tree exported as SVG');
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
      link.download = `family-tree-${characterId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Family tree exported as PNG');
    } catch (error) {
      toast.error('Failed to export family tree');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading family tree...</div>;
  }

  if (!familyData) {
    return <div className="flex items-center justify-center h-96">No family data found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Select value={layout} onValueChange={(value) => setLayout(value as LayoutDirection)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TB">Top to Bottom</SelectItem>
            <SelectItem value="LR">Left to Right</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>

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

      {/* Tree Container */}
      <div
        ref={containerRef}
        className="w-full border rounded-lg bg-white dark:bg-slate-900 overflow-hidden"
      >
        <svg ref={svgRef} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" />
          <span>Parent-Child</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
          <span>Spouse</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Click node to expand/collapse</span>
        </div>
      </div>
    </div>
  );
}
