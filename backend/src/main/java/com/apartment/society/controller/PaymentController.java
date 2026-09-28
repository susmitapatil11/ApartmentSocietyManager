package com.apartment.society.controller;

import com.apartment.society.dto.PaymentRequest;
import com.apartment.society.model.*;
import com.apartment.society.repository.*;
import com.apartment.society.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository paymentRepository;
    private final FlatRepository flatRepository;
    private final BillRepository billRepository;
    private final CurrentUserService currentUser;

    public PaymentController(PaymentRepository paymentRepository, FlatRepository flatRepository,
                             BillRepository billRepository, CurrentUserService currentUser) {
        this.paymentRepository = paymentRepository;
        this.flatRepository = flatRepository;
        this.billRepository = billRepository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Payment> getPayments() {
        AppUser user = currentUser.getCurrentUser();
        if (user.getRole() == Role.ADMIN) return paymentRepository.findAll();
        return paymentRepository.findByFlatId(user.getFlat().getId());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Payment create(@RequestBody PaymentRequest request) {
        Flat flat = flatRepository.findById(request.flatId()).orElseThrow();
        MaintenanceBill bill = request.billId() == null ? null :
                billRepository.findById(request.billId()).orElseThrow();

        Payment payment = new Payment();
        payment.setFlat(flat);
        payment.setBill(bill);
        payment.setAmount(request.amount());
        payment.setPaymentDate(request.paymentDate());
        payment.setMode(request.mode());
        payment.setReferenceNumber(request.referenceNumber());

        if (bill != null) {
            bill.setStatus(PaymentStatus.PAID);
            billRepository.save(bill);
        }

        return paymentRepository.save(payment);
    }
}
