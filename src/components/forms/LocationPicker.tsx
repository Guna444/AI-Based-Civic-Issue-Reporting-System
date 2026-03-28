"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

export function LocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [manualLat, setManualLat] = useState(latitude?.toString() || "");
  const [manualLng, setManualLng] = useState(longitude?.toString() || "");
  const { toast } = useToast();

  useEffect(() => {
    if (latitude) setManualLat(latitude.toString());
    if (longitude) setManualLng(longitude.toString());
  }, [latitude, longitude]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter coordinates manually.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let detectedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Try reverse geocoding with Nominatim (free, no API key needed)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await response.json();
          if (data.display_name) {
            detectedAddress = data.display_name;
          }
        } catch {
          // Use coordinates as address if reverse geocoding fails
        }

        onLocationChange(lat, lng, detectedAddress);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
        setLoading(false);

        toast({
          title: "Location detected",
          description: "Your current location has been captured.",
        });
      },
      (error) => {
        setLoading(false);
        let msg = "Could not detect location.";
        if (error.code === error.PERMISSION_DENIED) msg = "Location permission denied. Please enter manually.";
        toast({ title: "Location Error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualInput = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180.",
        variant: "destructive",
      });
      return;
    }

    let detectedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      if (data.display_name) detectedAddress = data.display_name;
    } catch {
      // Silently fail
    }

    onLocationChange(lat, lng, detectedAddress);
    toast({ title: "Location set", description: "Coordinates saved successfully." });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Location *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {loading ? "Detecting..." : "Detect My Location"}
        </Button>
      </div>

      {/* Location display */}
      {latitude && longitude && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-green-800 font-medium">Location captured</p>
            <p className="text-xs text-green-600">{address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}</p>
          </div>
        </div>
      )}

      {/* Manual input */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="lat" className="text-xs text-gray-500">
            Latitude
          </Label>
          <Input
            id="lat"
            type="number"
            step="any"
            placeholder="e.g. 28.6139"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="lng" className="text-xs text-gray-500">
            Longitude
          </Label>
          <Input
            id="lng"
            type="number"
            step="any"
            placeholder="e-g. 77.2090"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {(manualLat || manualLng) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleManualInput}
          className="w-full"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Set Location from Coordinates
        </Button>
      )}

      <p className="text-xs text-gray-400">
        Use &quot;Detect My Location&quot; for GPS accuracy, or enter coordinates manually.
      </p>
    </div>
  );
}
