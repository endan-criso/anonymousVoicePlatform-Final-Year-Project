package com.enterprise.voice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallLogResponse {

    // Numeric DB id — also used as callLogId by the JS poller
    private Long   id;

    // FIX: was missing entirely from the response — JS poller reads c.callLogId
    private Long   callLogId;

    private String ticketId;

    // Numeric DB ids — needed by the JS receiverId filter
    private Long   callerId;
    private Long   receiverId;

    // Anonymous display ids — what the real backend was sending instead of the above
    private String callerAnonymousId;
    private String receiverAnonymousId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long          duration;
    private Boolean       wasSuccessful;

    // FIX: was missing from the response — JS poller reads c.callStatus
    private String callStatus;
}