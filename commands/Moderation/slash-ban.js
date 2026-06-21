module.exports = {
name: "ban",
type: "interaction",
prototype: "slash",
$if: "old",
info: {
    description: "Ban User",
    perms: ["`banmembers,sendmessages`"]
	},
code:`
$if[$isUserDmEnabled[$slashOption[user]]==true]
$interactionReply[{ephemeral}{interaction}{newEmbed:{description:<#COLON#Checkmark#COLON#1370802219900735658> **$username[$slashOption[user]] has been banned.**}{footer:User was sent a DM message}{color:00FF00}}]
$ban[$guildID;$slashOption[user];$replaceText[$if[$slashOption[preserve_messages]==;false] 7 $else 0 $endif;;];By $username[$authorID] for $replaceText[$if[$slashOption[reason]==;] No Reason Given $else $slashOption[reason] $endif;;]]
$sendDm[{newEmbed:{title:Banned}{description:You have been **banned** from $guildName.
Reason#COLON# $replaceText[$if[$slashOption[reason]==] No Reason Given $else $slashOption[reason] $endif;;]}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}{button:Appeal:link:https\\:dyno.gg/form/a704d734:false}};$slashOption[user]]
$else
$interactionReply[{ephemeral}{interaction}{newEmbed:{description:<#COLON#Checkmark#COLON#1370802219900735658> **$username[$slashOption[user]] has been banned.**}{footer:User was not sent a DM message}{color:00FF00}}]
$ban[$guildID;$slashOption[user];$replaceText[$if[$slashOption[preserve_messages]==false;true] 7 $else 0 $endif;;];By $username[$authorID] for $replaceText[$if[$slashOption[reason]==;] No Reason Given $else $slashOption[reason] $endif;;]]
$endif

$onlyIf[$rolePosition[$userHighestRole[$authorID]]<$rolePosition[$userHighestRole[$slashOption[user]]];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:The user you are trying to ban has a higher role position!}}]
$onlyIf[$rolePosition[$userHighestRole[$clientID]]<$rolePosition[$userHighestRole[$slashOption[user]]];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:I do not have a high enough role position to ban this user!}}]
$onlyIf[$guildOwnerID!=$slashOption[user];{ephemeral}{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:The user you are trying to ban is the server owner!}}]
$onlyIf[$slashOption[user]!=$authorID;<:Cross:1346672729675403437> You can't ban yourself genius.
{ephemeral}
{interaction}]
$onlyIf[$hasPerms[$guildID;$authorID;banmembers]==true;{interaction}{newEmbed:{title:<:Cross:1346672729675403437> Missing Permissions}{color:FF0000}{description:You don't have \`ban\` permissions required to use this command!}}]
`
}

// $createApplicationCommand[global;ban;Ban a member;BanMembers;guild;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User to ban",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "reason",
//     "description": "Reason for ban"
//   },
//   {
//     "type": 3,
//     "name": "preserve_messages",
//     "description": "Preserve user messages or not",
//     "autocomplete": true,
//     "choices": [
//       {
//         "name": "True",
//         "value": "true"
//       },
//       {
//         "name": "False",
//         "value": "false"
//       }
//     ]
//   }
// ]]