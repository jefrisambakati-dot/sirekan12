package com.example.demo.repository;

import com.example.demo.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository // Menandakan ini adalah komponen repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    // Saat ini, semua fungsi standar (findAll, save, delete, findById) sudah aktif otomatis.
    // Nanti kita bisa tambahkan custom query di sini jika butuh pencarian khusus.
}