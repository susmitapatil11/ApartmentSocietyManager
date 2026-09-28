package com.apartment.society.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Flat flat;

    @ManyToOne
    private MaintenanceBill bill;

    private BigDecimal amount;
    private LocalDate paymentDate;
    private String mode;
    private String referenceNumber;

    public Payment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Flat getFlat() { return flat; }
    public void setFlat(Flat flat) { this.flat = flat; }
    public MaintenanceBill getBill() { return bill; }
    public void setBill(MaintenanceBill bill) { this.bill = bill; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
}
