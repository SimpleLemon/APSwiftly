module.exports = [{
	name: "noreply",
	type: "interaction",
	prototype: "slash",
	$if: "old",
	info: {
		description: "Send a no-reply channel reminder DM to a user.",
		perms: ["`Role: 1519016533005832332`"]
	},
	code: `
$if[$isUserDmEnabled[$slashOption[user]]==true]
$interactionReply[{newEmbed:{title:Success!}{description:You have sent <@!$slashOption[user]> a DM message}{color:00FF00}}]
$sendDm[{newEmbed:{title:Message from $username[$authorID]}{description:Please check <#$channelID> as soon as you can!
Sent from $guildName[$guildID]}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]
$else
$interactionReply[{newEmbed:{title:Failed!}{description:<@!$slashOption[user]> does not have their DMs open.}{color:red}}]
$endif

$onlyForRoles[1519016533005832332;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You need the <@&1519016533005832332> role to run this command.}}
{ephemeral}
{interaction}]
$onlyForCategories[1356279309169328158;{newEmbed:{title:Error}{color:FF0000}{description:This command cannot be used here!}}
{ephemeral}
{interaction}]
$onlyForGuilds[859910344393883710;You tried.
{ephemeral}
{interaction}]
`
}, {
	name: "register-noreply-slash",
	type: "ready",
	code: `
$createApplicationCommand[859910344393883710;noreply;Send a no-reply channel reminder DM.;false;guild;guild;slash;[
  {
    "type": 6,
    "name": "user",
    "description": "User",
    "required": true
  }
]]
`
}];

// Manual registration (guild-only; run once if the ready handler did not register):
// $createApplicationCommand[859910344393883710;noreply;Send a no-reply channel reminder DM.;false;guild;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User",
//     "required": true
//   }
// ]]
