package com.example.demo.controller;

import com.example.demo.model.Alert;
import com.example.demo.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    @PostMapping
    public Alert createAlert(@RequestBody Alert alert) {
        if (alert.getTimestamp() == null) {
            alert.setTimestamp(java.time.LocalDateTime.now());
        }
        return alertRepository.save(alert);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable UUID id) {
        return alertRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Alert> updateAlert(@PathVariable UUID id, @RequestBody Alert alertDetails) {
        return alertRepository.findById(id).map(alert -> {
            alert.setMessage(alertDetails.getMessage());
            alert.setStatus(alertDetails.getStatus());
            return ResponseEntity.ok(alertRepository.save(alert));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable UUID id) {
        return alertRepository.findById(id).map(alert -> {
            alertRepository.delete(alert);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}