// scripts/generate_dummy_data.js
// ------------------------------------------------------------
// This script generates dummy data for the Sirekan Command Center.
// It reads a built‑in coordinate module (hard‑coded below) that
// contains the sequence of points for the test route:
// Jetty → Penimbangan → Pengantaran 1‑4.
// ------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import haversine from "haversine-distance"; // npm install haversine-distance

// ------------------------------------------------------------------
// 1. Coordinate Module (converted to decimal degrees)
// ------------------------------------------------------------------
const routePoints = [
  // Jetty
  { lat: -4.235333, lng: 121.56775 },
  // Penimbangan
  { lat: -4.248278, lng: 121.579833 },
  // Pengantaran 1
  { lat: -4.2705, lng: 121.618861 },
  // Pengantaran 2
  { lat: -4.268111, lng: 121.594694 },
  // Pengantaran 3
  { lat: -4.259861, lng: 121.589111 },
  // Pengantaran 4
  { lat: -4.276417, lng: 121.597194 },
];

// Helper: compute total distance (km) using Haversine
function computeDistanceKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = { latitude: points[i - 1].lat, longitude: points[i - 1].lng };
    const p2 = { latitude: points[i].lat, longitude: points[i].lng };
    const meters = haversine(p1, p2);
    total += meters / 1000;
  }
  return Number(total.toFixed(2));
}

// ------------------------------------------------------------------
// 2. Configuration (from user preferences)
// ------------------------------------------------------------------
const DRIVER_COUNT = 10; // number of dummy drivers
const TRIPS_PER_DRIVER = 4; // trips per driver (total 40)
const FRAUD_PERCENT = 0.1; // 10 % of trips contain fraud
const FRAUD_TYPES = ["fuel_theft", "weight_manipulation", "route_deviation"];

// Fixed payload values (from user supplied numbers)
const WEIGHT_EMPTY_KG = 10000; // truck empty weight
const SOLAR_VOLUME_L = 16000; // liters of diesel
const SOLAR_DENSITY = 0.84; // kg/L
const SOLAR_WEIGHT_KG = SOLAR_VOLUME_L * SOLAR_DENSITY; // 13 440 kg
const TOTAL_WEIGHT_KG = WEIGHT_EMPTY_KG + SOLAR_WEIGHT_KG; // 23 440 kg

