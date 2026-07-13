package com.example.demo.controller;

import com.example.demo.model.Trip;
import com.example.demo.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private TripRepository tripRepository;

    // 1. Ambil Semua Data Perjalanan
    @GetMapping
    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    // 2. Mulai Perjalanan Baru (Create)
    @PostMapping
    public Trip createTrip(@RequestBody Trip trip) {
        return tripRepository.save(trip);
    }

    // 3. Ambil Detail Perjalanan Berdasarkan ID
    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable UUID id) {
        return tripRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Update Data Perjalanan (Misal saat selesai atau isi bensin)
    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable UUID id, @RequestBody Trip tripDetails) {
        return tripRepository.findById(id).map(trip -> {
            trip.setVehicleId(tripDetails.getVehicleId());
            trip.setDriverId(tripDetails.getDriverId());
            trip.setRouteId(tripDetails.getRouteId());
            trip.setStartTime(tripDetails.getStartTime());
            trip.setEndTime(tripDetails.getEndTime());
            trip.setFuelBeforeLiter(tripDetails.getFuelBeforeLiter());
            trip.setFuelAfterLiter(tripDetails.getFuelAfterLiter());
            trip.setStatus(tripDetails.getStatus());
            return ResponseEntity.ok(tripRepository.save(trip));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Hapus Catatan Perjalanan
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable UUID id) {
        return tripRepository.findById(id).map(trip -> {
            tripRepository.delete(trip);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}