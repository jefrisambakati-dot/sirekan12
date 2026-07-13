package com.example.demo.controller;

import com.example.demo.model.EntityOptionDTO;
import com.example.demo.model.Vehicle;
import com.example.demo.repository.VehicleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    // Constructor Injection (Best Practice)
    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    // 1. Get All: Semua data kendaraan
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // 2. Get Dropdown: Data ringkas (ID & Plate Number)
    @GetMapping("/dropdown")
    public ResponseEntity<List<EntityOptionDTO>> getVehicleDropdown() {
        List<EntityOptionDTO> dropdownList = vehicleRepository.findAll().stream()
                // Pastikan getName() di Vehicle.java mengembalikan plateNumber
                .map(v -> new EntityOptionDTO(v.getId(), v.getName())) 
                .collect(Collectors.toList());
        return ResponseEntity.ok(dropdownList);
    }

    // 3. Get By ID
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable UUID id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Post: Tambah kendaraan baru
    @PostMapping
    public Vehicle createVehicle(@RequestBody Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    // 5. Put: Update lengkap sesuai field model
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable UUID id, @RequestBody Vehicle vehicleDetails) {
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setPlateNumber(vehicleDetails.getPlateNumber());
            vehicle.setVehicleType(vehicleDetails.getVehicleType());
            vehicle.setCapacity(vehicleDetails.getCapacity());
            vehicle.setStatus(vehicleDetails.getStatus());
            vehicle.setCompanyId(vehicleDetails.getCompanyId());
            return ResponseEntity.ok(vehicleRepository.save(vehicle));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 6. Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable UUID id) {
        if (!vehicleRepository.existsById(id)) return ResponseEntity.notFound().build();
        vehicleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}