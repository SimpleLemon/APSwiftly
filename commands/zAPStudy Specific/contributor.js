module.exports = {
	name: "contributor",
	info: {
    description: "Create a Channel with a contributor",
    perms: ["`SendMessages,ManageChannels`"]
	},
	code:`
$title[Success!]
$description[<@!$authorID> has added <@!$mentioned[1]> to <#$get[channel]>]
$color[00FF00]
$channelSendMessage[$get[channel];Hello <@!$mentioned[1]>
{newEmbed:{description:Derek Chen (Founder) | <@!784527187453542440>
Tristan Lee (Director) | <@!1199894139446247526>
Ryon Tom (Manager) | <@!1226697393219567657>
Max Fronheiser (Asst. Manager) | <@!1501045455386312804>}{color:7dfdff}};false]
$modifyChannelPerms[$get[channel];1519016533005832332;+viewchannel]
$modifyChannelPerms[$get[channel];$mentioned[1];+viewchannel]
$wait[2s]
$let[channel;$createChannel[$guildID;$message[2];Text;true;1356279309169328158]]
$suppressErrors[{newEmbed:{title:Something went wrong!}{color:FF0000}{description:Please try again later.}}]
$onlyIf[$message[1]!=;{newEmbed:{title:Incorrect Usage}{color:FF0000}{description:**Usage:**
\`contributor [user] [channel name]\`}}]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You are missing \`Administrator\` permissions needed to run this command!}}]
`
}