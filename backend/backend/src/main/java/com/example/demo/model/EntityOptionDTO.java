package com.example.demo.model;

import java.util.UUID;

public class EntityOptionDTO {
    private UUID id;
    private String name;

    // 1. No-Argument Constructor (Wajib ada untuk framework JSON/Jackson)
    public EntityOptionDTO() {
    }

    // 2. All-Arguments Constructor
    public EntityOptionDTO(UUID id, String name) {
        this.id = id;
        this.name = name;
    }

    // 3. Getters
    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    // 4. Setters
    public void setId(UUID id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }
}