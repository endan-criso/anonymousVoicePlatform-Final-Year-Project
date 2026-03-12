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
     * ROOT CAUSE FIX for "call not working":
     *
     * convertAndSendToUser(userId, destination, payload) resolves the user via
     * Spring Security's principal name — which is the USERNAME (e.g. "john"),
     * NOT the numeric userId (e.g. "42"). Your JwtAuthenticationFilter sets the
     * principal to the username, so convertAndSendToUser("42", ...) never matches
     * any connected client and the signal is silently dropped.
     *
     * SOLUTION: Use convertAndSend() to a deterministic per-user topic:
     *   /topic/webrtc-{userId}
     *
     * Each client subscribes to /topic/webrtc-{theirOwnId} on connect.
     * This is explicit, reliable, and works regardless of how the principal is named.
     */
    private static final String WEBRTC_TOPIC_PREFIX = "/topic/webrtc-";

    @MessageMapping("/webrtc/offer")
    public void handleOffer(@Payload WebRTCSignal signal) {
        CallPermissionRequest permissionRequest = new CallPermissionRequest();
        permissionRequest.setTicketId(Long.parseLong(signal.getTicketId()));
        permissionRequest.setCallerId(signal.getSenderId());
        permissionRequest.setReceiverId(signal.getReceiverId());

        CallPermissionResponse permission = callService.validateCallPermission(permissionRequest);

        if (Boolean.TRUE.equals(permission.getAllowed())) {
            // Send offer to the receiver's personal topic
            messagingTemplate.convertAndSend(
                    WEBRTC_TOPIC_PREFIX + signal.getReceiverId(),
                    signal
            );
        } else {
            // Send error back to the caller's personal topic
            WebRTCSignal errorSignal = new WebRTCSignal();
            errorSignal.setType("error");
            errorSignal.setData(permission.getMessage());
            messagingTemplate.convertAndSend(
                    WEBRTC_TOPIC_PREFIX + signal.getSenderId(),
                    errorSignal
            );
        }
    }

    @MessageMapping("/webrtc/answer")
    public void handleAnswer(@Payload WebRTCSignal signal) {
        // signal.getReceiverId() is the original caller's ID (set by the answerer)
        messagingTemplate.convertAndSend(
                WEBRTC_TOPIC_PREFIX + signal.getReceiverId(),
                signal
        );
    }

    @MessageMapping("/webrtc/ice-candidate")
    public void handleIceCandidate(@Payload WebRTCSignal signal) {
        messagingTemplate.convertAndSend(
                WEBRTC_TOPIC_PREFIX + signal.getReceiverId(),
                signal
        );
    }

    @MessageMapping("/webrtc/end-call")
    public void handleEndCall(@Payload WebRTCSignal signal) {
        messagingTemplate.convertAndSend(
                WEBRTC_TOPIC_PREFIX + signal.getReceiverId(),
                signal
        );
    }
}