# Implementation Plan – Driver Full Dashboard

## Goal Description
Create a **comprehensive driver dashboard** that appears after the driver successfully verifies their QR token (or scans it). The dashboard will provide all essential tools a driver needs while on a trip, such as:
- Live map with route and current location.
- Real‑time fuel level graph.
- Trip details (vehicle, route, distance, ETA).
- Start/Stop trip controls.
- Ability to report incidents (photo, notes, GPS).
- Push notifications for alerts (e.g., fuel‑cap open, route deviation).
- Quick access to company contact & support.
- Logout / finish trip.

All UI will follow the premium glass‑morphism aesthetic already used throughout the app.

## User Review Required
> [!IMPORTANT]
> The driver dashboard is a **new page** (`#/driver-dashboard`). It will replace the current `DriverApp` UI after token verification. Please confirm that:
> - The listed features meet your expectations.
> - The navigation flow (scan → dashboard) is acceptable.
> - Any additional driver‑specific features you need (e.g., temperature sensor, weight scale) should be added now.

## Open Questions
> [!WARNING]
> - Do you want **offline support** (store data locally if network drops)?
> - Should the driver be able to **pause** a trip and resume later?
> - Do you need **voice commands** or **speech‑to‑text** for incident reports?
> - Should the dashboard auto‑logout after a period of inactivity?

## Proposed Changes
---
### Front‑end (React – `sirekan-dashboard`)
#### 1. New Route & Component
- **[NEW] `src/pages/DriverDashboard.jsx`** – main driver dashboard page.
- **[MODIFY] `src/App.jsx`** – add route `#/driver-dashboard` and redirect after successful token verification.

#### 2. Dashboard Layout
- **[NEW] `src/components/DriverHeader.jsx`** – shows vehicle, driver name, route, ETA.
- **[NEW] `src/components/LiveMap.jsx`** – wrapper around existing `MapContainer` but with simplified UI (no admin controls) and auto‑center on driver.
- **[NEW] `src/components/FuelMonitor.jsx`** – adapted from `FuelGraph` to show current fuel level, trend, and alerts.
- **[NEW] `src/components/TripControls.jsx`** – buttons: *Start Trip*, *Pause*, *End Trip*, *Report Incident*.
- **[NEW] `src/components/IncidentReporter.jsx`** – modal with photo upload (via `<input type="file" capture="environment">`), text area, and auto‑attach GPS.
- **[NEW] `src/components/DriverNotifications.jsx`** – toast system listening to Supabase realtime `alerts` table for this driver.
- **[NEW] `src/components/SupportContact.jsx`** – quick dial/email button.

#### 3. State Management (hooks)
- **[NEW] `src/hooks/useTrip.js`** – fetch current trip, start/pause/end via Supabase RPC.
- **[NEW] `src/hooks/useAlerts.js`** – realtime subscription to alert rows for the driver.
- **[NEW] `src/hooks/useIncident.js`** – upload incident data to `incidents` table.

#### 4. Styling
- Add CSS modules / `driver-dashboard.css` implementing glass‑morphism cards, gradients, and micro‑animations for buttons.
- Ensure responsiveness for mobile (truck cabin screens).

#### 5. Backend (Spring Boot)
- **[MODIFY] `TripController`** – expose endpoints:
  - `POST /trips/{id}/start`
  - `POST /trips/{id}/pause`
  - `POST /trips/{id}/end`
  - `POST /incidents` (payload: tripId, driverId, description, photoUrl, gps).
- **[NEW] `AlertService`** – publish to Supabase via webhook when fuel cap opens or route deviation detected.
- **[NEW] `IncidentEntity`** + JPA repo for persisting incidents.

#### 6. Database (Supabase) Additions
- Table **`incidents`** (id, trip_id, driver_id, description, photo_url, lat, lng, created_at).
- Ensure **RLS** policies allow driver to insert/select only their own incidents.
- Add **`status`** column to `trips` (`planned`, `in_progress`, `paused`, `completed`).

#### 7. Seed / Scripts
- Update `seed_kendari.js` to include `status` = `planned` for each trip (already done) and create a **sample incident** for demo.
- Add a script `scripts/add_trip_status_columns.js` to migrate existing trips.

## Verification Plan
### Automated Tests
- Run existing frontend test suite (`npm test`) plus new unit tests for `useTrip` and `useAlerts`.
- Backend integration tests using `SpringBootTest` to verify trip state transitions and incident insertion.

### Manual Verification
1. Scan QR token → driver lands on `/driver-dashboard`.
2. Verify map shows live location, route line, and ETA.
3. Click **Start Trip** → status updates to `in_progress` and fuel graph begins.
4. Simulate a fuel‑cap open alert → toast appears.
5. Use **Report Incident** → upload a photo, add note, submit → check `incidents` table.
6. End trip → map stops, buttons disabled, auto‑logout after 2 min of inactivity.

---
*Implementation plan saved as `implementation_plan.md` for your review.*
