import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useGpsData(tripId) {
  const [gpsData, setGpsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setGpsData([]);
      return;
    }

    let cancelled = false;

    async function fetchGps() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('gps_data')
          .select('id, latitude, longitude, speed_kmh, recorded_at, location_name, is_geofence_official')
          .eq('trip_id', tripId)
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        if (!cancelled) setGpsData(data || []);
      } catch (err) {
        console.error('Error fetching GPS data:', err);
        if (!cancelled) setGpsData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGps();
    return () => { cancelled = true; };
  }, [tripId]);

  return { gpsData, loading };
}
