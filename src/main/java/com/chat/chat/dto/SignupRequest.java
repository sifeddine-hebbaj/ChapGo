package com.chat.chat.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private String avatar; // optionnel
}
