/**
 * GPS Capture Component
 * Location tracking for attendance with geofencing
 */

import { useState, useCallback } from 'react';
import { MapPin, Loader, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/Button';
import { trackGPSCapture } from '@/utils/mobileAnalytics';

interface GPSCaptureProps {
  onCapture: (location: GeolocationData) => void;
  workSiteLocation?: { lat: number; lng: number; radius: number };
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  withinGeofence?: boolean;
  distanceFromSite?: number;
}

export function GPSCapture({ onCapture, workSiteLocation }: GPSCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const captureLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('GPS not supported on this device');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const acquisitionTime = Date.now() - startTime;

        const geoData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        if (workSiteLocation) {
          const distance = calculateDistance(
            geoData.latitude,
            geoData.longitude,
            workSiteLocation.lat,
            workSiteLocation.lng
          );
          geoData.distanceFromSite = distance;
          geoData.withinGeofence = distance <= workSiteLocation.radius;
        }

        // Track GPS metrics
        trackGPSCapture({
          timestamp: Date.now(),
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          accuracy: geoData.accuracy,
          withinGeofence: geoData.withinGeofence || false,
          distanceFromSite: geoData.distanceFromSite || 0,
          acquisitionTime,
        });

        setLocation(geoData);
        onCapture(geoData);
        setLoading(false);
      },
      (err) => {
        setError(err.message === 'User denied Geolocation' 
          ? 'Location permission denied' 
          : 'Unable to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onCapture, workSiteLocation]);

  return (
    <div className="space-y-4">
      <Button onClick={captureLocation} disabled={loading} className="w-full">
        {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
        {loading ? 'Getting Location...' : 'Capture Location'}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {location && (
        <div className="p-4 bg-emerald-50 rounded space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <Check className="w-5 h-5" />
            Location Captured
          </div>
          <div className="text-sm space-y-1 text-gray-700">
            <p>Lat: {location.latitude.toFixed(6)}</p>
            <p>Lng: {location.longitude.toFixed(6)}</p>
            <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
            {location.distanceFromSite !== undefined && (
              <p className={location.withinGeofence ? 'text-emerald-600' : 'text-red-600'}>
                Distance from site: {Math.round(location.distanceFromSite)}m
                {location.withinGeofence ? ' ✓ Within site' : ' ✗ Outside site'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function useGPSCapture() {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  
  return { location, setLocation };
}
