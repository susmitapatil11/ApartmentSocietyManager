package com.apartment.society.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(Long flatId, Long billId, BigDecimal amount, LocalDate paymentDate,
                             String mode, String referenceNumber) {}
