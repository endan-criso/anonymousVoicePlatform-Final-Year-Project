package com.enterprise.voice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.enterprise.voice.dto.CallPermissionRequest;
import com.enterprise.voice.dto.CallPermissionResponse;
import com.enterprise.voice.dto.WebRTCSignal;
import com.enterprise.voice.service.CallService;

@Controller
public class WebRTCController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private CallService callService;
    
    /**
     * Handle WebRTC offer from caller
     * Client sends to: /app/webrtc/offer
     * Server broadcasts to: /queue/webrtc/{receiverId}
     */
    @MessageMapping("/webrtc/offer")
    public void handleOffer(@Payload WebRTCSignal signal) {
        // Validate call permission before forwarding offer
        CallPermissionRequest permissionRequest = new CallPermissionRequest();
        permissionRequest.setTicketId(Long.parseLong(signal.getTicketId()));
        permissionRequest.setCallerId(signal.getSenderId());
        permissionRequest.setReceiverId(signal.getReceiverId());
        
        CallPermissionResponse permission = callService.validateCallPermission(permissionRequest);
        
        if (permission.getAllowed()) {
            // Forward offer to receiver
            messagingTemplate.convertAndSend(
                "/queue/webrtc/" + signal.getReceiverId(), 
                signal
            );
        } else {
            // Send error back to sender
            WebRTCSignal errorSignal = new WebRTCSignal();
            errorSignal.setType("error");
            errorSignal.setData(permission.getMessage());
            messagingTemplate.convertAndSend(
                "/queue/webrtc/" + signal.getSenderId(),
                errorSignal
            );
        }
    }
    
    /**
     * Handle WebRTC answer from receiver
     * Client sends to: /app/webrtc/answer
     * Server broadcasts to: /queue/webrtc/{receiverId}
     */
    @MessageMapping("/webrtc/answer")
    public void handleAnswer(@Payload WebRTCSignal signal) {
        // Forward answer to original caller
        messagingTemplate.convertAndSend(
            "/queue/webrtc/" + signal.getReceiverId(),
            signal
        );
    }
    
    /**
     * Handle ICE candidates exchange
     * Client sends to: /app/webrtc/ice-candidate
     * Server broadcasts to: /queue/webrtc/{receiverId}
     */
    @MessageMapping("/webrtc/ice-candidate")
    public void handleIceCandidate(@Payload WebRTCSignal signal) {
        // Forward ICE candidate to the other peer
        messagingTemplate.convertAndSend(
            "/queue/webrtc/" + signal.getReceiverId(),
            signal
        );
    }
    
    /**
     * Handle call end signal
     * Client sends to: /app/webrtc/end-call
     * Server broadcasts to: /queue/webrtc/{receiverId}
     */
    @MessageMapping("/webrtc/end-call")
    public void handleEndCall(@Payload WebRTCSignal signal) {
        // Notify the other peer that call has ended
        messagingTemplate.convertAndSend(
            "/queue/webrtc/" + signal.getReceiverId(),
            signal
        );
    }
}

