package com.enterprise.voice.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.enterprise.voice.dto.CallStatusResponse;
import com.enterprise.voice.model.Ticket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.enterprise.voice.dto.CallLogResponse;
import com.enterprise.voice.dto.CallPermissionRequest;
import com.enterprise.voice.dto.CallPermissionResponse;
import com.enterprise.voice.model.CallLog;
import com.enterprise.voice.repository.TicketRepository;
import com.enterprise.voice.security.UserPrincipal;
import com.enterprise.voice.service.CallService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/calls")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CallController {

    @Autowired
    private CallService callService;

    @Autowired
    private TicketRepository ticketRepository;

    // ── POST /api/calls/validate ──────────────────────────────────────────────

    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> validateCallPermission(
            @Valid @RequestBody CallPermissionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Ticket ticket = ticketRepository.findByTicketId(request.getTicketId()).orElse(null);
            if (ticket == null) {
                return ResponseEntity.badRequest().body("Ticket not found");
            }
            if (ticket.getAssignedAgent() == null) {
                return ResponseEntity.badRequest().body("No agent assigned to this ticket");
            }

            CallPermissionResponse response = callService.validateCallPermission(
                    request.getTicketId(),
                    currentUser.getId(),
                    ticket.getAssignedAgent().getId());

            if (!response.getAllowed()) {
                return ResponseEntity.badRequest().body(response.getMessage());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── POST /api/calls/initiate ──────────────────────────────────────────────

    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> initiateCall(
            @Valid @RequestBody CallPermissionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Ticket ticket = ticketRepository.findByTicketId(request.getTicketId()).orElse(null);
            if (ticket == null) {
                return ResponseEntity.badRequest().body("Ticket not found");
            }
            if (ticket.getAssignedAgent() == null) {
                return ResponseEntity.badRequest().body("No assigned agent for this ticket");
            }

            CallLog callLog = callService.initiateCall(
                    request.getTicketId(),
                    currentUser.getId(),
                    ticket.getAssignedAgent().getId());

            // "id" is what the JS reads: voiceState.callLogId = data.id
            Map<String, Object> response = new HashMap<>();
            response.put("id", callLog.getId());
            response.put("callLogId", callLog.getId());
            response.put("message", "Call initiated successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // Used by the CUSTOMER's poll loop to check if the agent answered.

    // BUG: original code called callService.getCallById() which returns a raw
    // CallLog entity, then immediately accessed call.getTicket().getTicketId()
    // in the controller method body — outside any transaction. Since ticket is
    // LAZY, this throws LazyInitializationException → HTTP 500 → the customer's
    // polling loop hits "if (!pollRes.ok) return" and never transitions to ACTIVE.
    //
    // Fix: getCallById() is now @Transactional(readOnly=true) in CallService,
    // so the session stays open while the controller accesses the lazy fields.
    // The controller itself stays clean — no @Transactional needed here because
    // service method covers it.

    @GetMapping("/{callLogId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT')")
    public ResponseEntity<?> getCall(@PathVariable Long callLogId) {
        try {
            CallLog call = callService.getCallById(callLogId);

            CallStatusResponse res = new CallStatusResponse();
            res.setCallLogId(call.getId());
            res.setCallStatus(call.getCallStatus().name());
            res.setTicketId(call.getTicket().getTicketId()); // safe — service is @Transactional

            return ResponseEntity.ok(res);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/calls/{callLogId}/accept ─────────────────────────────────────

    @PutMapping("/{callLogId}/accept")
    @PreAuthorize("hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> acceptCall(@PathVariable Long callLogId) {
        try {
            CallLog callLog = callService.acceptCall(callLogId);

            Map<String, Object> response = new HashMap<>();
            response.put("callLogId", callLog.getId());
            response.put("callStatus", callLog.getCallStatus().name());
            response.put("message", "Call accepted");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/calls/{callLogId}/reject ─────────────────────────────────────

    @PutMapping("/{callLogId}/reject")
    @PreAuthorize("hasRole('COMPANY_AGENT')")
    public ResponseEntity<?> rejectCall(@PathVariable Long callLogId) {
        try {
            CallLog callLog = callService.rejectCall(callLogId);

            Map<String, Object> response = new HashMap<>();
            response.put("callLogId", callLog.getId());
            response.put("callStatus", callLog.getCallStatus().name());
            response.put("message", "Call rejected");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/calls/{callLogId}/end ────────────────────────────────────────

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

    // ── GET /api/calls/ticket/{ticketDbId} ────────────────────────────────────

    @GetMapping("/ticket/{ticketDbId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'COMPANY_AGENT', 'ADMIN')")
    public ResponseEntity<?> getCallLogsByTicket(@PathVariable Long ticketDbId) {
        try {
            List<CallLogResponse> response = callService.getCallLogsByTicket(ticketDbId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── GET /api/calls/my-calls ───────────────────────────────────────────────

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

    // ── GET /api/calls/user/{userId} ──────────────────────────────────────────

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