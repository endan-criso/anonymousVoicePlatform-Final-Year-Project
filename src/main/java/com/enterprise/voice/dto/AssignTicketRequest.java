package com.enterprise.voice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignTicketRequest {
    
    @NotNull(message = "Agent ID is required")
    private Long agentId;
}

