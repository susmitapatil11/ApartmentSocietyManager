package com.apartment.society.controller;

import com.apartment.society.dto.*;
import com.apartment.society.model.*;
import com.apartment.society.repository.ComplaintRepository;
import com.apartment.society.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {
    private final ComplaintRepository repository;
    private final CurrentUserService currentUser;

    public ComplaintController(ComplaintRepository repository, CurrentUserService currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Complaint> getAll() {
        AppUser user = currentUser.getCurrentUser();
        if (user.getRole() == Role.ADMIN) return repository.findAll();
        return repository.findByResidentId(user.getId());
    }

    @PostMapping
    public Complaint create(@RequestBody ComplaintRequest request) {
        AppUser user = currentUser.getCurrentUser();
        Complaint complaint = new Complaint();
        complaint.setResident(user);
        complaint.setTitle(request.title());
        complaint.setDescription(request.description());
        complaint.setStatus(ComplaintStatus.OPEN);
        return repository.save(complaint);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Complaint updateStatus(@PathVariable Long id, @RequestBody ComplaintStatusRequest request) {
        Complaint complaint = repository.findById(id).orElseThrow();
        complaint.setStatus(request.status());
        return repository.save(complaint);
    }
}
