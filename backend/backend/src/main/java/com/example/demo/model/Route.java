package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "name")
    private String name;

    @Column(name = "source_location")
    private String sourceLocation;

    @Column(name = "destination_location")
    private String destinationLocation;

    // Menambahkan precision & scale untuk akurasi desimal database
    @Column(name = "distance_km", precision = 10, scale = 2) 
    private BigDecimal distanceKm;

    // 1. Constructor Kosong (Wajib untuk JPA)
    public Route() {}

    // 2. Constructor Lengkap (Untuk mempermudah instansiasi)
    public Route(UUID companyId, String name, String sourceLocation, String destinationLocation, BigDecimal distanceKm) {
        this.companyId = companyId;
        this.name = name;
        this.sourceLocation = sourceLocation;
        this.destinationLocation = destinationLocation;
        this.distanceKm = distanceKm;
    }

    // 3. Getter dan Setter
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSourceLocation() { return sourceLocation; }
    public void setSourceLocation(String sourceLocation) { this.sourceLocation = sourceLocation; }

    public String getDestinationLocation() { return destinationLocation; }
    public void setDestinationLocation(String destinationLocation) { this.destinationLocation = destinationLocation; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }
}