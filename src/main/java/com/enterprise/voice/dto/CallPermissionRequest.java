package com.enterprise.voice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallPermissionRequest {
    
    @NotNull(message = "Ticket ID is required")
    private Long ticketId;
    
    @NotNull(message = "Caller ID is required")
    private Long callerId;
    
    @NotNull(message = "Receiver ID is required")
    private Long receiverId;
}

