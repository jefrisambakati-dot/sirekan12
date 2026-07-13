package com.example.demo.controller;

import com.example.demo.model.Company;
import com.example.demo.model.EntityOptionDTO;
import com.example.demo.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepository;

    // 1. Get All: Mengambil semua data
    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    // 2. Get Dropdown: Mengambil data ringkas untuk select-box
    @GetMapping("/dropdown")
    public ResponseEntity<List<EntityOptionDTO>> getCompanyDropdown() {
        List<EntityOptionDTO> dropdownList = companyRepository.findAll().stream()
                .map(c -> new EntityOptionDTO(c.getId(), c.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dropdownList);
    }

    // 3. Create: Tambah data baru
    @PostMapping
    public ResponseEntity<Company> createCompany(@RequestBody Company company) {
        return ResponseEntity.ok(companyRepository.save(company));
    }

    // 4. Update: Perbarui data
    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable UUID id, @RequestBody Company companyDetails) {
        return companyRepository.findById(id).map(c -> {
            c.setName(companyDetails.getName()); // Sesuaikan field sesuai model
            return ResponseEntity.ok(companyRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. Delete: Hapus data
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable UUID id) {
        if (!companyRepository.existsById(id)) return ResponseEntity.notFound().build();
        companyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}