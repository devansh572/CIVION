"use client";

import React, { useEffect, useState, useRef } from "react";
import { useCivionStore } from "@/lib/civion-store";
import { MapPin, Navigation, Crosshair, Layers, Info } from "lucide-react";

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  showNearbyIssues?: boolean;
  height?: string;
  readOnly?: boolean;
}

// Known North District Bangalore Landmarks for realistic address resolution
const LANDMARKS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "100 Feet Road, Indiranagar Metro (Pillar 42)", lat: 12.9784, lng: 77.6408 },
  { name: "8th Cross, Jeevan Bima Nagar", lat: 12.9654, lng: 77.6582 },
  { name: "12th Main Junction, Indiranagar", lat: 12.9732, lng: 77.6391 },
  { name: "3rd Cross, Domlur Layout", lat: 12.9610, lng: 77.6385 },
  { name: "CMH Road Park Gate, Indiranagar", lat: 12.9799, lng: 77.6433 },
  { name: "5th Main, Jeevan Bima Nagar Walkway", lat: 12.9642, lng: 77.6541 },
  { name: "HAL 2nd Stage, 100ft Road", lat: 12.9711, lng: 77.6415 },
  { name: "Old Airport Road / Domlur Flyover", lat: 12.9602, lng: 77.6480 },
];