// ------------------------------------------------------------------
// 3. Initialise Supabase client
// ------------------------------------------------------------------
const SUPABASE_URL = 'https://jquildkylqapabwkbyee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWlsZGt5bHFhcGFid2tieWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjQ5MTAsImV4cCI6MjA5NjM0MDkxMH0.LfA3h7Q-5iM4Jqbmy57KQ9tr7lzLvb19fCE354Rmdkc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------------------------------------------------------
// 4. Main generation flow (top‑level async)
// ------------------------------------------------------------------
(async () => {
  try {
    // ---- 4.1 Get a company (fallback to first)
    const { data: companyData, error: compErr } = await supabase
      .from("companies")
      .select("id")
      .limit(1)
      .single();
    if (compErr) throw compErr;
    const companyId = companyData.id;

    // ---- 4.0 Cleanup existing dummy data
    console.log('🧹 Cleaning up existing dummy data...');
    const { data: oldDrivers } = await supabase
      .from('drivers')
      .select('id')
      .like('license_number', 'SIM-%');
    
    const oldDriverIds = oldDrivers?.map(d => d.id) || [];
    
    if (oldDriverIds.length > 0) {
      const { data: oldTrips } = await supabase
        .from('trips')
        .select('id')
        .in('driver_id', oldDriverIds);
        
      const oldTripIds = oldTrips?.map(t => t.id) || [];
      
      if (oldTripIds.length > 0) {
        await supabase.from('alerts').delete().in('trip_id', oldTripIds);
        await supabase.from('weight_scale_data').delete().in('trip_id', oldTripIds);
        await supabase.from('gps_data').delete().in('trip_id', oldTripIds);
        await supabase.from('trips').delete().in('id', oldTripIds);
      }
      
      await supabase.from('drivers').delete().in('id', oldDriverIds);
    }
    
    await supabase.from('routes').delete().eq('name', 'Demo Route – Jetty to Pengantaran');
    console.log('🧹 Cleanup completed.');

    // ---- 4.2 Insert Route with polyline
    const routeId = uuidv4();
    const polyline = {
      type: "LineString",
      coordinates: routePoints.map((p) => [p.lng, p.lat]),
    };
    const distanceKm = computeDistanceKm(routePoints);
    const { error: routeErr } = await supabase.from("routes").insert([
      {
        id: routeId,
        company_id: companyId,
        name: "Demo Route – Jetty to Pengantaran",
        source_location: "Jetty",
        destination_location: "Pengantaran 4",
        distance_km: distanceKm,
        polyline,
        created_at: new Date().toISOString(),
      },
    ]);
    if (routeErr) throw routeErr;

    // ---- 4.3 Insert Drivers
    const driverIds = [];
    for (let i = 1; i <= DRIVER_COUNT; i++) {
      const driverId = uuidv4();
      const { error: driverErr } = await supabase.from("drivers").insert([
        {
          id: driverId,
          company_id: companyId,
          name: `Driver ${i}`,
          license_number: `SIM-${1000 + i}`,
          qr_token: `token_driver_${i}`,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ]);
      if (driverErr) throw driverErr;
      driverIds.push(driverId);
    }

    // ---- 4.4 Ensure we have a vehicle (use existing DT‑09 or create one)
    let vehicleId;
    const { data: vehData, error: vehErr } = await supabase
      .from("vehicles")
      .select("id")
      .eq("hull_number", "DT-09")
      .single();
    if (vehErr && vehErr.code !== "PGRST116") {
      // No DT‑09, create a generic vehicle
      vehicleId = uuidv4();
      const { error: insErr } = await supabase.from("vehicles").insert([
        {
          id: vehicleId,
          company_id: companyId,
          hull_number: "DT-09",
          plate_number: "KT 8912 AA",
          vehicle_type: "truck",
          fuel_tank_capacity: 300,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ]);
      if (insErr) throw insErr;
    } else {
      vehicleId = vehData.id;
    }

    // ---- 4.5 Generate Trips, GPS, Weight Scale, Reconciliation Results, and Fraud Alerts
    const totalTrips = DRIVER_COUNT * TRIPS_PER_DRIVER;
    const fraudCount = Math.floor(totalTrips * FRAUD_PERCENT);
    const fraudTripIndices = new Set();
    while (fraudTripIndices.size < fraudCount) {
      fraudTripIndices.add(Math.floor(Math.random() * totalTrips));
    }

    for (let d = 0; d < DRIVER_COUNT; d++) {
      const driverId = driverIds[d];
      for (let t = 0; t < TRIPS_PER_DRIVER; t++) {
        const globalIdx = d * TRIPS_PER_DRIVER + t;
        const tripId = uuidv4();
        const startTime = new Date(Date.now() - (globalIdx + 1) * 2 * 60 * 60 * 1000);

        const isFraud = fraudTripIndices.has(globalIdx);
        const fraudType = isFraud ? FRAUD_TYPES[globalIdx % FRAUD_TYPES.length] : null;

        // Insert trip
        const { error: tripErr } = await supabase.from("trips").insert([
          {
            id: tripId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            route_id: routeId,
            start_time: startTime.toISOString(),
            status: "in_progress",
            fuel_before_liter: SOLAR_VOLUME_L,
            created_at: startTime.toISOString(),
          },
        ]);
        if (tripErr) throw tripErr;

        // Generate coordinates with deviation if fraudType is 'route_deviation'
        const gpsInserts = routePoints.map((pt, idx) => {
          let lat = pt.lat;
          let lng = pt.lng;
          // Apply significant deviation for route_deviation fraud
          if (fraudType === 'route_deviation' && idx > 0 && idx < routePoints.length - 1) {
            lat += 0.012 + Math.sin(idx) * 0.005; // deviate by ~1.5 - 2 km
            lng += 0.012 + Math.cos(idx) * 0.005;
          } else {
            // Add tiny natural noise to make paths slightly different for each driver
            lat += (Math.random() - 0.5) * 0.0003;
            lng += (Math.random() - 0.5) * 0.0003;
          }

          return {
            id: uuidv4(),
            trip_id: tripId,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            speed_kmh: idx === 0 ? 0 : 35 + Math.random() * 25,
            is_geofence_official: fraudType === 'route_deviation' ? (idx < 2) : (idx < 3),
            recorded_at: new Date(startTime.getTime() + idx * 5 * 60 * 1000).toISOString(),
            location_name: fraudType === 'route_deviation' && idx > 0 && idx < routePoints.length - 1 
              ? `Jalan Tikus / Deviasi ${idx}` 
              : `Point ${idx + 1}`,
          };
        });

        const { error: gpsErr } = await supabase.from("gps_data").insert(gpsInserts);
        if (gpsErr) throw gpsErr;

        // Insert weight scale data (simulating deviation for weight_manipulation)
        const weightAfter = fraudType === 'weight_manipulation' ? TOTAL_WEIGHT_KG - 500 : TOTAL_WEIGHT_KG;
        const { error: wsErr } = await supabase.from("weight_scale_data").insert([
          {
            id: uuidv4(),
            trip_id: tripId,
            weight_before_kg: WEIGHT_EMPTY_KG,
            weight_after_kg: weightAfter,
            measured_at: new Date(startTime.getTime() + 15 * 60 * 1000).toISOString(),
            scale_location: "Penimbangan",
          },
        ]);
        if (wsErr) console.warn('⚠️  weight_scale_data insert skipped (RLS):', wsErr.message);

        // Calculate reconciliation metrics
        const expectedFuel = Number((distanceKm * 2.0).toFixed(1)); // 2 L per km standard
        let actualFuel = expectedFuel;
        let routeDevPercent = 0;
        let weightDiscrepancyPercent = 0;
        let reconScore = 95 - Math.random() * 5; // Good trips: 90 - 95 score
        let reconStatus = 'pass';

        if (fraudType === 'fuel_theft') {
          actualFuel = expectedFuel + 35; // stolen 35 liters
          reconScore = 40 + Math.random() * 10; // low score
          reconStatus = 'fraud';
        } else if (fraudType === 'route_deviation') {
          actualFuel = expectedFuel + 6.2; // consumed more due to longer path
          routeDevPercent = 25; // 25% deviance
          reconScore = 50 + Math.random() * 10;
          reconStatus = 'fraud';
        } else if (fraudType === 'weight_manipulation') {
          actualFuel = expectedFuel + (Math.random() - 0.5) * 1.5;
          weightDiscrepancyPercent = 5.0; // 500 kg variance from cargo
          reconScore = 45 + Math.random() * 10;
          reconStatus = 'fraud';
        } else {
          // Add small natural random variations for non-fraud trips
          actualFuel = Number((expectedFuel + (Math.random() - 0.5) * 1.8).toFixed(1));
          const fuelVariance = Math.abs(((actualFuel - expectedFuel) / expectedFuel) * 100);
          if (fuelVariance > 10) {
            reconScore = 80 - Math.random() * 10;
            reconStatus = 'warning';
          }
        }

        const fuelVariancePercent = Number((((actualFuel - expectedFuel) / expectedFuel) * 100).toFixed(1));

        // Insert reconciliation results
        const { error: reconErr } = await supabase.from("reconciliation_results").insert([
          {
            id: uuidv4(),
            trip_id: tripId,
            expected_fuel_consumption_liter: expectedFuel,
            actual_fuel_consumption_liter: actualFuel,
            fuel_variance_percent: fuelVariancePercent,
            weight_variance_kg: fraudType === 'weight_manipulation' ? 500 : 0,
            weight_discrepancy_percent: weightDiscrepancyPercent,
            route_deviation_percent: routeDevPercent,
            reconciliation_score: Number(reconScore.toFixed(1)),
            status: reconStatus,
            reconciled_at: new Date().toISOString(),
          }
        ]);
        if (reconErr) console.warn('⚠️  reconciliation_results insert skipped (RLS):', reconErr.message);

        // Insert Fraud Alert if applicable
        if (isFraud) {
          const evidence = {};
          if (fraudType === "fuel_theft") evidence.loss_liter = 35;
          else if (fraudType === "weight_manipulation") evidence.weight_variance_kg = 500;
          else if (fraudType === "route_deviation") evidence.deviation_km = 2.3;

          const { error: alertErr } = await supabase.from("alerts").insert([
            {
              id: uuidv4(),
              trip_id: tripId,
              fraud_type: fraudType,
              severity: "high",
              status: "open",
              description: `Simulasi ${fraudType} pada trip ${tripId}`,
              evidence_data: evidence,
              created_at: new Date().toISOString(),
            },
          ]);
          if (alertErr) throw alertErr;
        }
      }
    }

    console.log("✅ Dummy data generation completed successfully.");
  } catch (e) {
    console.error("❌ Error generating dummy data:", e);
    process.exit(1);
  }
})();
