'use client';

import { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline as VisTimeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Filter, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import { createTimelineEvent, deleteTimelineEvent, type TimelineEvent } from './actions';
import { toast } from 'sonner';

interface TimelineViewProps {
  timelineId: string;
  worldId: string;
  initialEvents?: TimelineEvent[];
}

const EVENT_TYPES = {
  battle: { icon: '⚔️', color: '#ef4444', label: 'Battle' },
  birth: { icon: '👶', color: '#22c55e', label: 'Birth' },
  death: { icon: '💀', color: '#1e293b', label: 'Death' },
  founding: { icon: '🏛️', color: '#3b82f6', label: 'Founding' },
  coronation: { icon: '👑', color: '#f59e0b', label: 'Coronation' },
  war: { icon: '🔥', color: '#dc2626', label: 'War' },
  treaty: { icon: '📜', color: '#8b5cf6', label: 'Treaty' },
  discovery: { icon: '🔍', color: '#06b6d4', label: 'Discovery' },
  catastrophe: { icon: '☄️', color: '#78716c', label: 'Catastrophe' },
  celebration: { icon: '🎉', color: '#ec4899', label: 'Celebration' },
};

// Parse flexible date formats to numeric year
function parseFlexibleDate(dateStr: string): number {
  // ISO date: "2024-01-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr).getFullYear();
  }

  // Year with optional era: "342 AC", "1453 BCE", "-1453"
  const yearMatch = dateStr.match(/^(-?\d+)\s*(AC|CE|BCE|BC)?$/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const era = yearMatch[2]?.toUpperCase();
    if (era === 'BCE' || era === 'BC') {
      return -Math.abs(year);
    }
    return year;
  }

  // Relative: "8000 years before X" - requires anchor
  // Named: "The Long Night" - requires date mapping
  // For now, return 0 as fallback
  console.warn(`Could not parse date: ${dateStr}`);
  return 0;
}

// Convert numeric year to display date
function formatDate(year: number, format: 'standard' | 'custom' = 'standard'): string {
  if (format === 'standard') {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  }
  return year.toString();
}

export default function TimelineView({
  timelineId,
  worldId,
  initialEvents = []
}: TimelineViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const visTimelineRef = useRef<VisTimeline | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch events
  const { data: events = initialEvents } = useQuery({
    queryKey: ['timeline-events', timelineId],
    queryFn: async () => {
      const response = await fetch(`/api/timelines/${timelineId}/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    initialData: initialEvents,
    refetchInterval: 30000
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: createTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-events', timelineId] });
      toast.success('Event added');
      setIsAddingEvent(false);
    },
    onError: () => toast.error('Failed to add event')
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-events', timelineId] });
      toast.success('Event deleted');
      setSelectedEvent(null);
    },
    onError: () => toast.error('Failed to delete event')
  });

  // Filter events
  const filteredEvents = events.filter(event => {
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Initialize timeline
  useEffect(() => {
    if (!timelineRef.current || visTimelineRef.current) return;

    // Create timeline
    const timeline = new VisTimeline(timelineRef.current, [], {
      height: '500px',
      zoomMin: 1000 * 60 * 60 * 24 * 365, // 1 year
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000, // 10000 years
      orientation: 'top',
      showCurrentTime: false,
      format: {
        minorLabels: {
          year: 'YYYY'
        },
        majorLabels: {
          year: ''
        }
      }
    });

    // Handle selection
    timeline.on('select', (properties: any) => {
      if (properties.items.length > 0) {
        const eventId = properties.items[0];
        const event = events.find(e => e.id === eventId);
        if (event) setSelectedEvent(event);
      } else {
        setSelectedEvent(null);
      }
    });

    visTimelineRef.current = timeline;

    return () => {
      timeline.destroy();
      visTimelineRef.current = null;
    };
  }, []);

  // Update timeline items
  useEffect(() => {
    if (!visTimelineRef.current) return;

    const items = filteredEvents.map(event => {
      const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.celebration;
      const startYear = parseFlexibleDate(event.startDate);
      const endYear = event.endDate ? parseFlexibleDate(event.endDate) : null;

      // Convert years to JavaScript Date objects for vis-timeline
      const startDate = new Date(startYear, 0, 1);
      const endDate = endYear ? new Date(endYear, 11, 31) : undefined;

      return {
        id: event.id,
        content: `${eventType.icon} ${event.name}`,
        start: startDate,
        end: endDate,
        type: endDate ? 'range' : 'point',
        style: `background-color: ${event.color || eventType.color}; border-color: ${event.color || eventType.color};`,
        title: event.description || event.name
      };
    });

    const dataset = new DataSet(items);
    visTimelineRef.current.setItems(dataset);

    // Fit to show all events
    if (items.length > 0) {
      visTimelineRef.current.fit();
    }
  }, [filteredEvents]);

  // Zoom controls
  const handleZoom = (percentage: number) => {
    if (!visTimelineRef.current) return;
    visTimelineRef.current.zoomIn(percentage);
  };

  // Export to PNG
  const handleExport = async () => {
    if (!timelineRef.current) return;

    try {
      const canvas = await html2canvas(timelineRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `timeline-${timelineId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Timeline exported');
    } catch (error) {
      toast.error('Failed to export timeline');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setIsAddingEvent(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleZoom(0.2)} variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button onClick={() => handleZoom(-0.2)} variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PNG
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48"
          />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(EVENT_TYPES).map(([key, { icon, label }]) => (
                <SelectItem key={key} value={key}>
                  {icon} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="w-full rounded-lg border bg-white dark:bg-slate-900"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(EVENT_TYPES).map(([key, { icon, label, color }]) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span>{icon} {label}</span>
          </div>
        ))}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
          </DialogHeader>
          <AddEventForm
            timelineId={timelineId}
            onSubmit={(data) => createEventMutation.mutate(data)}
            onCancel={() => setIsAddingEvent(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => {
        if (!open) setSelectedEvent(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onDelete={() => deleteEventMutation.mutate(selectedEvent.id)}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Event Form Component
function AddEventForm({
  timelineId,
  onSubmit,
  onCancel
}: {
  timelineId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'battle' as keyof typeof EVENT_TYPES,
    locationId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventType = EVENT_TYPES[formData.type];
    onSubmit({
      timelineId,
      ...formData,
      color: eventType.color
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Battle of Waterloo"
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Event Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as keyof typeof EVENT_TYPES })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EVENT_TYPES).map(([key, { icon, label }]) => (
              <SelectItem key={key} value={key}>
                {icon} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          placeholder="1815, 342 AC, 1453 BCE"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formats: Year (1815), Year + Era (342 AC), Negative year (-1453)
        </p>
      </div>

      <div>
        <Label htmlFor="endDate">End Date (optional, for duration events)</Label>
        <Input
          id="endDate"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          placeholder="1818, 345 AC"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Event</Button>
      </div>
    </form>
  );
}

// Event Details Component
function EventDetails({
  event,
  onDelete,
  onClose
}: {
  event: TimelineEvent;
  onDelete: () => void;
  onClose: () => void;
}) {
  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.celebration;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <span>{eventType.icon}</span>
          <span>{event.name}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {event.startDate}
          {event.endDate && ` - ${event.endDate}`}
        </div>
      </div>

      {event.description && (
        <div>
          <h3 className="font-semibold mb-1">Description</h3>
          <p className="text-sm">{event.description}</p>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete Event
        </Button>
      </div>
    </div>
  );
}
