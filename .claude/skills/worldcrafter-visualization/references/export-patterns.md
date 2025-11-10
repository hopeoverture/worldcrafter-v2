# Export Patterns for Visualizations

Complete guide for implementing export functionality (PNG, SVG, PDF, CSV) in WorldCrafter visualizations.

---

## Overview

All visualizations should support exporting to appropriate formats:

| Visualization | PNG | SVG | PDF | CSV |
|--------------|-----|-----|-----|-----|
| Interactive Map | ✓ | ✗ | ✓ | ✓ (markers) |
| Timeline | ✓ | ✗ | ✓ | ✓ (events) |
| Relationship Graph | ✓ | ✓ | ✓ | ✓ (relationships) |
| Family Tree | ✓ | ✓ | ✓ | ✗ |
| Org Chart | ✓ | ✓ | ✓ | ✓ (members) |
| Analytics Dashboard | ✓ | ✗ | ✓ | ✓ (all data) |

---

## PNG Export (html2canvas)

### Installation

```bash
npm install html2canvas
npm install -D @types/html2canvas
```

### Basic Implementation

```typescript
import html2canvas from 'html2canvas';

async function exportToPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element ${elementId} not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // High DPI for better quality
      useCORS: true, // Enable for external images
      logging: false, // Disable console logs
      allowTaint: false // Prevent tainted canvas
    });

    // Convert to blob for better memory management
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.png`;
      link.href = url;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    }, 'image/png');

  } catch (error) {
    console.error('PNG export failed:', error);
    throw error;
  }
}
```

### Advanced Options

```typescript
interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  quality?: number;
  removeElements?: string[]; // CSS selectors to hide
}

async function exportToPNGAdvanced(
  elementId: string,
  filename: string,
  options: ExportOptions = {}
) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element ${elementId} not found`);

  // Temporarily hide elements (e.g., export button)
  const elementsToHide: HTMLElement[] = [];
  if (options.removeElements) {
    options.removeElements.forEach(selector => {
      const els = element.querySelectorAll(selector);
      els.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        elementsToHide.push(el as HTMLElement);
      });
    });
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor || '#ffffff',
      scale: options.scale || 2,
      width: options.width,
      height: options.height,
      useCORS: true,
      logging: false,
      allowTaint: false,
      // Improve rendering of text and borders
      letterRendering: true,
      imageTimeout: 15000 // 15 second timeout for images
    });

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png', options.quality || 0.95);

  } finally {
    // Restore hidden elements
    elementsToHide.forEach(el => {
      el.style.display = '';
    });
  }
}
```

### React Component Example

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ExportToPNGButtonProps {
  elementId: string;
  filename: string;
  removeElements?: string[];
}

export function ExportToPNGButton({
  elementId,
  filename,
  removeElements = ['.export-button']
}: ExportToPNGButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await exportToPNGAdvanced(elementId, filename, { removeElements });
      toast.success('Exported successfully');
    } catch (error) {
      toast.error('Failed to export');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="export-button"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Export PNG
    </Button>
  );
}
```

### Common Issues and Solutions

**Issue: External images not rendering**

```typescript
// Solution: Enable CORS
const canvas = await html2canvas(element, {
  useCORS: true,
  allowTaint: false
});

// Or proxy images through your server
const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
```

**Issue: Blurry output**

```typescript
// Solution: Increase scale
const canvas = await html2canvas(element, {
  scale: 3, // 3x resolution
  width: element.scrollWidth,
  height: element.scrollHeight
});
```

**Issue: Canvas tainted by cross-origin data**

```typescript
// Solution: Ensure all images have CORS headers
// Or use data URLs instead of external URLs

// Convert image to data URL
async function imageToDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
```

---

## SVG Export

### For D3 Visualizations

```typescript
function exportToSVG(svgElementId: string, filename: string) {
  const svg = document.getElementById(svgElementId) as SVGSVGElement;
  if (!svg) throw new Error(`SVG element ${svgElementId} not found`);

  // Clone SVG to avoid modifying original
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  // Add XML namespace if not present
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Embed styles inline (important for external viewers)
  embedStyles(clonedSvg);

  // Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  // Add XML declaration
  const svgBlob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>\n' + svgString],
    { type: 'image/svg+xml;charset=utf-8' }
  );

  // Download
  const url = URL.createObjectURL(svgBlob);
  const link = document.createElement('a');
  link.download = `${filename}-${Date.now()}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Embed external stylesheets inline
function embedStyles(svg: SVGSVGElement) {
  const styleSheets = Array.from(document.styleSheets);
  const cssText: string[] = [];

  styleSheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules);
      rules.forEach(rule => {
        // Only include rules that might affect SVG
        if (rule.cssText.includes('svg') || rule.cssText.includes('.')) {
          cssText.push(rule.cssText);
        }
      });
    } catch (e) {
      // Ignore CORS errors for external stylesheets
      console.warn('Could not access stylesheet:', sheet.href);
    }
  });

  // Add style element to SVG
  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.textContent = cssText.join('\n');
  svg.insertBefore(styleElement, svg.firstChild);
}
```

### For React Flow Visualizations

