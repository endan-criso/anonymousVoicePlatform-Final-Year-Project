package com.enterprise.voice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallPermissionResponse {
    
    private Boolean allowed;
    private String message;
    private String ticketId;
    private String sessionToken; // Token for WebRTC session
}

