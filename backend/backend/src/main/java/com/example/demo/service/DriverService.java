package com.example.demo.service;

import com.example.demo.model.Driver;
import com.example.demo.model.DriverRegistrationDto;
import com.example.demo.model.User;
import com.example.demo.repository.DriverRepository;
import com.example.demo.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Driver registerDriverWithAccount(DriverRegistrationDto dto) {

        // =========================
        // SIMPAN USER LOGIN
        // =========================
        User user = new User();

        user.setUsername(dto.getEmail());
        user.setEmail(dto.getEmail());
        user.setFullName(dto.getName());

        // Karena di User.java methodnya setPassword()
        user.setPassword(dto.getPassword());

        user.setRole("DRIVER");
        user.setCompanyId(dto.getCompanyId());

        User savedUser = userRepository.save(user);

        // =========================
        // SIMPAN DRIVER
        // =========================
        Driver driver = new Driver();

        driver.setName(dto.getName());
        driver.setLicenseNumber(dto.getLicenseNumber());
        driver.setPhone(dto.getPhone());
        driver.setStatus(dto.getStatus());
        driver.setCompanyId(dto.getCompanyId());

        // Hubungkan Driver dengan User
        driver.setUser(savedUser);

        return driverRepository.save(driver);
    }
}