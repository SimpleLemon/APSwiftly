module.exports = {
    name: "noad",
    info: {
        description: "Stop advertisements",
        perms: ["`ManageMessages`"]
    },
    code: `
$deletemessage[$get[id]]
$sendMessage[# ⚠️ Advertisements are not allowed!
- Do not promote any product, service, or have anyone DM you for them.
- To partner or buy a paid promotion channel, DM <@!784527187453542440>.
-# <@!$referenceUserId>
{reply:$get[id]:true}]
$let[id;$referenceMessageId]
$deleteCommand
$onlyPerms[managemessages;<:Cross:1346672729675403437> This Command is Only for Staff Members!]
$cooldown[3s; Slow down! Don't spam the command!]
`
}