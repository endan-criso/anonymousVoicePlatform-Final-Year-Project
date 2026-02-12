package com.enterprise.voice.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    
    private Long id;
    private String productId;
    private String productName;
    private String description;
    private Boolean isActive;
    private String customerAnonymousId; // Don't expose real customer info
    private LocalDateTime registeredAt;
    private LocalDateTime createdAt;
}

