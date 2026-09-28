package com.apartment.society.model;

import jakarta.persistence.*;

@Entity
@Table(name = "flats")
public class Flat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String flatNumber;

    private String block;
    private Integer floor;
    private String type;

    public Flat() {}

    public Flat(String flatNumber, String block, Integer floor, String type) {
        this.flatNumber = flatNumber;
        this.block = block;
        this.floor = floor;
        this.type = type;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }
    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
