package com.enterprise.voice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCSignal {
    
    private String type; // "offer", "answer", "ice-candidate"
    private String ticketId;
    private Long senderId;
    private Long receiverId;
    private Object data; // SDP offer/answer or ICE candidate
    private String sessionId;
}

