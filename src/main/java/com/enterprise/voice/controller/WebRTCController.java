package com.enterprise.voice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.enterprise.voice.dto.WebRTCSignal;

@Controller
public class WebRTCController {

    private static final String TOPIC = "/topic/webrtc-";

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/webrtc/offer")
    public void handleOffer(@Payload WebRTCSignal signal) {
        // Forward offer to the receiver (agent)
        messagingTemplate.convertAndSend(TOPIC + signal.getReceiverId(), signal);
    }

    @MessageMapping("/webrtc/answer")
    public void handleAnswer(@Payload WebRTCSignal signal) {
        // Forward answer back to the original caller (customer)
        messagingTemplate.convertAndSend(TOPIC + signal.getReceiverId(), signal);
    }

    @MessageMapping("/webrtc/ice-candidate")
    public void handleIceCandidate(@Payload WebRTCSignal signal) {
        // Forward ICE candidate to the other peer
        messagingTemplate.convertAndSend(TOPIC + signal.getReceiverId(), signal);
    }

    @MessageMapping("/webrtc/end-call")
    public void handleEndCall(@Payload WebRTCSignal signal) {
        // Notify the other peer that the call ended
        messagingTemplate.convertAndSend(TOPIC + signal.getReceiverId(), signal);
    }
}