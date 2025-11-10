'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Plus, Trash2, Move } from 'lucide-react';
import html2canvas from 'html2canvas';
import { createMapMarker, deleteMapMarker, updateMapMarker, type MapMarker } from './actions';
import { toast } from 'sonner';

interface InteractiveMapProps {
  mapId: string;
  imageUrl: string;
  width: number;
  height: number;
  initialMarkers?: MapMarker[];
}

const MARKER_TYPES = {
  city: { icon: '🏙️', color: '#3b82f6' },
  landmark: { icon: '🏛️', color: '#8b5cf6' },
  mountain: { icon: '⛰️', color: '#6b7280' },
  forest: { icon: '🌲', color: '#22c55e' },
  castle: { icon: '🏰', color: '#dc2626' },
  battle: { icon: '⚔️', color: '#ef4444' },
  port: { icon: '⚓', color: '#06b6d4' },
  ruins: { icon: '🗿', color: '#78716c' },
};

export default function InteractiveMap({
  mapId,
  imageUrl,
  width,
  height,
  initialMarkers = []
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ x: number; y: number } | null>(null);

  const queryClient = useQueryClient();

  // Fetch markers with real-time updates
  const { data: markers = initialMarkers } = useQuery({
    queryKey: ['map-markers', mapId],
    queryFn: async () => {
      const response = await fetch(`/api/maps/${mapId}/markers`);
      if (!response.ok) throw new Error('Failed to fetch markers');
      return response.json();
    },
    initialData: initialMarkers,
    refetchInterval: 30000 // Refresh every 30s
  });

  // Mutations
  const createMarkerMutation = useMutation({
    mutationFn: createMapMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-markers', mapId] });
      toast.success('Marker added');
      setIsAddingMarker(false);
      setNewMarkerPosition(null);
    },
    onError: () => toast.error('Failed to add marker')
  });

  const deleteMarkerMutation = useMutation({
    mutationFn: deleteMapMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-markers', mapId] });
      toast.success('Marker deleted');
      setSelectedMarker(null);
    },
    onError: () => toast.error('Failed to delete marker')
  });

  const updateMarkerMutation = useMutation({
    mutationFn: updateMapMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-markers', mapId] });
      toast.success('Marker updated');
    },
    onError: () => toast.error('Failed to update marker')
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map with custom CRS for image coordinates
    const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]];
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomControl: true,
      attributionControl: false
    });

    // Add image overlay
    const imageOverlay = L.imageOverlay(imageUrl, bounds);
    imageOverlay.addTo(map);
    imageOverlayRef.current = imageOverlay;

    // Fit to bounds
    map.fitBounds(bounds);

    // Create markers layer
    const markersLayer = L.layerGroup();
    markersLayer.addTo(map);
    markersLayerRef.current = markersLayer;

    // Handle map clicks when adding marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isAddingMarker) {
        // Convert LatLng to percentage coordinates
        const x = (e.latlng.lng / width) * 100;
        const y = (e.latlng.lat / height) * 100;
        setNewMarkerPosition({ x, y });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [imageUrl, width, height]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add markers
    markers.forEach((marker) => {
      // Convert percentage coordinates to LatLng
      const lat = (marker.y / 100) * height;
      const lng = (marker.x / 100) * width;

      // Create custom icon
      const markerType = MARKER_TYPES[marker.type as keyof typeof MARKER_TYPES] || MARKER_TYPES.landmark;
      const icon = L.divIcon({
        html: `
          <div style="
            background-color: ${marker.color || markerType.color};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${markerType.icon}
          </div>
        `,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const leafletMarker = L.marker([lat, lng], { icon });

      // Add popup
      leafletMarker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${marker.name}</h3>
          ${marker.description ? `<p style="margin-bottom: 8px;">${marker.description}</p>` : ''}
          <div style="display: flex; gap: 8px;">
            <button
              onclick="window.selectMarker('${marker.id}')"
              style="padding: 4px 8px; background: #3b82f6; color: white; border-radius: 4px; border: none; cursor: pointer;"
            >
              Edit
            </button>
            <button
              onclick="window.deleteMarker('${marker.id}')"
              style="padding: 4px 8px; background: #ef4444; color: white; border-radius: 4px; border: none; cursor: pointer;"
            >
              Delete
            </button>
          </div>
        </div>
      `);

      leafletMarker.addTo(markersLayerRef.current!);
    });
  }, [markers, height, width]);

  // Global functions for popup buttons
  useEffect(() => {
    (window as any).selectMarker = (markerId: string) => {
      const marker = markers.find(m => m.id === markerId);
      if (marker) setSelectedMarker(marker);
    };

    (window as any).deleteMarker = (markerId: string) => {
      if (confirm('Delete this marker?')) {
        deleteMarkerMutation.mutate(markerId);
      }
    };

    return () => {
      delete (window as any).selectMarker;
      delete (window as any).deleteMarker;
    };
  }, [markers, deleteMarkerMutation]);

  // Export to PNG
  const handleExport = async () => {
    if (!mapContainerRef.current) return;

    try {
      const canvas = await html2canvas(mapContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `map-${mapId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Map exported');
    } catch (error) {
      toast.error('Failed to export map');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsAddingMarker(!isAddingMarker)}
          variant={isAddingMarker ? 'default' : 'outline'}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAddingMarker ? 'Click map to place marker' : 'Add Marker'}
        </Button>

        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PNG
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          {markers.length} marker{markers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[600px] rounded-lg border bg-slate-50 dark:bg-slate-900"
        style={{ cursor: isAddingMarker ? 'crosshair' : 'default' }}
      />

      {/* Add Marker Dialog */}
      <Dialog open={newMarkerPosition !== null} onOpenChange={(open) => {
        if (!open) setNewMarkerPosition(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Marker</DialogTitle>
          </DialogHeader>
          <AddMarkerForm
            mapId={mapId}
            position={newMarkerPosition!}
            onSubmit={(data) => createMarkerMutation.mutate(data)}
            onCancel={() => setNewMarkerPosition(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Marker Dialog */}
      <Dialog open={selectedMarker !== null} onOpenChange={(open) => {
        if (!open) setSelectedMarker(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Marker</DialogTitle>
          </DialogHeader>
          <EditMarkerForm
            marker={selectedMarker!}
            onSubmit={(data) => updateMarkerMutation.mutate(data)}
            onCancel={() => setSelectedMarker(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Marker Form Component
function AddMarkerForm({
  mapId,
  position,
  onSubmit,
  onCancel
}: {
  mapId: string;
  position: { x: number; y: number };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'landmark' as keyof typeof MARKER_TYPES,
    locationId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      mapId,
      ...formData,
      ...position,
      color: MARKER_TYPES[formData.type].color
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as keyof typeof MARKER_TYPES })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MARKER_TYPES).map(([key, { icon }]) => (
              <SelectItem key={key} value={key}>
                {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Position: {position.x.toFixed(1)}%, {position.y.toFixed(1)}%
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Marker</Button>
      </div>
    </form>
  );
}

// Edit Marker Form Component
function EditMarkerForm({
  marker,
  onSubmit,
  onCancel
}: {
  marker: MapMarker;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: marker.name,
    description: marker.description || '',
    type: marker.type as keyof typeof MARKER_TYPES
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: marker.id,
      ...formData,
      color: MARKER_TYPES[formData.type].color
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="edit-type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as keyof typeof MARKER_TYPES })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MARKER_TYPES).map(([key, { icon }]) => (
              <SelectItem key={key} value={key}>
                {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Input
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
