package com.apartment.society.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillRequest(Long flatId, String month, BigDecimal amount, LocalDate dueDate) {}
