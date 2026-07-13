package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plate_number")
    private String plateNumber;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "capacity")
    private String capacity;

    @Column(name = "status")
    private String status;

    @Column(name = "company_id")
    private UUID companyId;

    // Constructor Kosong (Wajib untuk JPA/Hibernate)
    public Vehicle() {}

    // Constructor lengkap (Opsional, untuk mempermudah pembuatan objek baru)
    public Vehicle(String plateNumber, String vehicleType, String capacity, String status, UUID companyId) {
        this.plateNumber = plateNumber;
        this.vehicleType = vehicleType;
        this.capacity = capacity;
        this.status = status;
        this.companyId = companyId;
    }

    // --- PENTING: Helper untuk Dropdown ---
    // Dipanggil oleh VehicleController.getVehicleDropdown()
    public String getName() {
        return this.plateNumber; 
    }

    // --- Getter dan Setter ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getCapacity() { return capacity; }
    public void setCapacity(String capacity) { this.capacity = capacity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
}