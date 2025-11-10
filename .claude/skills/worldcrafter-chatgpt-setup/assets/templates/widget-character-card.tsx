/**
 * Template: Character Card Widget
 *
 * Inline conversational widget for displaying character information.
 * Copy to: src/widgets/character-card.tsx
 *
 * Features:
 * - Displays character avatar, name, role, traits
 * - Interactive buttons to view details or add traits
 * - Communicates with ChatGPT via window.openai API
 * - Responsive design with Tailwind-style classes
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Extend window object with OpenAI widget API
declare global {
  interface Window {
    openai: {
      /**
       * Update widget state from ChatGPT
       */
      setWidgetState: (state: any) => void;

      /**
       * Call an MCP tool from widget
       */
      callTool: (name: string, args: any) => Promise<any>;

      /**
       * Send follow-up message to ChatGPT
       */
      sendFollowUpMessage: (message: string) => void;

      /**
       * Navigate to different widget
       */
      navigate: (widgetUri: string, state?: any) => void;
    };
  }
}

interface CharacterCardProps {
  characterId: string;
  name: string;
  role?: string;
  traits?: string[];
  background?: string;
  avatarUrl?: string;
  worldName?: string;
}

function CharacterCard() {
  const [character, setCharacter] = useState<CharacterCardProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for state updates from ChatGPT
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'widget-state') {
        setCharacter(event.data.state);
        setLoading(false);
      }

      if (event.data.type === 'widget-error') {
        setError(event.data.error);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial state
    window.parent.postMessage({ type: 'widget-ready' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleViewDetails = async () => {
    if (!character) return;

    try {
      // Call get_character tool
      await window.openai.callTool('get_character', {
        characterId: character.characterId,
      });
    } catch (err) {
      console.error('Failed to load character details:', err);
    }
  };

  const handleAddTrait = () => {
    if (!character) return;

    // Send follow-up message to ChatGPT
    window.openai.sendFollowUpMessage(
      `Add a trait to ${character.name} (ID: ${character.characterId})`
    );
  };

  const handleViewRelationships = () => {
    if (!character) return;

    // Navigate to relationship graph widget
    window.openai.navigate('ui://widget/relationship-graph.html', {
      characterId: character.characterId,
      worldName: character.worldName,
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="character-card loading">
        <div className="avatar-skeleton"></div>
        <div className="text-skeleton"></div>
        <div className="text-skeleton short"></div>
      </div>
    );
  }

  // Error State
  if (error || !character) {
    return (
      <div className="character-card error">
        <p>Failed to load character</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  // Generate avatar (first letter of name)
  const avatarLetter = character.name.charAt(0).toUpperCase();

  // Gradient colors based on name hash
  const hashCode = character.name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = Math.abs(hashCode) % 360;
  const gradientStart = `hsl(${hue}, 70%, 60%)`;
  const gradientEnd = `hsl(${(hue + 30) % 360}, 70%, 50%)`;

  return (
    <div className="character-card">
      {/* Header with Avatar */}
      <div className="card-header">
        <div
          className="avatar"
          style={{
            background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
          }}
        >
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <span className="avatar-letter">{avatarLetter}</span>
          )}
        </div>

        <div className="header-text">
          <h3 className="character-name">{character.name}</h3>
          {character.role && <p className="character-role">{character.role}</p>}
          {character.worldName && (
            <p className="world-badge">in {character.worldName}</p>
          )}
        </div>
      </div>

      {/* Traits */}
      {character.traits && character.traits.length > 0 && (
        <div className="traits-section">
          <p className="section-label">Traits</p>
          <div className="traits-list">
            {character.traits.slice(0, 5).map((trait, idx) => (
              <span key={idx} className="trait-badge">
                {trait}
              </span>
            ))}
            {character.traits.length > 5 && (
              <span className="trait-badge more">
                +{character.traits.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Background Preview */}
      {character.background && (
        <div className="background-section">
          <p className="section-label">Background</p>
          <p className="background-text">
            {character.background.slice(0, 100)}
            {character.background.length > 100 ? '...' : ''}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={handleViewDetails} className="btn btn-primary">
          View Details
        </button>
        <button onClick={handleAddTrait} className="btn btn-secondary">
          + Trait
        </button>
        <button onClick={handleViewRelationships} className="btn btn-secondary">
          Relationships
        </button>
      </div>

      {/* Styles */}
      <style jsx>{`
        .character-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .character-card.loading {
          padding: 20px;
        }

        .character-card.error {
          padding: 20px;
          text-align: center;
          color: #ef4444;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-letter {
          color: white;
          font-size: 28px;
          font-weight: bold;
        }

        .header-text {
          flex: 1;
          min-width: 0;
        }

        .character-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .character-role {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .world-badge {
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0 0 0;
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .traits-section {
          margin-bottom: 16px;
        }

        .traits-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .trait-badge {
          padding: 4px 10px;
          background: #eef2ff;
          color: #4f46e5;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .trait-badge.more {
          background: #f3f4f6;
          color: #6b7280;
        }

        .background-section {
          margin-bottom: 16px;
        }

        .background-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover {
          background: #4338ca;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .avatar-skeleton {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .text-skeleton {
          height: 16px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .text-skeleton.short {
          width: 60%;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
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
  root.render(<CharacterCard />);
}
