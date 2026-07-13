package com.example.demo.repository;

import com.example.demo.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    // JpaRepository sudah menyediakan method standar:
    // save(), findAll(), findById(), delete(), existsById(), dll.
}