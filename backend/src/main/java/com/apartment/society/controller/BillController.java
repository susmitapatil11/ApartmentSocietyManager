package com.apartment.society.controller;

import com.apartment.society.dto.BillRequest;
import com.apartment.society.model.*;
import com.apartment.society.repository.*;
import com.apartment.society.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {
    private final BillRepository billRepository;
    private final FlatRepository flatRepository;
    private final CurrentUserService currentUser;

    public BillController(BillRepository billRepository, FlatRepository flatRepository, CurrentUserService currentUser) {
        this.billRepository = billRepository;
        this.flatRepository = flatRepository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<MaintenanceBill> getBills() {
        AppUser user = currentUser.getCurrentUser();
        if (user.getRole() == Role.ADMIN) return billRepository.findAll();
        return billRepository.findByFlatId(user.getFlat().getId());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MaintenanceBill create(@RequestBody BillRequest request) {
        Flat flat = flatRepository.findById(request.flatId()).orElseThrow();
        MaintenanceBill bill = new MaintenanceBill();
        bill.setFlat(flat);
        bill.setMonth(request.month());
        bill.setAmount(request.amount());
        bill.setDueDate(request.dueDate());
        bill.setStatus(PaymentStatus.PENDING);
        return billRepository.save(bill);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public MaintenanceBill status(@PathVariable Long id, @RequestParam PaymentStatus status) {
        MaintenanceBill bill = billRepository.findById(id).orElseThrow();
        bill.setStatus(status);
        return billRepository.save(bill);
    }
}
