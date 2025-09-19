package com.chat.chat.dto;

public class MessageSummaryDto {
    private Long id;
    private String text;
    private Long senderId;
    private String timestamp; // ISO string

    public MessageSummaryDto() {}

    public MessageSummaryDto(Long id, String text, Long senderId, String timestamp) {
        this.id = id;
        this.text = text;
        this.senderId = senderId;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
