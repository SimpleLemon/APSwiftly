module.exports = [{
name: "Message delete Logs",
type: "messageDelete",
$if: "old",
channel: "$getGuildVar[msgeventschannel]",
code: `$author[$username[$authorID];$authorAvatar]
$title[Message deleted in #$channelName[$channelID]]
$description[$message

Message ID: $messageID
]
$footer[User ID: $authorID]
$addTimestamp
$color[Red]
$if[$getGuildVar[includebots]==false]
$onlyIf[$isBot==false;]
$endif
$onlyIf[$message!=;]
$onlyIf[$authorID!=$clientID;]
$onlyIf[$hasPermsInChannel[$getGuildVar[msgeventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[msgeventschannel]]==true;]
$onlyIf[$getGuildVar[msgeventschannel]!=none;]
$onlyIf[$guildID==$guildID;]
`
},{
    name: "Message update Logs",
    type: "messageUpdate",
    $if: "old",
channel: "$getGuildVar[msgeventschannel]",
code: `
$ifAwaited[$charCount[$message]>=4096||$charCount[$oldMessage]>=4096;{execute:msgeditlogfilemode};{execute:msgeditlogembedmode}]

$if[$getGuildVar[includebots]==false]
$onlyIf[$isBot==false;]
$endif
$onlyIf[$getGuildVar[msgdeletelog]==on;]
$onlyIf[$oldMessage!=||$message!=;]
$onlyIf[$oldMessage!=$message;]
$onlyIf[$hasEmbeds[$messageID;$channelID]==false;]
$onlyIf[$authorID!=$clientID;]
$onlyIf[$hasPermsInChannel[$getGuildVar[msgeventschannel];$clientID;viewchannel;sendmessages]==true;]
$onlyIf[$guildChannelExists[$guildID;$getGuildVar[msgeventschannel]]==true;]
$onlyIf[$getGuildVar[msgeventschannel]!=none;]
$onlyIf[$guildID==$guildID;]
`
}]