module.exports = {
	name: "addhours",
    type: "interaction",
    prototype: "slash",
    info: {
    description: "Add volunteer hours to user.",
    perms: ["`Administrator`", "`Role: 1519016533005832332`"]
    },
	code:`
$setGlobalUserVar[hours;$sum[$getGlobalUserVar[hours;$slashOption[user];custom];$slashOption[hours]];$slashOption[user];custom]
$logVolunteerHours[$slashOption[user];$slashOption[hours];$authorID]
$interactionReply[{newEmbed:{color:00ff00}{title:<a:tada:1324589971746586714> Volunteer Hours Added}{description:<@!$authorID> added \`$slashOption[hours]\` to <@!$slashOption[user]>. They now have \`$getGlobalUserVar[hours;$slashOption[user];custom]\` hours.}}]
$sendDm[{newEmbed:{title:Volunteer Hours Update}{description:<@!$authorID> gave you \`$slashOption[hours]\` hour(s).
You now have \`$getGlobalUserVar[hours;$slashOption[user];custom]\` hour(s).}{color:White}}{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]
$onlyIf[$or[$hasPerms[$guildID;$authorID;administrator]==true;$hasRoles[$guildID;$authorID;1519016533005832332]==true];{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You need \`Administrator\` or the <@&1519016533005832332> role to run this command.}}
{ephemeral}
{interaction}]
$onlyForGuilds[859910344393883710;You tried.
{ephemeral}
{interaction}]
`
}

// $createApplicationCommand[global;addhours;Add volunteer hours to user.;Administrator;guild;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User",
//     "required": true
//   },
//   {
//     "type": 4,
//     "name": "hours",
//     "description": "Hours",
//     "required": true
//   }
// ]]
