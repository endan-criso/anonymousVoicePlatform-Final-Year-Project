package com.enterprise.voice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    
    private Long id;
    private String ticketId;
    private String subject;
    private String description;
    private String status;
    private String customerAnonymousId;
    private String productId;
    private String assignedAgentAnonymousId;
    private LocalDateTime createdAt;
    private LocalDateTime assignedAt;
    private LocalDateTime closedAt;
    private Boolean callAllowed;
}

