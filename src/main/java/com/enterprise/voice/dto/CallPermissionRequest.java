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
    private String ticketId;
}