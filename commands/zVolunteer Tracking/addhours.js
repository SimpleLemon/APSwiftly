module.exports = ({
name: "addhours",
aliases: ['hoursadd'],
info: {
    perms: ["`Administrator`", "`Role: 1519016533005832332`"]
},
code: `
$setGlobalUserVar[hours;$sum[$getGlobalUserVar[hours;$mentioned[1];custom];$message[2]];$mentioned[1];custom]
$logVolunteerHours[$mentioned[1];$message[2];$authorID]
$color[00ff00]
$title[<a:tada:1324589971746586714> Volunteer Hours Added]
$description[<@!$authorID> added $message[2] hours to <@!$mentioned[1]>. They now have \`$getGlobalUserVar[hours;$mentioned[1];custom]\` hours.]
$reply
$onlyIf[$message[1]!=;{newEmbed:{title:Incorrect Usage}{description:Please enter a valid number.}{color:Red}}]
$onlyIf[$or[$hasPerms[$guildID;$authorID;administrator]==true;$hasRoles[$guildID;$authorID;1519016533005832332]==true]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You need \`Administrator\` or the <@&1519016533005832332> role to run this command.}}]
$suppressErrors[{newEmbed:{title:Incorrect Usage}{color:FF0000}{description:**Usage:**
\`addhours [user] [amount]\`}}]
$onlyForGuilds[859910344393883710;You tried.]
`
 })
