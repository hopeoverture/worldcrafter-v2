'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Filter, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import dagre from '@dagrejs/dagre';

interface RelationshipGraphProps {
  worldId: string;
  initialRelationships?: any[];
}

// Entity type colors
const ENTITY_COLORS = {
  character: '#3b82f6',
  location: '#22c55e',
  faction: '#ef4444',
  event: '#f59e0b',
  item: '#8b5cf6',
};

// Layout algorithms
type LayoutType = 'force' | 'hierarchical' | 'circular' | 'grid';

// Calculate hierarchical layout using dagre
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Calculate circular layout
function getCircularLayout(nodes: Node[], edges: Edge[]) {
  const radius = Math.max(300, nodes.length * 30);
  const centerX = 0;
  const centerY = 0;

  const layoutedNodes = nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Calculate grid layout
function getGridLayout(nodes: Node[], edges: Edge[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const cellWidth = 200;
  const cellHeight = 120;

  const layoutedNodes = nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      ...node,
      position: {
        x: col * cellWidth,
        y: row * cellHeight,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export default function RelationshipGraph({
  worldId,
  initialRelationships = []
}: RelationshipGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layout, setLayout] = useState<LayoutType>('force');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['character', 'location', 'faction', 'event', 'item']);
  const [selectedRelTypes, setSelectedRelTypes] = useState<string[]>([]);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  // Fetch relationships
  const { data: relationships = initialRelationships } = useQuery({
    queryKey: ['relationships', worldId],
    queryFn: async () => {
      const response = await fetch(`/api/worlds/${worldId}/relationships`);
      if (!response.ok) throw new Error('Failed to fetch relationships');
      return response.json();
    },
    initialData: initialRelationships,
    refetchInterval: 30000
  });

  // Get unique relationship types
  const relationshipTypes = Array.from(
    new Set(relationships.map((r: any) => r.type))
  );

  useEffect(() => {
    if (selectedRelTypes.length === 0 && relationshipTypes.length > 0) {
      setSelectedRelTypes(relationshipTypes);
    }
  }, [relationshipTypes]);

  // Transform relationships to graph data
  useEffect(() => {
    // Filter relationships
    const filteredRelationships = relationships.filter((rel: any) => {
      const fromTypeMatch = selectedTypes.includes(rel.fromEntity.type);
      const toTypeMatch = selectedTypes.includes(rel.toEntity.type);
      const relTypeMatch = selectedRelTypes.includes(rel.type);
      return fromTypeMatch && toTypeMatch && relTypeMatch;
    });

    // Extract unique entities
    const entityMap = new Map();
    filteredRelationships.forEach((rel: any) => {
      if (!entityMap.has(rel.fromEntityId)) {
        entityMap.set(rel.fromEntityId, rel.fromEntity);
      }
      if (!entityMap.has(rel.toEntityId)) {
        entityMap.set(rel.toEntityId, rel.toEntity);
      }
    });

    // Create nodes
    const newNodes: Node[] = Array.from(entityMap.values()).map((entity: any) => ({
      id: entity.id,
      type: 'custom',
      data: {
        label: entity.name,
        type: entity.type,
        imageUrl: entity.imageUrl,
        description: entity.description,
      },
      position: { x: 0, y: 0 },
      style: {
        background: ENTITY_COLORS[entity.type as keyof typeof ENTITY_COLORS] || '#6b7280',
        color: 'white',
        border: '2px solid white',
        borderRadius: '8px',
        padding: '10px',
        width: 150,
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
    }));

    // Create edges
    const newEdges: Edge[] = filteredRelationships.map((rel: any) => ({
      id: rel.id,
      source: rel.fromEntityId,
      target: rel.toEntityId,
      label: rel.type,
      type: rel.bidirectional ? 'default' : 'smoothstep',
      animated: false,
      markerEnd: rel.bidirectional ? undefined : {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
        stroke: '#94a3b8',
      },
      labelStyle: {
        fontSize: '10px',
        fill: '#64748b',
      },
    }));

    // Apply layout
    let layoutedElements = { nodes: newNodes, edges: newEdges };

    switch (layout) {
      case 'hierarchical':
        layoutedElements = getLayoutedElements(newNodes, newEdges);
        break;
      case 'circular':
        layoutedElements = getCircularLayout(newNodes, newEdges);
        break;
      case 'grid':
        layoutedElements = getGridLayout(newNodes, newEdges);
        break;
      case 'force':
      default:
        // Force layout is handled by ReactFlow automatically
        break;
    }

    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
  }, [relationships, selectedTypes, selectedRelTypes, layout]);

  // Highlight connected nodes
  useEffect(() => {
    if (!highlightedNode) {
      // Reset all node styles
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            opacity: 1,
          },
        }))
      );
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            opacity: 1,
          },
        }))
      );
      return;
    }

    // Find connected nodes and edges
    const connectedNodeIds = new Set<string>([highlightedNode]);
    const connectedEdgeIds = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === highlightedNode || edge.target === highlightedNode) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      }
    });

    // Update node styles
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: connectedNodeIds.has(node.id) ? 1 : 0.3,
        },
      }))
    );

    // Update edge styles
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: connectedEdgeIds.has(edge.id) ? 1 : 0.1,
        },
      }))
    );
  }, [highlightedNode]);

  // Node click handler
  const onNodeClick = useCallback((_: any, node: Node) => {
    setHighlightedNode(node.id === highlightedNode ? null : node.id);
  }, [highlightedNode]);

  // Export to PNG
  const handleExport = () => {
    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowElement) return;

    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(reactFlowElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `relationship-graph-${worldId}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Graph exported');
      });
    }).catch(() => {
      toast.error('Failed to export graph');
    });
  };

  // Export to SVG
  const handleExportSVG = () => {
    const svgElement = document.querySelector('.react-flow__renderer svg') as SVGSVGElement;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `relationship-graph-${worldId}-${Date.now()}.svg`;
    link.href = url;
    link.click();

    toast.success('Graph exported as SVG');
  };

  return (
    <div className="h-[800px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        className="bg-slate-50 dark:bg-slate-900"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const type = node.data.type as keyof typeof ENTITY_COLORS;
            return ENTITY_COLORS[type] || '#6b7280';
          }}
        />

        <Panel position="top-left" className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg space-y-4 max-w-xs">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Entity Types</Label>
              {Object.entries(ENTITY_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, type]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      }
                    }}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: color }}
                    />
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Relationship Types</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {relationshipTypes.map((type: string) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`rel-${type}`}
                    checked={selectedRelTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRelTypes([...selectedRelTypes, type]);
                      } else {
                        setSelectedRelTypes(selectedRelTypes.filter((t) => t !== type));
                      }
                    }}
                  />
                  <label
                    htmlFor={`rel-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Layout</Label>
            <Select
              value={layout}
              onValueChange={(value) => setLayout(value as LayoutType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="force">Force-Directed</SelectItem>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Panel>

        <Panel position="top-right" className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
          <Button onClick={handleExportSVG} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export SVG
          </Button>
        </Panel>

        <Panel position="bottom-left" className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow text-sm">
          <div className="font-semibold">
            {nodes.length} nodes, {edges.length} edges
          </div>
          {highlightedNode && (
            <div className="text-xs text-muted-foreground mt-1">
              Click node again to deselect
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Custom Node Component (optional - for more control)
export function CustomNode({ data }: { data: any }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt={data.label}
          className="w-12 h-12 rounded-full object-cover border-2 border-white"
        />
      )}
      <div className="text-center">
        <div className="font-bold text-xs">{data.label}</div>
        <div className="text-[10px] opacity-75">{data.type}</div>
      </div>
    </div>
  );
}