```typescript
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

function exportReactFlowToSVG(
  nodes: Node[],
  edges: Edge[],
  filename: string
) {
  const svgElement = document.querySelector('.react-flow__renderer svg') as SVGSVGElement;
  if (!svgElement) throw new Error('React Flow SVG not found');

  // Get bounds of all nodes
  const nodesBounds = getNodesBounds(nodes);

  // Calculate viewport to fit all nodes
  const viewport = getViewportForBounds(
    nodesBounds,
    nodesBounds.width,
    nodesBounds.height,
    0.1, // min zoom
    2,   // max zoom
    0.1  // padding
  );

  // Clone and adjust viewBox
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('viewBox', `${viewport.x} ${viewport.y} ${nodesBounds.width} ${nodesBounds.height}`);
  clonedSvg.setAttribute('width', nodesBounds.width.toString());
  clonedSvg.setAttribute('height', nodesBounds.height.toString());

  // Export
  exportToSVG(clonedSvg.id, filename);
}
```

### React Component

```typescript
interface ExportToSVGButtonProps {
  svgElementId: string;
  filename: string;
}

export function ExportToSVGButton({
  svgElementId,
  filename
}: ExportToSVGButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    try {
      exportToSVG(svgElementId, filename);
      toast.success('SVG exported successfully');
    } catch (error) {
      toast.error('Failed to export SVG');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Export SVG
    </Button>
  );
}
```

---

## PDF Export (jsPDF)

### Installation

```bash
npm install jspdf
npm install -D @types/jspdf
```

