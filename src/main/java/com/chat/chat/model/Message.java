package com.chat.chat.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String text;

    @ManyToOne(optional = false)
    private User sender;

    @ManyToOne(optional = false)
    private Conversation conversation;

    private Instant timestamp;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private Type type;

    @ManyToOne
    private Media media;

    public enum Status { SENT, DELIVERED, READ }
    public enum Type { TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, PDF }
}
