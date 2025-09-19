package com.chat.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadReceipt {
    private String conversationId;
    private String messageId;
    private String readerId;
}
