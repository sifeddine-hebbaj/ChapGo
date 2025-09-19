package com.chat.chat.dto;

public class UserSummaryDto {
    private Long id;
    private String name;
    private String avatar;
    private Boolean online;

    public UserSummaryDto() {}

    public UserSummaryDto(Long id, String name, String avatar, Boolean online) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.online = online;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public Boolean getOnline() { return online; }
    public void setOnline(Boolean online) { this.online = online; }
}
