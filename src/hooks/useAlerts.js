import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select(`
          id, fraud_type, severity, status, description, evidence_data, created_at, trip_id,
          trips (
            id, status, start_time, fuel_before_liter,
            vehicles (
              hull_number,
              plate_number
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      console.log('Successfully fetched alerts from Supabase:', data);
      setAlerts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('public:alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('Real-time alert event:', payload.eventType);
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
}
