package com.apartment.society.controller;

import com.apartment.society.model.Flat;
import com.apartment.society.repository.FlatRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/flats")
public class FlatController {
    private final FlatRepository repository;

    public FlatController(FlatRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Flat> getAll() { return repository.findAll(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Flat create(@RequestBody Flat flat) { return repository.save(flat); }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Flat update(@PathVariable Long id, @RequestBody Flat data) {
        Flat flat = repository.findById(id).orElseThrow();
        flat.setFlatNumber(data.getFlatNumber());
        flat.setBlock(data.getBlock());
        flat.setFloor(data.getFloor());
        flat.setType(data.getType());
        return repository.save(flat);
    }
}
