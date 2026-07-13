package com.example.demo.controller;

import com.example.demo.model.Route;
import com.example.demo.repository.RouteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*") 
public class RouteController {

    private final RouteRepository routeRepository;

    // Constructor Injection (Lebih disarankan daripada @Autowired)
    public RouteController(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    // 1. Ambil Semua Data Rute
    @GetMapping
    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    // 2. Tambah Rute Baru
    @PostMapping
    public Route createRoute(@RequestBody Route route) {
        return routeRepository.save(route);
    }

    // 3. Ambil Rute Berdasarkan ID
    @GetMapping("/{id}")
    public ResponseEntity<Route> getRouteById(@PathVariable UUID id) {
        return routeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Update Data Rute
    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRoute(@PathVariable UUID id, @RequestBody Route routeDetails) {
        return routeRepository.findById(id).map(route -> {
            route.setCompanyId(routeDetails.getCompanyId());
            route.setName(routeDetails.getName());
            route.setSourceLocation(routeDetails.getSourceLocation());
            route.setDestinationLocation(routeDetails.getDestinationLocation());
            route.setDistanceKm(routeDetails.getDistanceKm());
            return ResponseEntity.ok(routeRepository.save(route));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Hapus Rute
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable UUID id) {
        if (!routeRepository.existsById(id)) return ResponseEntity.notFound().build();
        routeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}