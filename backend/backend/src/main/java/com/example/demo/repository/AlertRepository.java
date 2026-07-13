package com.example.demo.repository;

import com.example.demo.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
}