module.exports = {
    name: "cheater",
    info: {
        description: "Stop cheaters",
        perms: ["`ManageMessages`"]
    },
    code: `
$deletemessage[$get[id]]
$sendMessage[# 💀 Are we serious right now?
- Are we really trying to cheat in a public AP discord server?
- Consider reflecting on what you just did.
-# <@!$referenceUserId>
{reply:$get[id]:true}]
$let[id;$referenceMessageId]
$deleteCommand
$onlyPerms[managemessages;<:Cross:1346672729675403437> This Command is Only for Staff Members!]
$cooldown[3s; Slow down! Don't spam the command!]
`
}