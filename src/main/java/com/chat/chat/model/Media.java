package com.chat.chat.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String originalName;
    private String storedName;
    private String fileType; // 'image', 'video', 'audio', 'document', 'pdf'
    private String mimeType;
    private long size;
    private String url;
    private LocalDateTime uploadTime;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "media")
    private List<Message> messages;
}
