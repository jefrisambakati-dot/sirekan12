package com.example.demo.repository;

import java.util.UUID;
import java.util.Optional; // <-- Tambahkan import ini untuk menangani data kosong dengan aman

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // ID diubah menjadi UUID karena di EERD baru, tabel users menggunakan UUID
    
    // 🔥 TAMBAHKAN METHOD INI:
    // Spring Boot akan otomatis membuatkan query SQL: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);
}