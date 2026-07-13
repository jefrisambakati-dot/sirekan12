package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "route_id")
    private UUID routeId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "fuel_before_liter")
    private BigDecimal fuelBeforeLiter;

    @Column(name = "fuel_after_liter")
    private BigDecimal fuelAfterLiter;

    @Column(name = "status")
    private String status;

    // Constructor Kosong
    public Trip() {}

    // Getter dan Setter
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }

    public UUID getDriverId() { return driverId; }
    public void setDriverId(UUID driverId) { this.driverId = driverId; }

    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public BigDecimal getFuelBeforeLiter() { return fuelBeforeLiter; }
    public void setFuelBeforeLiter(BigDecimal fuelBeforeLiter) { this.fuelBeforeLiter = fuelBeforeLiter; }

    public BigDecimal getFuelAfterLiter() { return fuelAfterLiter; }
    public void setFuelAfterLiter(BigDecimal fuelAfterLiter) { this.fuelAfterLiter = fuelAfterLiter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}