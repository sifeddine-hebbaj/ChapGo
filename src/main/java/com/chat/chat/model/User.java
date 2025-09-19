package com.chat.chat.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // Comma-separated roles, e.g. "USER,ADMIN"
    @Column(nullable = false)
    private String roles;

    private String avatar;

    private boolean online;

    private String statusMessage;
    
    @Column(name = "phone_number")
    private String phoneNumber;

    @ManyToMany(mappedBy = "participants")
    @Builder.Default
    private Set<Conversation> conversations = new HashSet<>();
}
