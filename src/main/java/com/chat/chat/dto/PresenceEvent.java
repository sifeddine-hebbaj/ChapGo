package com.chat.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresenceEvent {
    private String userId;
    private boolean online;
    private String statusMessage;
}
