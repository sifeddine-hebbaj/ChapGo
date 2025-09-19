package com.chat.chat.controller;

import com.chat.chat.dto.ChatMessage;
import com.chat.chat.dto.ReadReceipt;
import com.chat.chat.dto.TypingEvent;
import com.chat.chat.mapper.MessageMapper;
import com.chat.chat.model.Message;
import com.chat.chat.service.MessageService;
import com.chat.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final PresenceService presenceService;

    @MessageMapping("/chat.send/{conversationId}")
    @Transactional
    public void send(@DestinationVariable String conversationId, @Payload ChatMessage inbound) {
        Long convId = Long.valueOf(conversationId);
        Long senderId = inbound.getSenderId() == null ? null : Long.valueOf(inbound.getSenderId());
        Message.Type type = inbound.getType() == null ? Message.Type.TEXT : Message.Type.valueOf(inbound.getType().toUpperCase());
        Message saved = messageService.sendMessage(convId, senderId, inbound.getText(), type, inbound.getMediaUrl());
        ChatMessage dto = MessageMapper.toDto(saved);
        // Ensure conversationId is present on the DTO for clients relying on it
        if (dto.getConversationId() == null) {
            dto.setConversationId(String.valueOf(convId));
        }

        // 1) Broadcast to the conversation topic (clients inside the conversation)
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);

        // 2) Publish per-user inbox notifications for participants other than the sender
        if (saved.getConversation() != null && saved.getConversation().getParticipants() != null) {
            for (var user : saved.getConversation().getParticipants()) {
                if (user == null || user.getId() == null) continue;
                if (senderId != null && user.getId().equals(senderId)) continue; // don't notify the sender
                messagingTemplate.convertAndSend("/topic/users/" + user.getId() + "/messages", dto);
            }
        }
    }

    @MessageMapping("/chat.typing/{conversationId}")
    public void typing(@DestinationVariable String conversationId, @Payload TypingEvent event) {
        Long convId = Long.valueOf(conversationId);
        Long userId = Long.valueOf(event.getUserId());
        presenceService.setTyping(convId, userId, event.isTyping());
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/typing", event);
    }

    @MessageMapping("/chat.read")
    public void read(@Payload ReadReceipt receipt) {
        if (receipt.getMessageId() != null) {
            try {
                Long messageId = Long.valueOf(receipt.getMessageId());
                messageService.markRead(messageId);
            } catch (NumberFormatException ignored) {}
        }
        messagingTemplate.convertAndSend("/topic/conversations/" + receipt.getConversationId() + "/read", receipt);
    }
}
