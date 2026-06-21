
module.exports = {
    name: "join",
    info: {
        description: "Become APStudy Volunteer/Contributor",
        perms: ["`SendMessages`"]
    },
    code: `
$sendMessage[{newEmbed:{title:Volunteer for APStudy}{color:FFD700}{reply:$get[id]:true}}{actionRow:{button:Apply Here!:link:https#COLON#//forms.gle/R2LMVDcugiPwJFJZ9:false:🔗}}
{reply:$get[id]:true}]
$let[id;$referenceMessageId]
$cooldown[3s; Slow down! Don't spam the command!]
`
}