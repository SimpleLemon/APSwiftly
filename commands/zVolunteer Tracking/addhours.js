module.exports = ({
name: "addhours",
aliases: ['hoursadd'],
code: `
$color[00ff00]
$title[<a:tada:1324589971746586714> Volunteer Hours Added]
$description[<@!$authorID> added $message[2] hours to <@!$mentioned[1]>. They now have \`$getGlobalUserVar[hours;$mentioned[1];custom]\` hours.]
$reply
$wait[1s]
$setGlobalUserVar[hours;$sum[$getGlobalUserVar[hours;$mentioned[1];custom];$message[2]];$mentioned[1];custom]
$onlyIf[$message[1]!=;{newEmbed:{title:Incorrect Usage}{description:Please enter a valid number.}{color:Red}}]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You are missing \`Administrator\` permissions needed to run this command!}}]
$suppressErrors[{newEmbed:{title:Incorrect Usage}{color:FF0000}{description:**Usage:**
\`addhours [user] [amount]\`}}]
$onlyForGuilds[859910344393883710;You tried.]
`
 }) 