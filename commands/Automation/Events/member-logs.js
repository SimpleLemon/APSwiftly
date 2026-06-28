module.exports = [{
name: "Welcomer message",
type: "join",
channel: "$getGuildVar[welcomechannel]",
code: `$ifAwaited[$charCount[$getGuildVar[welcomemessage]]>=2000||$getGuildVar[welcometype]==embed;{execute:welcomerembedmode};{execute:welcomertextmode}]

$onlyIf[$hasPermsInChannel[$getGuildVar[welcomechannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[welcomechannel]]==true;]
$onlyIf[$getGuildVar[welcomechannel]!=none;]
$let[content;$advancedReplaceText[$nonEscape[$getGuildVar[welcomemessage]];<server.totalMembers>;$membersCount;<username>;$username;<mention>;<@$authorID>;<id>;$authorID;<owner.username>;$username[$guildOwnerID];<server.name>;$guildName;<owner.id>;$guildOwnerID;<server.id>;$guildID;<creationdate>;$creationDate[$authorID;date];<position>;$ordinal[$memberJoinPosition];<Displayname>;$userDisplayName]]
$onlyIf[$getGuildVar[welcomesystem]==on;]
$disableMentionType[roles]
$disableMentionType[everyone]
$onlyIf[$guildID==$guildID;]`
},{
    name: "Leave message",
    type: "leave",
    channel: "$getGuildVar[leavechannel]",
    code: `$ifAwaited[$charCount[$getGuildVar[leavemessage]]>=2000||$getGuildVar[leavetype]==embed;{execute:leaveembedmode};{execute:leavetextmode}]


$onlyIf[$hasPermsInChannel[$getGuildVar[leavechannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[leavechannel]]==true;]
$onlyIf[$getGuildVar[leavechannel]!=none;]
$let[content;$advancedReplaceText[$nonEscape[$getGuildVar[leavemessage]];<server.totalMembers>;$membersCount;<username>;$username;<mention>;<@$authorID>;<id>;$authorID;<owner.username>;$username[$guildOwnerID];<server.name>;$guildName;<owner.id>;$guildOwnerID;<server.id>;$guildID;<creationdate>;$creationDate[$authorID;date];<position>;$ordinal[$memberJoinPosition];<leave.time>;<t:$truncate[$divide[$datestamp;1000]]:f>;<Displayname>;$userDisplayName]]
$onlyIf[$getGuildVar[leavesystem]==on;]
$disableMentionType[roles]
$disableMentionType[everyone]
$onlyIf[$guildID==$guildID;]`
},{
    name: "Member Nickname Update",
    type: "memberUpdate",
    channel: "$getGuildVar[membereventschannel]",
    code: `
$author[$username[$authorID];$authorAvatar]
$title[Nickname Change]
$description[**Before#COLON#** $oldMember[nick]
**After#COLON#** $newMember[nick]
]
$footer[User ID: $authorID]
$addTimestamp
$color[Blue]

$onlyIf[$getGuildVar[nicknameupdatelog]==on;]
$onlyIf[$newMember[nick]!=$oldMember[nick];]
$onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have Member Update logs work, I must have \`ViewAuditLog\` permission!]
$onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
$onlyIf[$getGuildVar[membereventschannel]!=none;]
$onlyIf[$guildID==$guildID;]`
},{
    name: "Member Name Update",
    type: "memberUpdate",
    channel: "$getGuildVar[membereventschannel]",
    code: `
$author[$username[$authorID];$authorAvatar]
$title[Name Change]
$description[**Before#COLON#** $oldMember[name]
**After#COLON#** $newMember[name]
]
$footer[User ID: $authorID]
$addTimestamp
$color[Blue]

$onlyIf[$getGuildVar[nameupdatelog]==on;]
$onlyIf[$newMember[name]!=$oldMember[name];]
$onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have Member Update logs work, I must have \`ViewAuditLog\` permission!]
$onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
$onlyIf[$getGuildVar[membereventschannel]!=none;]
$onlyIf[$guildID==$guildID;]`
},{
    name: "Member Role Added",
    type: "memberUpdate",
    channel: "$getGuildVar[membereventschannel]",
    code: `
$author[$username[$authorID];$authorAvatar]
$title[Role Added]
$description[$newMember[addedRoles]
]
$footer[User ID: $authorID]
$addTimestamp
$color[Blue]

$onlyIf[$getGuildVar[roleuserslog]==on;]
$onlyIf[$newMember[addedRoles]!=;]
$onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have Member Update logs work, I must have \`ViewAuditLog\` permission!]
$onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
$onlyIf[$getGuildVar[membereventschannel]!=none;]
$onlyIf[$guildID==$guildID;]`
},{
    name: "Member Role Removed",
    type: "memberUpdate",
    channel: "$getGuildVar[membereventschannel]",
    code: `
$author[$username[$authorID];$authorAvatar]
$title[Role Removed]
$description[$oldMember[removedRoles]
]
$footer[User ID: $authorID]
$addTimestamp
$color[Blue]

$onlyIf[$getGuildVar[roleuserslog]==on;]
$onlyIf[$oldMember[removedRoles]!=;]
$onlyIf[$hasPerms[$guildID;$clientID;viewauditlog]==true;In order to have Member Update logs work, I must have \`ViewAuditLog\` permission!]
$onlyIf[$hasPermsInChannel[$getGuildVar[membereventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[membereventschannel]]==true;]
$onlyIf[$getGuildVar[membereventschannel]!=none;]
$onlyIf[$guildID==$guildID;]`
}]
