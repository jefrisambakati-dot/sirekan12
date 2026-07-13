package com.example.demo.repository;

import com.example.demo.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface DriverRepository extends JpaRepository<Driver, UUID> {
}