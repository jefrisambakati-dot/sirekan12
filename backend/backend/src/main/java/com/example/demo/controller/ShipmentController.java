package com.example.demo.controller;

import com.example.demo.model.Shipment;
import com.example.demo.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentRepository shipmentRepository;
    private final CompanyRepository companyRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    // Constructor Injection (Sudah menggunakan semua repository, warning kuning hilang)
    public ShipmentController(ShipmentRepository shipmentRepository, 
                              CompanyRepository companyRepository,
                              DriverRepository driverRepository,
                              VehicleRepository vehicleRepository) {
        this.shipmentRepository = shipmentRepository;
        this.companyRepository = companyRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    // 1. READ ALL
    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    // 2. READ ONE
    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getShipmentById(@PathVariable UUID id) {
        return shipmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. CREATE
    @PostMapping
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment) {
        // Validasi Relasi: Mengambil data entitas asli dari database berdasarkan ID
        if (shipment.getCompany() != null && shipment.getCompany().getId() != null) {
            companyRepository.findById(shipment.getCompany().getId())
                .ifPresent(shipment::setCompany);
        }
        
        if (shipment.getVehicle() != null && shipment.getVehicle().getId() != null) {
            vehicleRepository.findById(shipment.getVehicle().getId())
                .ifPresent(shipment::setVehicle);
        }
        
        if (shipment.getDriver() != null && shipment.getDriver().getId() != null) {
            driverRepository.findById(shipment.getDriver().getId())
                .ifPresent(shipment::setDriver);
        }

        return ResponseEntity.ok(shipmentRepository.save(shipment));
    }

    // 4. UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Shipment> updateShipment(@PathVariable UUID id, @RequestBody Shipment shipmentDetails) {
        return shipmentRepository.findById(id).map(shipment -> {
            // Update data dasar
            shipment.setOrigin(shipmentDetails.getOrigin());
            shipment.setDestination(shipmentDetails.getDestination());
            shipment.setWeight(shipmentDetails.getWeight());
            shipment.setStatus(shipmentDetails.getStatus());

            // Update Relasi
            if (shipmentDetails.getCompany() != null && shipmentDetails.getCompany().getId() != null) {
                companyRepository.findById(shipmentDetails.getCompany().getId())
                    .ifPresent(shipment::setCompany);
            }
            if (shipmentDetails.getVehicle() != null && shipmentDetails.getVehicle().getId() != null) {
                vehicleRepository.findById(shipmentDetails.getVehicle().getId())
                    .ifPresent(shipment::setVehicle);
            }
            if (shipmentDetails.getDriver() != null && shipmentDetails.getDriver().getId() != null) {
                driverRepository.findById(shipmentDetails.getDriver().getId())
                    .ifPresent(shipment::setDriver);
            }

            return ResponseEntity.ok(shipmentRepository.save(shipment));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShipment(@PathVariable UUID id) {
        if (!shipmentRepository.existsById(id)) return ResponseEntity.notFound().build();
        shipmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}