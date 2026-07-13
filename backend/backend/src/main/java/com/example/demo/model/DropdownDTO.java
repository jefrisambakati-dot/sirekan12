package com.example.demo.model;

import java.util.List;

public class DropdownDTO {
    private List<Driver> drivers;
    private List<Vehicle> vehicles;
    private List<Company> companies;

    public DropdownDTO(List<Driver> drivers, List<Vehicle> vehicles, List<Company> companies) {
        this.drivers = drivers;
        this.vehicles = vehicles;
        this.companies = companies;
    }

    // Getters
    public List<Driver> getDrivers() { return drivers; }
    public List<Vehicle> getVehicles() { return vehicles; }
    public List<Company> getCompanies() { return companies; }

    // Setters
    public void setDrivers(List<Driver> drivers) { this.drivers = drivers; }
    public void setVehicles(List<Vehicle> vehicles) { this.vehicles = vehicles; }
    public void setCompanies(List<Company> companies) { this.companies = companies; }
}