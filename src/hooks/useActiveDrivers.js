import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useActiveDrivers() {
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveTrips = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all active trips
      const { data: trips, error: tripsErr } = await supabase
        .from('trips')
        .select(`
          id, start_time, status, fuel_before_liter,
          drivers ( id, name, phone ),
          vehicles ( id, hull_number, plate_number ),
          routes ( id, name, polyline, source_location, destination_location )
        `)
        .eq('status', 'in_progress')
        .order('start_time', { ascending: false });

      if (tripsErr) throw tripsErr;
      if (!trips || trips.length === 0) {
        setActiveTrips([]);
        return;
      }

      const activeTripIds = trips.map(t => t.id);

      // 2. Fetch all GPS points for active trips to find the latest position and route history
      const { data: gpsPoints, error: gpsErr } = await supabase
        .from('gps_data')
        .select('trip_id, latitude, longitude, speed_kmh, recorded_at, location_name')
        .in('trip_id', activeTripIds)
        .order('recorded_at', { ascending: true }); // chronological order

      if (gpsErr) throw gpsErr;

      // Group GPS points by trip_id
      const gpsMap = {};
      gpsPoints?.forEach(pt => {
        if (!gpsMap[pt.trip_id]) {
          gpsMap[pt.trip_id] = [];
        }
        gpsMap[pt.trip_id].push({
          lat: parseFloat(pt.latitude),
          lng: parseFloat(pt.longitude),
          speed: pt.speed_kmh,
          time: pt.recorded_at,
          name: pt.location_name
        });
      });

      // Merge latest GPS and full path into active trips
      const enrichedTrips = trips.map(trip => {
        const path = gpsMap[trip.id] || [];
        const latestGps = path.length > 0 ? path[path.length - 1] : null;
        return {
          ...trip,
          path,
          latestGps
        };
      });

      setActiveTrips(enrichedTrips);
      setError(null);
    } catch (err) {
      console.error('Error in useActiveDrivers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveTrips();

    // Subscribe to both trips and gps_data changes to update real-time
    const tripsChannel = supabase
      .channel('public:active_drivers_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => fetchActiveTrips()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gps_data' },
        () => fetchActiveTrips()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
    };
  }, [fetchActiveTrips]);

  return { activeTrips, loading, error, refetch: fetchActiveTrips };
}
