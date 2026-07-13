package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 1. GERBANG UTAMA LOGIN (Satu pintu untuk Admin & Driver)
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body("Email dan Password wajib diisi!");
        }

        // Mencari user berdasarkan email menggunakan method baru di UserRepository
        return userRepository.findByEmail(email.trim())
                .map(user -> {
                    // Validasi kecocokan password teks biasa
                    if (user.getPassword().equals(password)) {
                        return ResponseEntity.ok(user); // Mengembalikan object user lengkap (id, role, fullName, dll)
                    } else {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kata sandi salah!");
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email tidak terdaftar dalam sistem logistik!"));
    }

    // 2. GET ALL USERS (Untuk Dashboard Admin melihat daftar semua akun)
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 3. CREATE USER (Untuk Admin mendaftarkan akun Driver atau Admin baru)
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    // 4. GET USER BY ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. UPDATE USER (Sudah mendukung pembaruan nama lengkap dan ID perusahaan vendor)
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());
            user.setPassword(userDetails.getPassword());
            user.setRole(userDetails.getRole());
            user.setFullName(userDetails.getFullName());   // Sinkronisasi kolom baru Supabase
            user.setCompanyId(userDetails.getCompanyId()); // Sinkronisasi relasi vendor
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 6. DELETE USER
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}