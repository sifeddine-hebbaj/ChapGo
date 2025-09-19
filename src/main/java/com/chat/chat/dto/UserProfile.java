package com.chat.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {
    private Long id;
    private String name;
    private String email;
    private String avatar;
    private String statusMessage;
    private boolean online;
}
