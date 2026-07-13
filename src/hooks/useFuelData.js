import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useFuelData(tripId) {
  const [fuelData, setFuelData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setFuelData([]);
      return;
    }

    let cancelled = false;

    async function fetchFuel() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('fuel_sensor_data')
          .select('id, fuel_level_liter, fuel_cap_status, temperature_celsius, recorded_at')
          .eq('trip_id', tripId)
          .order('recorded_at', { ascending: true });

        if (error) throw error;
        if (!cancelled) setFuelData(data || []);
      } catch (err) {
        console.error('Error fetching fuel data:', err);
        if (!cancelled) setFuelData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFuel();
    return () => { cancelled = true; };
  }, [tripId]);

  return { fuelData, loading };
}
