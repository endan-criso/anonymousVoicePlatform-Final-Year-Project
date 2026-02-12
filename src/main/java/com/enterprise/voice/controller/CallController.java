package com.enterprise.voice.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.enterprise.voice.dto.CallLogResponse;
import com.enterprise.voice.dto.CallPermissionRequest;
import com.enterprise.voice.dto.CallPermissionResponse;
import com.enterprise.voice.model.CallLog;
import com.enterprise.voice.security.UserPrincipal;
import com.enterprise.voice.service.CallService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/calls")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CallController {

    @Autowired
    private CallService callService;

    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> validateCallPermission(@Valid @RequestBody CallPermissionRequest request) {
        try {
            CallPermissionResponse response = callService.validateCallPermission(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> initiateCall(
            @RequestParam Long ticketId,
            @RequestParam Long receiverId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            CallLog callLog = callService.initiateCall(ticketId, currentUser.getId(), receiverId);
            Map<String, Object> response = new HashMap<>();
            response.put("callLogId", callLog.getId());
            response.put("message", "Call initiated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{callLogId}/end")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> endCall(
            @PathVariable Long callLogId,
            @RequestParam boolean wasSuccessful,
            @RequestParam(required = false) String notes) {
        try {
            CallLog callLog = callService.endCall(callLogId, wasSuccessful, notes);
            Map<String, Object> response = new HashMap<>();
            response.put("callLogId", callLog.getId());
            response.put("duration", callLog.getDuration());
            response.put("message", "Call ended successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/ticket/{ticketId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getCallLogsByTicket(@PathVariable Long ticketId) {
        try {
            List<CallLogResponse> response = callService.getCallLogsByTicket(ticketId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-calls")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> getMyCalls(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            List<CallLogResponse> response = callService.getCallLogsByUser(currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getCallLogsByUser(@PathVariable Long userId) {
        try {
            List<CallLogResponse> response = callService.getCallLogsByUser(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
