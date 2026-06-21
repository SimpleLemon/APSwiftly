module.exports = {
name: "kick",
type: "interaction",
prototype: "slash",
$if: "old",
info: {
    description: "Kick User",
    perms: ["`kickmembers,sendmessages`"]
	},
code:`
$if[$isUserDmEnabled[$slashOption[user]]==true]
$interactionReply[{ephemeral}{interaction}{newEmbed:{description:<#COLON#Checkmark#COLON#1370802219900735658> **$username[$slashOption[user]] has been kicked.**}{footer:User was sent a DM message}{color:00FF00}}]
$kick[$guildID;$slashOption[user];By $username[$authorID] for $replaceText[$if[$slashOption[reason]==;] No Reason Given $else $slashOption[reason] $endif;;]]
$sendDm[{newEmbed:{title:Kicked}{description:You have been **kicked** from $guildName.
Reason#COLON# $replaceText[$if[$slashOption[reason]==] No Reason Given $else $slashOption[reason] $endif;;]}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]
$else
$interactionReply[{ephemeral}{interaction}{newEmbed:{description:<#COLON#Checkmark#COLON#1370802219900735658> **$username[$slashOption[user]] has been kicked.**}{footer:User was not sent a DM message}{color:00FF00}}]
$kick[$guildID;$slashOption[user];By $username[$authorID] for $replaceText[$if[$slashOption[reason]==] No Reason Given $else $slashOption[reason] $endif;;]]
$endif

$onlyIf[$rolePosition[$userHighestRole[$authorID]]<$rolePosition[$userHighestRole[$slashOption[user]]];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:The user you are trying to kick has a higher role position!}}]
$onlyIf[$rolePosition[$userHighestRole[$clientID]]<$rolePosition[$userHighestRole[$slashOption[user]]];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:I do not have a high enough role position to kick this user!}}]
$onlyIf[$guildOwnerID!=$slashOption[user];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:The user you are trying to kick is the server owner!}}]
$onlyIf[$memberExists[$slashOption[user];$guildID]==true;{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Member does not exist!}{color:FF0000}{description:The user you are trying to kick is not in this Guild.}}]
$onlyIf[$slashOption[user]!=$authorID;<:Cross:1346672729675403437> You can't kick yourself genius.
{ephemeral}
{interaction}]
$onlyIf[$hasPerms[$guildID;$authorID;kickmembers]==true;{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:You don't have \`kick\` permissions required to use this command!}}]
`
}

// $createApplicationCommand[global;kick;Kick a member;KickMembers;guild;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User to kick",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "reason",
//     "description": "Reason for kick"
//   }
// ]]