package com.apartment.society.controller;

import com.apartment.society.model.*;
import com.apartment.society.repository.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {
    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder encoder;

    public ResidentController(UserRepository userRepository, FlatRepository flatRepository, PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.encoder = encoder;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AppUser> getAll() {
        return userRepository.findByRole(Role.RESIDENT);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AppUser create(@RequestBody ResidentRequest request) {
        Flat flat = flatRepository.findById(request.flatId()).orElseThrow();
        AppUser user = new AppUser(
                request.name(), request.email(), encoder.encode(request.password()),
                Role.RESIDENT, flat);
        return userRepository.save(user);
    }


    @GetMapping("/me")
    public AppUser me() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AppUser update(@PathVariable Long id, @RequestBody ResidentRequest request) {
        AppUser user = userRepository.findById(id).orElseThrow();
        Flat flat = flatRepository.findById(request.flatId()).orElseThrow();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setFlat(flat);
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(encoder.encode(request.password()));
        }
        return userRepository.save(user);
    }

    public record ResidentRequest(String name, String email, String password, Long flatId) {}
}
