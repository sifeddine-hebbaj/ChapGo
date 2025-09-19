package com.chat.chat.controller;

import com.chat.chat.dto.ChatMessage;
import com.chat.chat.mapper.MessageMapper;
import com.chat.chat.model.Message;
import com.chat.chat.service.ConversationService;
import com.chat.chat.service.MessageService;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatRestController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final UserRepository userRepository;

    @GetMapping("/conversations")
    public ResponseEntity<?> conversations() {
        return ResponseEntity.ok(conversationService.all());
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<?> conversation(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.get(id));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<ChatMessage>> messages(@PathVariable Long id) {
        List<ChatMessage> dto = messageService.getMessages(id).stream().map(MessageMapper::toDto).toList();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ChatMessage> send(@PathVariable Long id, @RequestBody ChatMessage inbound) {
        Message.Type type = inbound.getType() == null ? Message.Type.TEXT : Message.Type.valueOf(inbound.getType().toUpperCase());
        Message saved = messageService.sendMessage(id, Long.valueOf(inbound.getSenderId()), inbound.getText(), type, inbound.getMediaUrl());
        ChatMessage dto = MessageMapper.toDto(saved);
        return ResponseEntity.created(URI.create("/api/conversations/" + id + "/messages/" + dto.getId())).body(dto);
    }

    @PostMapping("/conversations/with/{userId}")
    public ResponseEntity<Map<String, Object>> with(@PathVariable Long userId, Authentication authentication) {
        String email = authentication.getName();
        Long meId = userRepository.findByEmail(email).orElseThrow().getId();
        var conv = conversationService.findOrCreateDirect(meId, userId);
        return ResponseEntity.ok(Map.of("id", conv.getId()));
    }
}
