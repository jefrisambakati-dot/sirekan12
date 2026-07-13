package com.example.demo.service;

import com.example.demo.model.Driver;
import com.example.demo.model.DriverRegistrationDto;
import com.example.demo.model.User;
import com.example.demo.repository.DriverRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriverServiceTest {

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DriverService driverService;

    @Test
    void shouldRegisterDriverWithAccount() {
        UUID companyId = UUID.randomUUID();

        DriverRegistrationDto dto = new DriverRegistrationDto();
        dto.setName("Mawar Driver");
        dto.setEmail("mawar.driver@example.com");
        dto.setPassword("securePass123");
        dto.setLicenseNumber("DR1234567");
        dto.setPhone("081234567890");
        dto.setStatus("ACTIVE");
        dto.setCompanyId(companyId);

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setUsername(dto.getEmail());
        savedUser.setEmail(dto.getEmail());
        savedUser.setFullName(dto.getName());
        savedUser.setPassword(dto.getPassword());
        savedUser.setRole("DRIVER");
        savedUser.setCompanyId(companyId);

        Driver savedDriver = new Driver();
        savedDriver.setId(UUID.randomUUID());
        savedDriver.setName(dto.getName());
        savedDriver.setLicenseNumber(dto.getLicenseNumber());
        savedDriver.setPhone(dto.getPhone());
        savedDriver.setStatus(dto.getStatus());
        savedDriver.setCompanyId(companyId);
        savedDriver.setUser(savedUser);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(driverRepository.save(any(Driver.class))).thenReturn(savedDriver);

        Driver result = driverService.registerDriverWithAccount(dto);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(savedDriver.getId());
        assertThat(result.getName()).isEqualTo(dto.getName());
        assertThat(result.getLicenseNumber()).isEqualTo(dto.getLicenseNumber());
        assertThat(result.getPhone()).isEqualTo(dto.getPhone());
        assertThat(result.getStatus()).isEqualTo(dto.getStatus());
        assertThat(result.getCompanyId()).isEqualTo(companyId);
        assertThat(result.getUser()).isNotNull();
        assertThat(result.getUser().getEmail()).isEqualTo(dto.getEmail());
        assertThat(result.getUser().getRole()).isEqualTo("DRIVER");

        verify(userRepository).save(any(User.class));
        verify(driverRepository).save(any(Driver.class));
    }
}
