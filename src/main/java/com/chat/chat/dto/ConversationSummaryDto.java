package com.chat.chat.dto;

public class ConversationSummaryDto {
    private Long conversationId;
    private UserSummaryDto counterpart;
    private MessageSummaryDto lastMessage;
    private String lastActivityAt; // ISO string
    private Integer unreadCount;

    public ConversationSummaryDto() {}

    public ConversationSummaryDto(Long conversationId, UserSummaryDto counterpart, MessageSummaryDto lastMessage, String lastActivityAt, Integer unreadCount) {
        this.conversationId = conversationId;
        this.counterpart = counterpart;
        this.lastMessage = lastMessage;
        this.lastActivityAt = lastActivityAt;
        this.unreadCount = unreadCount;
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public UserSummaryDto getCounterpart() { return counterpart; }
    public void setCounterpart(UserSummaryDto counterpart) { this.counterpart = counterpart; }

    public MessageSummaryDto getLastMessage() { return lastMessage; }
    public void setLastMessage(MessageSummaryDto lastMessage) { this.lastMessage = lastMessage; }

    public String getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(String lastActivityAt) { this.lastActivityAt = lastActivityAt; }

    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }
}
