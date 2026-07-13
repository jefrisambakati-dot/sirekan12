package com.example.demo.controller;

import com.example.demo.model.Company;
import com.example.demo.model.EntityOptionDTO;
import com.example.demo.repository.CompanyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CompanyControllerTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyController controller;

    @Test
    void shouldReturnAllCompanies() {
        Company company = new Company();
        company.setId(UUID.randomUUID());
        company.setName("Logistics Co");

        given(companyRepository.findAll()).willReturn(List.of(company));

        ResponseEntity<List<Company>> response = controller.getAllCompanies();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getName()).isEqualTo("Logistics Co");
    }

    @Test
    void shouldReturnCompanyDropdown() {
        Company companyA = new Company();
        companyA.setId(UUID.randomUUID());
        companyA.setName("Alpha Logistics");

        Company companyB = new Company();
        companyB.setId(UUID.randomUUID());
        companyB.setName("Beta Transport");

        given(companyRepository.findAll()).willReturn(List.of(companyA, companyB));

        ResponseEntity<List<EntityOptionDTO>> response = controller.getCompanyDropdown();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getId()).isEqualTo(companyA.getId());
        assertThat(response.getBody().get(0).getName()).isEqualTo("Alpha Logistics");
    }

    @Test
    void shouldCreateCompany() {
        Company request = new Company();
        request.setName("New Company");

        Company saved = new Company();
        saved.setId(UUID.randomUUID());
        saved.setName("New Company");

        given(companyRepository.save(any(Company.class))).willReturn(saved);

        ResponseEntity<Company> response = controller.createCompany(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(saved.getId());
        assertThat(response.getBody().getName()).isEqualTo("New Company");
    }

    @Test
    void shouldUpdateCompanyWhenExists() {
        UUID companyId = UUID.randomUUID();
        Company existing = new Company();
        existing.setId(companyId);
        existing.setName("Old Name");

        Company updatedDetails = new Company();
        updatedDetails.setName("Updated Name");

        Company saved = new Company();
        saved.setId(companyId);
        saved.setName("Updated Name");

        given(companyRepository.findById(companyId)).willReturn(Optional.of(existing));
        given(companyRepository.save(any(Company.class))).willReturn(saved);

        ResponseEntity<Company> response = controller.updateCompany(companyId, updatedDetails);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getName()).isEqualTo("Updated Name");
    }

    @Test
    void shouldReturnNotFoundWhenUpdateMissing() {
        UUID companyId = UUID.randomUUID();
        Company updatedDetails = new Company();
        updatedDetails.setName("Updated Name");

        given(companyRepository.findById(companyId)).willReturn(Optional.empty());

        ResponseEntity<Company> response = controller.updateCompany(companyId, updatedDetails);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void shouldDeleteCompanyWhenExists() {
        UUID companyId = UUID.randomUUID();

        given(companyRepository.existsById(companyId)).willReturn(true);

        ResponseEntity<Void> response = controller.deleteCompany(companyId);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(companyRepository).deleteById(companyId);
    }

    @Test
    void shouldReturnNotFoundWhenDeleteMissing() {
        UUID companyId = UUID.randomUUID();
        given(companyRepository.existsById(companyId)).willReturn(false);

        ResponseEntity<Void> response = controller.deleteCompany(companyId);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }
}
