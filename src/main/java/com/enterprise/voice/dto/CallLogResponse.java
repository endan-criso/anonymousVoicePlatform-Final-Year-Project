package com.enterprise.voice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallLogResponse {
    
    private Long id;
    private String ticketId;
    private String callerAnonymousId;
    private String receiverAnonymousId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long duration; // in seconds
    private Boolean wasSuccessful;
}

