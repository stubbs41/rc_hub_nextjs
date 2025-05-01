"use client";

import { useEffect, useState, useRef, MouseEvent } from "react";
import { PartDiagram, DiagramHotspot } from "@/types/diagram";
import { fetchDiagramById } from "@/services/diagramService";
import { Part } from "@/types/part";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InteractiveDiagramViewerProps {
  diagramId: string;
}

interface PartInfoPopoverProps {
  hotspot: DiagramHotspot;
  position: { x: number; y: number };
  onClose: () => void;
}

// Simple Popover to display Part Info
const PartInfoPopover = ({ hotspot, position, onClose }: PartInfoPopoverProps) => {
  const part = hotspot.part;

  return (
    <div
      className="absolute bg-white border rounded-lg shadow-lg p-4 z-10 max-w-xs"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1 right-1 p-1 h-auto"
        onClick={onClose}
      >
        &times;
      </Button>
      {part ? (
        <>
          <h4 className="font-semibold mb-2">{part.name}</h4>
          <p className="text-sm">Part #: {part.part_number || "N/A"}</p>
          <p className="text-sm">Quantity: {part.quantity}</p>
          <p className="text-sm">Status: {part.status || "N/A"}</p>
          {/* Add link to full part details later */}
        </>
      ) : (
        <p className="text-sm text-gray-500">No linked part information available.</p>
      )}
      {hotspot.label && <p className="text-sm mt-2">Label: {hotspot.label}</p>}
    </div>
  );
};

export default function InteractiveDiagramViewer({ diagramId }: InteractiveDiagramViewerProps) {
  const [diagram, setDiagram] = useState<PartDiagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<DiagramHotspot | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDiagram = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDiagramById(diagramId);
        setDiagram(data);
      } catch (err) {
        console.error("Failed to load diagram:", err);
        setError(err instanceof Error ? err.message : "Could not load diagram.");
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId]);

  const handleHotspotClick = (hotspot: DiagramHotspot, event: MouseEvent<SVGRectElement | HTMLDivElement>) => {
    setSelectedHotspot(hotspot);

    // Calculate position relative to the container
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Position popover near the click event, adjusting for container offset
        let x = event.clientX - rect.left + 10; // Add offset
        let y = event.clientY - rect.top + 10; // Add offset

        // TODO: Add boundary checks to keep popover within view

        setPopoverPosition({ x, y });
    }
  };

  const handleClosePopover = () => {
    setSelectedHotspot(null);
  };

  if (loading) {
    return <p>Loading diagram...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!diagram) {
    return <p>Diagram not found.</p>;
  }

  // Basic rendering assuming rectangular coordinates for now
  // Assumes diagram_url points to a standard image format (png, jpg, etc.)
  // For SVG, rendering would be different (e.g., using <object> or inline SVG)
  const renderHotspots = () => {
    return diagram.hotspots?.map((hotspot) => {
      // Assuming coordinates are { x, y, width, height }
      const coords = hotspot.coordinates as { x: number; y: number; width: number; height: number };
      if (!coords || typeof coords.x !== "number" || typeof coords.y !== "number" || typeof coords.width !== "number" || typeof coords.height !== "number") {
        console.warn(`Invalid coordinates for hotspot ${hotspot.id}:`, hotspot.coordinates);
        return null; // Skip rendering if coordinates are invalid
      }

      return (
        <div
          key={hotspot.id}
          className="absolute border-2 border-blue-500 hover:bg-blue-500 hover:bg-opacity-30 cursor-pointer"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            width: `${coords.width}px`,
            height: `${coords.height}px`,
          }}
          onClick={(e) => handleHotspotClick(hotspot, e)}
          title={hotspot.label || "Click for details"}
        />
      );
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Interactive Diagram: {diagram.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full border overflow-hidden">
          {/* Basic image rendering - Consider libraries like react-zoom-pan-pinch for interaction */}
          <img
            src={diagram.diagram_url}
            alt={diagram.name}
            className="block max-w-full h-auto"
          />
          {renderHotspots()}
          {selectedHotspot && (
            <PartInfoPopover
              hotspot={selectedHotspot}
              position={popoverPosition}
              onClose={handleClosePopover}
            />
          )}
        </div>
        {diagram.description && <p className="mt-4 text-sm text-gray-600">{diagram.description}</p>}
      </CardContent>
    </Card>
  );
}