### Basic Implementation

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportToPDF(
  elementId: string,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element ${elementId} not found`);

  try {
    // First, convert to canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [canvas.width, canvas.height],
      compress: true
    });

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

    // Save PDF
    pdf.save(`${filename}-${Date.now()}.pdf`);

  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
```

### Multi-Page PDF

```typescript
async function exportToPDFMultiPage(
  elementIds: string[],
  filename: string,
  title?: string
) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add title page
  if (title) {
    pdf.setFontSize(24);
    pdf.text(title, pageWidth / 2, pageHeight / 2, { align: 'center' });
    pdf.addPage();
  }

  // Add each visualization
  for (let i = 0; i < elementIds.length; i++) {
    const element = document.getElementById(elementIds[i]);
    if (!element) continue;

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions to fit page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(
      pageWidth / imgWidth,
      pageHeight / imgHeight
    );

    const width = imgWidth * ratio;
    const height = imgHeight * ratio;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    pdf.addImage(imgData, 'PNG', x, y, width, height);

    // Add page for next visualization
    if (i < elementIds.length - 1) {
      pdf.addPage();
    }
  }

  pdf.save(`${filename}-${Date.now()}.pdf`);
}
```

### With Metadata

```typescript
import jsPDF from 'jspdf';

async function exportToPDFWithMetadata(
  elementId: string,
  filename: string,
  metadata: {
    title: string;
    author: string;
    subject?: string;
    keywords?: string;
  }
) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element ${elementId} not found`);

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
    compress: true
  });

  // Set metadata
  pdf.setProperties({
    title: metadata.title,
    author: metadata.author,
    subject: metadata.subject || '',
    keywords: metadata.keywords || '',
    creator: 'WorldCrafter'
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}-${Date.now()}.pdf`);
}
```

---

## CSV Export

### Basic Implementation

```typescript
function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Generate headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Convert data to CSV rows
  const csvRows = data.map(row =>
    csvHeaders.map(header => {
      const value = row[header];

      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      // Escape quotes and wrap in quotes if contains comma/newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',')
  );

  // Combine headers and rows
  const csv = [csvHeaders.join(','), ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}-${Date.now()}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Map Markers CSV

```typescript
function exportMapMarkersToCSV(markers: MapMarker[], filename: string) {
  const data = markers.map(marker => ({
    'ID': marker.id,
    'Name': marker.name,
    'Type': marker.type,
    'X Coordinate': marker.x,
    'Y Coordinate': marker.y,
    'Description': marker.description || '',
    'Location ID': marker.locationId || ''
  }));

  exportToCSV(data, filename);
}
```

### Timeline Events CSV

```typescript
function exportTimelineEventsToCSV(events: TimelineEvent[], filename: string) {
  const data = events.map(event => ({
    'ID': event.id,
    'Name': event.name,
    'Type': event.type,
    'Start Date': event.startDate,
    'End Date': event.endDate || '',
    'Description': event.description || '',
    'Participants': Array.isArray(event.participants)
      ? event.participants.join('; ')
      : '',
    'Location ID': event.locationId || ''
  }));

  exportToCSV(data, filename);
}
```

### Relationship Graph CSV

```typescript
function exportRelationshipsToCSV(relationships: Relationship[], filename: string) {
  const data = relationships.map(rel => ({
    'Relationship ID': rel.id,
    'From Entity': rel.fromEntity.name,
    'From Type': rel.fromEntity.type,
    'To Entity': rel.toEntity.name,
    'To Type': rel.toEntity.type,
    'Relationship Type': rel.type,
    'Bidirectional': rel.bidirectional ? 'Yes' : 'No',
    'Description': rel.description || ''
  }));

  exportToCSV(data, filename);
}
```

### Analytics Dashboard CSV

```typescript
function exportAnalyticsToCSV(analytics: WorldAnalytics, filename: string) {
  const data = [
    { Metric: 'Total Entities', Value: analytics.totalEntities },
    { Metric: 'Characters', Value: analytics.entityCounts.characters },
    { Metric: 'Locations', Value: analytics.entityCounts.locations },
    { Metric: 'Factions', Value: analytics.entityCounts.factions },
    { Metric: 'Events', Value: analytics.entityCounts.events },
    { Metric: 'Items', Value: analytics.entityCounts.items },
    { Metric: 'Average Completeness', Value: `${analytics.averageCompleteness}%` },
    { Metric: 'Total Relationships', Value: analytics.totalRelationships },
    { Metric: 'Orphaned Entities', Value: analytics.orphanedCount },
  ];

  exportToCSV(data, filename);
}
```

---

## Combined Export Component

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  elementId: string;
  filename: string;
  data?: any[];
  formats?: ('png' | 'svg' | 'pdf' | 'csv')[];
}

export function ExportButton({
  elementId,
  filename,
  data,
  formats = ['png', 'pdf']
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    setIsExporting(true);

    try {
      switch (format) {
        case 'png':
          await exportToPNG(elementId, filename);
          break;
        case 'svg':
          exportToSVG(elementId, filename);
          break;
        case 'pdf':
          await exportToPDF(elementId, filename);
          break;
        case 'csv':
          if (!data) throw new Error('No data provided for CSV export');
          exportToCSV(data, filename);
          break;
      }

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (formats.length === 1) {
    return (
      <Button
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
        variant="outline"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Export {formats[0].toUpperCase()}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting} variant="outline">
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes('png') && (
          <DropdownMenuItem onClick={() => handleExport('png')}>
            Export as PNG
          </DropdownMenuItem>
        )}
        {formats.includes('svg') && (
          <DropdownMenuItem onClick={() => handleExport('svg')}>
            Export as SVG
          </DropdownMenuItem>
        )}
        {formats.includes('pdf') && (
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            Export as PDF
          </DropdownMenuItem>
        )}
        {formats.includes('csv') && data && (
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            Export as CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Best Practices

### 1. User Feedback

```typescript
// Show loading state
setIsExporting(true);

// Show success/error toast
toast.success('Exported successfully');
toast.error('Export failed');

// Progress for large exports
for (let i = 0; i < pages.length; i++) {
  toast.loading(`Exporting page ${i + 1} of ${pages.length}...`);
  await exportPage(pages[i]);
}
toast.dismiss();
toast.success('Export complete');
```

### 2. File Naming

```typescript
function generateFilename(type: string, worldName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitized = worldName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${type}-${sanitized}-${date}`;
}

// Example: "map-middle-earth-2025-11-09"
```

### 3. Memory Management

```typescript
// Revoke object URLs after use
const url = URL.createObjectURL(blob);
link.href = url;
link.click();
URL.revokeObjectURL(url); // Important!

// Clean up canvas after export
canvas.remove();
```

### 4. Error Handling

```typescript
try {
  await exportVisualization();
} catch (error) {
  if (error instanceof DOMException) {
    toast.error('Export cancelled or blocked by browser');
  } else if (error.message.includes('tainted')) {
    toast.error('Cannot export due to CORS restrictions');
  } else {
    toast.error('Export failed. Please try again.');
  }
  console.error('Export error:', error);
}
```

### 5. Accessibility

```typescript
<Button
  onClick={handleExport}
  aria-label="Export visualization as PNG"
  disabled={isExporting}
>
  {isExporting ? 'Exporting...' : 'Export PNG'}
</Button>
```

---

## Testing Export Functionality

```typescript
// e2e/export.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('should export map as PNG', async ({ page }) => {
  await page.goto('/worlds/test-world/maps');

  // Set up download listener
  const downloadPromise = page.waitForEvent('download');

  // Click export button
  await page.click('button:has-text("Export PNG")');

  // Wait for download
  const download = await downloadPromise;

  // Verify filename
  expect(download.suggestedFilename()).toMatch(/^map-.*\.png$/);

  // Save file
  const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
  await download.saveAs(downloadPath);

  // Verify file exists and has content
  const stats = fs.statSync(downloadPath);
  expect(stats.size).toBeGreaterThan(1000); // At least 1KB

  // Clean up
  fs.unlinkSync(downloadPath);
});
```

---

## Conclusion

**Quick Reference:**

- **PNG**: Best for sharing, universal support, good quality
- **SVG**: Best for vector graphics, scalable, smaller file size
- **PDF**: Best for printing, multi-page documents, professional output
- **CSV**: Best for data analysis, spreadsheets, programmatic access

**Recommendations by visualization:**

1. **Maps** → PNG + CSV (markers)
2. **Timelines** → PNG + CSV (events)
3. **Graphs** → SVG + CSV (relationships)
4. **Trees** → SVG + PNG
5. **Analytics** → CSV + PDF (report)
