module.exports = {
    name: "scam",
    info: {
        description: "Stop scammers",
        perms: ["`ManageMessages`"]
    },
    code: `
$deletemessage[$get[id]]
$sendMessage[# 💀 Get a real job.
- Are you really trying to scam random people on the internet?
- Consider reflecting on what you just did.
-# <@!$referenceUserId>
{reply:$get[id]:true}]
$let[id;$referenceMessageId]
$deleteCommand
$onlyPerms[managemessages;<:Cross:1346672729675403437> This Command is Only for Staff Members!]
`
}