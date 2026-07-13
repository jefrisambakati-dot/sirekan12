package com.example.demo.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
// Ditambahkan schema = "public" agar Spring Boot menembak schema yang tepat di Supabase
@Table(name = "users", schema = "public")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String username;
    private String email;
    
    // Disesuaikan dengan nama kolom password di Supabase-mu (password_hash)
    @Column(name = "password_hash")
    private String password; 
    
    private String role; // Isinya nanti: "ADMIN" atau "DRIVER"

    // Ditambahkan kolom nama lengkap untuk display profil di UI React
    @Column(name = "full_name")
    private String fullName;

    // Ditambahkan kolom relasi opsi ke perusahaan/vendor logistik
    @Column(name = "company_id")
    private UUID companyId;

    // Constructor bawaan
    public User() {}

    // --- GETTER AND SETTER JALUR ASLI ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // --- GETTER AND SETTER TAMBAHAN ---
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public UUID getCompanyId() { return companyId; }
    public void setCompanyId(UUID companyId) { this.companyId = companyId; }
}