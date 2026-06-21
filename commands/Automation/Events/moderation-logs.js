module.exports = [{
    name: "Ban Logs",
    type: "banAdd",
    channel: "$getGuildVar[membereventschannel]",
    code: `
    $author[Member banned!;$userAvatar;$userAvatar]
    $description[
**$get[accounttype]:** $username <@$authorID>
**Moderator:** $get[moderatorchecker]
**Reason:** $get[reason]
    ]
    $footer[ID: $authorID]
    $addTimeStamp
    $color[Red]
    $let[moderatorchecker;$advancedReplaceText[$checkCondition[$isBot[$get[staff]]==false&&$getGuildVar[anonymous]==on];true;Unknown;false;$username[$get[staff]] <@$get[staff]>]]
    $let[reason;$advancedReplaceText[$checkCondition[$getAuditLogs[$guildID;;1;22;{reason}]==null];true;none;false;$getAuditLogs[$guildID;;1;22;{reason}]]]
    $let[staff;$getAuditLogs[$guildID;;1;22;{executor.id}]]
    $let[accounttype;$advancedReplaceText[$checkCondition[$isBot==true];true;Bot;false;User]]
	$onlyIf[$getGuildVar[banneduserslog]==on;]
    $onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have ban logs work, i must have \`ViewAuditLog\` permission!]
    $onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
    $onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
    $onlyIf[$getGuildVar[membereventschannel]!=none;]
    $onlyIf[$guildID==$guildID;]
    `
    },{
        name: "Un-Ban Logs",
        type: "banRemove",
        channel: "$getGuildVar[membereventschannel]",
        code: `$author[Member unbanned!;$userAvatar;$userAvatar]
    $description[
**$get[accounttype]:** $username <@$authorID>
**Moderator:** $get[moderator] $if[$getAuditLogs[$guildID;;1;23;{reason}]!=null;
**Reason:** $getAuditLogs[$guildID;;1;23;{reason}]
]
    ]
    $footer[ID: $authorID]
    $addTimeStamp
    $color[DarkGreen]
    $let[moderator;$username[$get[staff]] <@$get[staff]>]
    $let[staff;$getAuditLogs[$guildID;;1;23;{executor.id}]]
    $let[accounttype;$advancedReplaceText[$checkCondition[$isBot==true];true;Bot;false;User]]
	$onlyIf[$getGuildVar[unbanneduserslog]==on;]
    $onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have un-ban logs work, i must have \`ViewAuditLog\` permission!]
    $onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
    $onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
    $onlyIf[$getGuildVar[membereventschannel]!=none;]
    $onlyIf[$guildID==$guildID;]
    
    `
    }]
