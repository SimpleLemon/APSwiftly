module.exports = {
	name: "senddm",
    type: "interaction",
    prototype: "slash",
	$if: "old",
    info: {
    description: "Send DM message to user."
    },
	code:`
$if[$isUserDmEnabled[$slashOption[user]]==true]
$interactionReply[{newEmbed:{title:Success!}{description:You have sent <@!$slashOption[user]> a DM message}{color:00FF00}}]
$sendDm[{newEmbed:{title:Message from $username[$authorID]}{description:\`\`\`$slashOption[message]\`\`\`
Sent from $guildName[$guildID]}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]
$else
$interactionReply[{newEmbed:{title:Failed!}{description:<@!$slashOption[user]> does not have their DMs open.}{color:red}}]
$endif

$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;You are missing \`Administrator\` permissions needed to run this command!
{ephemeral}
{interaction}]
`
}

// $createApplicationCommand[global;senddm;Send DM message to user.;Administrator;guild,user;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "message",
//     "description": "Message to send",
//     "required": true
//   }
// ]]