package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/dropdown")
public class DropdownController {

    @Autowired private DriverRepository driverRepo;
    @Autowired private VehicleRepository vehicleRepo;
    @Autowired private CompanyRepository companyRepo;

    @GetMapping
    public DropdownDTO getAllData() {
        return new DropdownDTO(
            driverRepo.findAll(),
            vehicleRepo.findAll(),
            companyRepo.findAll()
        );
    }
}