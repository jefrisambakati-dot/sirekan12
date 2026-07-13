package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "origin")
    private String origin;

    @Column(name = "destination")
    private String destination;

    @Column(name = "weight")
    private BigDecimal weight;

    @Column(name = "status")
    private String status;

    // Relasi ke tabel Company
    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // Relasi ke tabel Vehicle
    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // Relasi ke tabel Driver
    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    // 1. Constructor Kosong (Wajib untuk JPA/Hibernate)
    public Shipment() {}

    // 2. Constructor lengkap
    public Shipment(String origin, String destination, BigDecimal weight, String status, Company company, Vehicle vehicle, Driver driver) {
        this.origin = origin;
        this.destination = destination;
        this.weight = weight;
        this.status = status;
        this.company = company;
        this.vehicle = vehicle;
        this.driver = driver;
    }

    // 3. Getter dan Setter
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }
}