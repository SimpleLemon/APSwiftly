module.exports = [{
    name: "msgeditlogfilemode",
    type: "awaited",
    code: `$createFile[
Member: <#$authorID>
Channel: <#$channelID>
Message link: $messageURL[$messageID;$channelID]
Message ID: $messageID

Before:
$oldMessage

After:
$message

$if[$messageAttachments!=; ;Attachments:

$messageAttachments[


]]
;msgedit-logs.txt]

$useChannel[$getGuildVar[msgeventschannel]]`
},{
    name: "msgeditlogembedmode",
    type: "awaited",
    code: `$author[$username;$authorAvatar]
$title[Message edited in #$channelName[$channelID];$messageURL[$messageID;$channelID]]
$description[
**Before#COLON#** $oldMessage
**After#COLON#** $message
]
$footer[User ID: $authorID]
$color[Blue]
$addTimestamp

$useChannel[$getGuildVar[msgeventschannel]]
$onlyIf[$getGuildVar[msgeditlog]==on;]
`
}]
