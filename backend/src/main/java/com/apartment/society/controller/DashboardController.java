package com.apartment.society.controller;

import com.apartment.society.model.*;
import com.apartment.society.repository.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final FlatRepository flats;
    private final UserRepository users;
    private final BillRepository bills;
    private final ComplaintRepository complaints;
    private final ExpenseRepository expenses;

    public DashboardController(FlatRepository flats, UserRepository users, BillRepository bills,
                                ComplaintRepository complaints, ExpenseRepository expenses) {
        this.flats = flats;
        this.users = users;
        this.bills = bills;
        this.complaints = complaints;
        this.expenses = expenses;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> dashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("flats", flats.count());
        data.put("residents", users.findByRole(Role.RESIDENT).size());
        data.put("bills", bills.count());
        data.put("pendingBills", bills.findAll().stream()
                .filter(b -> b.getStatus() == PaymentStatus.PENDING).count());
        data.put("complaints", complaints.count());
        data.put("openComplaints", complaints.findAll().stream()
                .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED).count());
        data.put("expenses", expenses.count());
        data.put("expenseAmount", expenses.findAll().stream()
                .map(Expense::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return data;
    }
}