function resolveAddress(lat: number, lng: number): string {
  let closest = LANDMARKS[0];
  let minDistance = Infinity;

  for (const lm of LANDMARKS) {
    const dist = Math.hypot(lm.lat - lat, lm.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = lm;
    }
  }

  if (minDistance < 0.008) {
    return closest.name;
  }
  return `Near ${closest.name} (Coord: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  initialLat = 12.9784,
  initialLng = 77.6408,
  onLocationSelect,
  showNearbyIssues = true,
  height = "320px",
  readOnly = false,
}) => {
  const { theme, issues } = useCivionStore();
  const isLight = theme === "light";

  const [mounted, setMounted] = useState(false);
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState(resolveAddress(initialLat, initialLng));
  const [tileMode, setTileMode] = useState<"auto" | "streets" | "satellite">("auto");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const primaryMarkerRef = useRef<any>(null);
  const nearbyLayerGroupRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position if props change
  useEffect(() => {
    if (initialLat && initialLng) {
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
      setAddress(resolveAddress(initialLat, initialLng));
    }
  }, [initialLat, initialLng]);

  // Determine active tile URL (Completely free, no API keys or tokens)
  const getTileUrl = (mode: "auto" | "streets" | "satellite", light: boolean) => {
    if (mode === "satellite") {
      // Esri World Imagery (Public high-res satellite, no API key needed)
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    if (mode === "streets" || light) {
      // CartoDB Voyager / OSM Streets (Public, no API key needed, high reliability)
      return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    }
    // CartoDB Dark Matter (High-contrast industrial dark mode, public, no API key needed)
    return "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;

    let isCleanedUp = false;

    import("leaflet").then((L) => {
      if (isCleanedUp || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const lmap = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      const tileUrl = getTileUrl(tileMode, isLight);
      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(lmap);

      // Primary interactive pin icon with pulse ring
      const pinIcon = L.divIcon({
        className: "civion-map-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(224, 122, 95, 0.28); animation: pulse-dot 2s ease-in-out infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #e07a5f; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const primaryMarker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: !readOnly,
      }).addTo(lmap);

      const initialResolved = resolveAddress(currentLat, currentLng);
      primaryMarker.bindPopup(`
        <div style="font-family: system-ui; font-size: 11px; padding: 3px; color: #111;">
          <strong style="color: #e07a5f; font-size: 12px;">Report Pinpoint</strong><br/>
          <span>${initialResolved}</span>
        </div>
      `);

      primaryMarkerRef.current = primaryMarker;

      if (!readOnly) {
        lmap.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setCurrentLat(lat);
          setCurrentLng(lng);
          primaryMarker.setLatLng([lat, lng]);
          const resolved = resolveAddress(lat, lng);
          setAddress(resolved);
          primaryMarker.setPopupContent(`
            <div style="font-family: system-ui; font-size: 11px; padding: 3px; color: #111;">
              <strong style="color: #e07a5f; font-size: 12px;">Report Pinpoint</strong><br/>
              <span>${resolved}</span>
            </div>
          `);
          onLocationSelect(lat, lng, resolved);
        });

        primaryMarker.on("dragend", (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          setCurrentLat(lat);
          setCurrentLng(lng);
          const resolved = resolveAddress(lat, lng);
          setAddress(resolved);
          primaryMarker.setPopupContent(`
            <div style="font-family: system-ui; font-size: 11px; padding: 3px; color: #111;">
              <strong style="color: #e07a5f; font-size: 12px;">Report Pinpoint</strong><br/>
              <span>${resolved}</span>
            </div>
          `);
          onLocationSelect(lat, lng, resolved);
        });
      }

      // Add nearby issues layer
      const nearbyGroup = L.layerGroup().addTo(lmap);
      nearbyLayerGroupRef.current = nearbyGroup;

      if (showNearbyIssues && issues && issues.length > 0) {
        issues.forEach((iss) => {
          if (iss.coordinates && iss.coordinates.length === 2) {
            const isCrit = iss.severity === "critical";
            const color = isCrit ? "#ef4444" : "#f59e0b";

            const issueIcon = L.divIcon({
              className: "civion-nearby-pin",
              html: `
                <div style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); font-size: 9px; font-weight: bold; color: white;">
                  !
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });

            const marker = L.marker([iss.coordinates[0], iss.coordinates[1]], {
              icon: issueIcon,
            });

            marker.bindPopup(`
              <div style="font-family: system-ui; font-size: 11px; padding: 2px; color: #111;">
                <strong style="color: ${color}; font-size: 12px;">#${iss.code}</strong> (${iss.category})<br/>
                <div style="font-weight: 600; margin-top: 2px;">${iss.title}</div>
                <div style="color: #666; margin-top: 2px;">Status: <strong>${iss.status}</strong></div>
              </div>
            `);

            nearbyGroup.addLayer(marker);
          }
        });
      }

      // Invalidate map size multiple times to ensure full raster tiling inside modals or tabs
      [100, 300, 600, 1000].forEach((delay) => {
        setTimeout(() => {
          if (!isCleanedUp && lmap) {
            try {
              lmap.invalidateSize();
            } catch (e) {}
          }
        }, delay);
      });

      const handleWindowResize = () => {
        if (!isCleanedUp && lmap) {
          try {
            lmap.invalidateSize();
          } catch (e) {}
        }
      };
      window.addEventListener("resize", handleWindowResize);

      mapInstanceRef.current = lmap;
    });

    return () => {
      isCleanedUp = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, isLight, readOnly, showNearbyIssues, tileMode]);

  // GPS Locate handler
  const handleDetectGPS = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updatePosition(lat, lng);
          setIsLocating(false);
        },
        () => {
          const fallbackLat = 12.9784 + (Math.random() - 0.5) * 0.003;
          const fallbackLng = 77.6408 + (Math.random() - 0.5) * 0.003;
          updatePosition(fallbackLat, fallbackLng);
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const updatePosition = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    const resolved = resolveAddress(lat, lng);
    setAddress(resolved);
    onLocationSelect(lat, lng, resolved);

    if (mapInstanceRef.current && primaryMarkerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
      primaryMarkerRef.current.setLatLng([lat, lng]);
      primaryMarkerRef.current.setPopupContent(`
        <div style="font-family: system-ui; font-size: 11px; padding: 3px; color: #111;">
          <strong style="color: #e07a5f; font-size: 12px;">Report Pinpoint</strong><br/>
          <span>${resolved}</span>
        </div>
      `);
    }
  };

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-[#12181b] border border-white/10 flex items-center justify-center text-xs font-mono text-slate-500 animate-pulse"
      >
        Initializing OpenStreetMap & Leaflet Engine...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mapbox Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/15 shadow-xl transition-all"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Top-Left Action Buttons (GPS + Tile Mode Switcher) */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-[#161b22]/90 hover:bg-[#21262d] border border-white/15 text-white text-xs font-mono flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              title="Detect my device GPS location"
            >
              <Crosshair className={`w-3.5 h-3.5 text-coral-500 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Detecting..." : "Detect GPS"}</span>
            </button>
          )}

          {/* Layer switcher pill */}
          <div className="flex items-center bg-[#161b22]/90 border border-white/15 rounded-xl p-0.5 shadow-lg">
            <button
              type="button"
              onClick={() => setTileMode(tileMode === "satellite" ? "auto" : "satellite")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-all ${
                tileMode === "satellite"
                  ? "bg-coral-500 text-white font-bold shadow"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Toggle Satellite / Vector Streets Layer"
            >
              <Layers className="w-3 h-3" />
              <span>{tileMode === "satellite" ? "Satellite" : "Streets"}</span>
            </button>
          </div>
        </div>

        {/* Telemetry & Engine Badge Bottom-Left */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-[10px] font-mono text-emerald-400 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
            </span>
            <span className="text-slate-400 font-sans hidden sm:inline">
              · OpenStreetMap & Leaflet
            </span>
          </div>
        </div>

        {/* Nearby Legend Badge Bottom-Right */}
        {showNearbyIssues && (
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Street Landmark readout & interaction instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs px-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-coral-500 flex-shrink-0" />
          <span className="truncate max-w-sm">{address}</span>
        </div>
        {!readOnly && (
          <span className="text-[11px] font-mono text-coral-400/90 flex-shrink-0">
            Click map or drag pin to adjust exact coordinates
          </span>
        )}
      </div>
    </div>
  );
};
