package com.chat.chat.dto;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private String id; // String to align with frontend, map from Long
    private String text;
    private String senderId;
    private String senderName;
    private String conversationId;
    private String conversationName;
    private Instant timestamp;
    private String status; // sent | delivered | read
    private String type;   // text | image | video
    private String mediaUrl;
}
