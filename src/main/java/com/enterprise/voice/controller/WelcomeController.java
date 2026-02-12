package com.enterprise.voice.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WelcomeController {

    @GetMapping("/api/info")
    public Map<String, Object> welcome() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "online");
        response.put("message", "Anonymous Voice Communication Platform API");
        response.put("version", "1.0.0");
        response.put("javaVersion", "21");
        response.put("endpoints", Map.of(
                "auth", "/api/auth (POST /register, /login)",
                "products", "/api/products",
                "tickets", "/api/tickets",
                "calls", "/api/calls",
                "webrtc", "/api/webrtc",
                "websocket", "/ws",
                "h2-console", "/h2-console"));
        return response;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("java", "21");
        return response;
    }
}
