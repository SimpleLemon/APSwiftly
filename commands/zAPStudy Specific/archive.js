module.exports = {
	name: "archive",
	info: {
		description: "Archive the current channel with an optional reason",
		perms: ["`Role: 1319501912638226543`"]
	},
	code: `$editChannel[$channelID;{"parent":"1287225603615096885"}]
$sendMessage[{newEmbed:{title:Channel Archived}{description:$if[$message==;If you would like this reopened, please ping ( <@!784527187453542440> );$message]}{timestamp}{color:00d8ff}}]
$onlyForRoles[1319501912638226543;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You do not have the required role to archive this channel.}}]
$onlyForGuilds[859910344393883710;]
`
}
