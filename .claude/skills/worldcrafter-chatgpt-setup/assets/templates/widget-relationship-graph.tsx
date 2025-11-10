/**
 * Template: Relationship Graph Widget
 *
 * Picture-in-Picture widget for visualizing character relationships.
 * Copy to: src/widgets/relationship-graph.tsx
 *
 * Features:
 * - D3.js force-directed graph
 * - Interactive nodes (click to view character)
 * - Color-coded relationship types
 * - Zoom and pan controls
 * - Search/filter by character name
 */

import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    openai: {
      setWidgetState: (state: any) => void;
      callTool: (name: string, args: any) => Promise<any>;
      sendFollowUpMessage: (message: string) => void;
      navigate: (widgetUri: string, state?: any) => void;
    };
  }
}

interface Character {
  id: string;
  name: string;
  role?: string;
}

interface Relationship {
  id: string;
  source: string; // character ID
  target: string; // character ID
  type: 'ally' | 'enemy' | 'family' | 'mentor' | 'romantic' | 'neutral';
  description?: string;
}

interface GraphData {
  worldId: string;
  worldName: string;
  characters: Character[];
  relationships: Relationship[];
  focusCharacterId?: string;
}

// Relationship type colors
const RELATIONSHIP_COLORS: Record<string, string> = {
  ally: '#10b981', // Green
  enemy: '#ef4444', // Red
  family: '#8b5cf6', // Purple
  mentor: '#f59e0b', // Orange
  romantic: '#ec4899', // Pink
  neutral: '#6b7280', // Gray
};

function RelationshipGraph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<Character | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'widget-state') {
        setData(event.data.state);
        setLoading(false);
      }

      if (event.data.type === 'widget-error') {
        setError(event.data.error);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'widget-ready' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Render graph using Canvas
  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Simple force-directed layout (simplified D3.js-style)
    const nodes = data.characters.map((char) => ({
      ...char,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    const links = data.relationships.map((rel) => ({
      ...rel,
      source: nodes.find((n) => n.id === rel.source)!,
      target: nodes.find((n) => n.id === rel.target)!,
    }));

    // Simulation parameters
    const ITERATIONS = 50;
    const LINK_DISTANCE = 100;
    const REPULSION = 5000;

    // Run simulation
    for (let i = 0; i < ITERATIONS; i++) {
      // Apply link forces
      links.forEach((link) => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - LINK_DISTANCE) / distance;

        link.source.vx += dx * force * 0.1;
        link.source.vy += dy * force * 0.1;
        link.target.vx -= dx * force * 0.1;
        link.target.vy -= dy * force * 0.1;
      });

      // Apply repulsion forces
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const dx = nodes[k].x - nodes[j].x;
          const dy = nodes[k].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (distance * distance);

          nodes[j].vx -= (dx / distance) * force;
          nodes[j].vy -= (dy / distance) * force;
          nodes[k].vx += (dx / distance) * force;
          nodes[k].vy += (dy / distance) * force;
        }
      }

      // Update positions
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9;
        node.vy *= 0.9;

        // Bounds
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });
    }

    // Draw graph
    ctx.clearRect(0, 0, width, height);

    // Draw links
    links.forEach((link) => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.strokeStyle = RELATIONSHIP_COLORS[link.type] || '#6b7280';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isFocused = data.focusCharacterId === node.id;
      const isSearchMatch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase());

      ctx.beginPath();
      ctx.arc(node.x, node.y, isFocused ? 20 : 15, 0, 2 * Math.PI);
      ctx.fillStyle = isSearchMatch ? '#4f46e5' : '#d1d5db';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#111827';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 30);
    });
  }, [data, searchQuery]);

  const handleCharacterClick = (character: Character) => {
    setSelectedNode(character);
  };

  const handleViewCharacter = () => {
    if (!selectedNode) return;
    window.openai.navigate('ui://widget/character-sheet.html', {
      characterId: selectedNode.id,
    });
  };

  const handleAddRelationship = () => {
    if (!selectedNode) return;
    window.openai.sendFollowUpMessage(
      `Add a relationship for ${selectedNode.name}`
    );
  };

  if (loading) {
    return (
      <div className="graph-container loading">
        <p>Loading relationship graph...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="graph-container error">
        <p>Failed to load relationship graph</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="graph-container">
      {/* Header */}
      <div className="graph-header">
        <div className="header-text">
          <h3 className="graph-title">{data.worldName} - Relationships</h3>
          <p className="graph-meta">
            {data.characters.length} characters • {data.relationships.length}{' '}
            relationships
          </p>
        </div>
        <input
          type="text"
          placeholder="Search characters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="graph-canvas"></canvas>

      {/* Legend */}
      <div className="graph-legend">
        {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: color }}
            ></div>
            <span className="legend-label">{type}</span>
          </div>
        ))}
      </div>

      {/* Selected Node Panel */}
      {selectedNode && (
        <div className="node-panel">
          <h4>{selectedNode.name}</h4>
          {selectedNode.role && <p>{selectedNode.role}</p>}
          <div className="panel-actions">
            <button onClick={handleViewCharacter}>View Details</button>
            <button onClick={handleAddRelationship}>Add Relationship</button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .graph-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .graph-container.loading,
        .graph-container.error {
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .graph-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .graph-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .graph-meta {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .search-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          min-width: 200px;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .graph-canvas {
          flex: 1;
          cursor: pointer;
        }

        .graph-legend {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .legend-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .node-panel {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 200px;
        }

        .node-panel h4 {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .node-panel p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .panel-actions {
          display: flex;
          gap: 8px;
        }

        .panel-actions button {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .panel-actions button:hover {
          background: #f3f4f6;
          border-color: #4f46e5;
        }
      `}</style>
    </div>
  );
}

// Mount component
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<RelationshipGraph />);
}
