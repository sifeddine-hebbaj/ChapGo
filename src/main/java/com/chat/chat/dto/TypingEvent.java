package com.chat.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingEvent {
    private String conversationId;
    private String userId;
    private boolean typing;
}
