/**
 * Template: World Dashboard Widget
 *
 * Fullscreen conversational widget for world overview and analytics.
 * Copy to: src/widgets/world-dashboard.tsx
 *
 * Features:
 * - World statistics (characters, locations, relationships)
 * - Recent activity timeline
 * - Quick actions (add character, add location, etc.)
 * - Relationship graph preview
 * - Export and sharing options
 */

import React, { useEffect, useState } from 'react';
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

interface WorldData {
  worldId: string;
  name: string;
  theme?: string;
  description?: string;
  characterCount: number;
  locationCount: number;
  relationshipCount: number;
  createdAt: string;
  updatedAt: string;
  recentActivity?: Activity[];
}

interface Activity {
  id: string;
  type: 'character_added' | 'location_added' | 'relationship_added' | 'world_updated';
  description: string;
  timestamp: string;
}

function WorldDashboard() {
  const [world, setWorld] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'widget-state') {
        setWorld(event.data.state);
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

  const handleAddCharacter = () => {
    if (!world) return;
    window.openai.sendFollowUpMessage(`Add a new character to ${world.name}`);
  };

  const handleAddLocation = () => {
    if (!world) return;
    window.openai.sendFollowUpMessage(`Add a new location to ${world.name}`);
  };

  const handleViewRelationships = () => {
    if (!world) return;
    window.openai.navigate('ui://widget/relationship-graph.html', {
      worldId: world.worldId,
    });
  };

  const handleExport = async () => {
    if (!world) return;
    try {
      await window.openai.callTool('export_world', {
        worldId: world.worldId,
        format: 'json',
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleGetSummary = async () => {
    if (!world) return;
    try {
      await window.openai.callTool('get_world_summary', {
        worldId: world.worldId,
      });
    } catch (err) {
      console.error('Summary failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return formatDate(timestamp);
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="skeleton-header"></div>
        <div className="skeleton-stats"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="dashboard error">
        <p>Failed to load world dashboard</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="world-name">{world.name}</h1>
          {world.theme && <p className="world-theme">{world.theme}</p>}
          {world.description && (
            <p className="world-description">{world.description}</p>
          )}
          <p className="world-meta">
            Created {formatDate(world.createdAt)} • Last updated{' '}
            {formatDate(world.updatedAt)}
          </p>
        </div>
      </header>

      {/* Statistics */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon character-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{world.characterCount}</div>
            <div className="stat-label">Characters</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon location-icon">📍</div>
          <div className="stat-content">
            <div className="stat-value">{world.locationCount}</div>
            <div className="stat-label">Locations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon relationship-icon">🔗</div>
          <div className="stat-content">
            <div className="stat-value">{world.relationshipCount}</div>
            <div className="stat-label">Relationships</div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-grid">
          <button className="action-button" onClick={handleAddCharacter}>
            <span className="action-icon">🎭</span>
            <span className="action-text">Add Character</span>
          </button>
          <button className="action-button" onClick={handleAddLocation}>
            <span className="action-icon">🏰</span>
            <span className="action-text">Add Location</span>
          </button>
          <button className="action-button" onClick={handleViewRelationships}>
            <span className="action-icon">🕸️</span>
            <span className="action-text">View Relationships</span>
          </button>
          <button className="action-button" onClick={handleGetSummary}>
            <span className="action-icon">📝</span>
            <span className="action-text">Get Summary</span>
          </button>
          <button className="action-button" onClick={handleExport}>
            <span className="action-icon">📦</span>
            <span className="action-text">Export World</span>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      {world.recentActivity && world.recentActivity.length > 0 && (
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {world.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-description">{activity.description}</p>
                  <p className="activity-time">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Styles */}
      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard.loading,
        .dashboard.error {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .dashboard-header {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .world-name {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .world-theme {
          font-size: 16px;
          color: #667eea;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .world-description {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .world-meta {
          font-size: 14px;
          color: #9ca3af;
          margin: 0;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          font-size: 36px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0 0 16px 0;
        }

        .actions-section {
          margin-bottom: 24px;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .action-button {
          background: white;
          border: none;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 32px;
        }

        .action-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .activity-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .activity-section .section-title {
          color: #111827;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .activity-dot {
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .activity-description {
          font-size: 15px;
          color: #374151;
          margin: 0 0 4px 0;
        }

        .activity-time {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }

        .skeleton-header,
        .skeleton-stats,
        .skeleton-content {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          animation: pulse 1.5s infinite;
        }

        .skeleton-header {
          height: 150px;
          margin-bottom: 24px;
        }

        .skeleton-stats {
          height: 100px;
          margin-bottom: 24px;
        }

        .skeleton-content {
          height: 300px;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Mount component
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<WorldDashboard />);
}
