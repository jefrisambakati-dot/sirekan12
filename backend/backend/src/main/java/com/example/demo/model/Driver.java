package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String licenseNumber;
    private String phone;
    private String status;

    // Menangani error 'not-null constraint' pada company_id
    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = true)
    private Vehicle vehicle;

    // Relasi ke tabel User untuk Login
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    public Driver() {}

    // --- Getter dan Setter ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}