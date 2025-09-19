package com.chat.chat.mapper;

import com.chat.chat.dto.ChatMessage;
import com.chat.chat.model.Message;

public class MessageMapper {

    public static ChatMessage toDto(Message message) {
        if (message == null) return null;
        return ChatMessage.builder()
                .id(String.valueOf(message.getId()))
                .text(message.getText())
                .senderId(String.valueOf(message.getSender().getId()))
                .senderName(message.getSender() != null ? message.getSender().getName() : null)
                .conversationId(String.valueOf(message.getConversation().getId()))
                .conversationName(message.getConversation() != null ? message.getConversation().getName() : null)
                .timestamp(message.getTimestamp())
                .status(message.getStatus() == null ? "sent" : message.getStatus().name().toLowerCase())
                .type(message.getType() == null ? "text" : message.getType().name().toLowerCase())
                .mediaUrl(message.getMedia() != null ? message.getMedia().getUrl() != null ? message.getMedia().getUrl() : null : null)
                .build();
    }
}
