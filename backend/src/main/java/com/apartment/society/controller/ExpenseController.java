package com.apartment.society.controller;

import com.apartment.society.dto.ExpenseRequest;
import com.apartment.society.model.Expense;
import com.apartment.society.repository.ExpenseRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseRepository repository;

    public ExpenseController(ExpenseRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Expense> getAll() { return repository.findAll(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Expense create(@RequestBody ExpenseRequest request) {
        Expense expense = new Expense();
        expense.setTitle(request.title());
        expense.setCategory(request.category());
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setDescription(request.description());
        return repository.save(expense);
    }
}
