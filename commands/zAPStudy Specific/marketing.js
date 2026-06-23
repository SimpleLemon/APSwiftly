module.exports = {
	name: "marketing",
	info: {
    description: "Create a Channel with a marketer",
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
$sendDm[{newEmbed:{title:APStudy Internship Update}{description:Thank you for filling out the APStudy Intern Checklist form.

**Here are your next steps:**
1. Visit <#$get[channel]> to understand your responsibilities as an APStudy Marketing Program member.
2. Information and assignments will be open to you shortly after you recieve this message, please make sure you are checking your Discord regularly!

Congratulations and welcome to the APStudy Marketing team! We are thrilled to work with you and if you have any questions, please contact <@!$authorID>

Sincerely,
APStudy Contributor Team}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$mentioned[1]]
$modifyChannelPerms[$get[channel];1519016533005832332;+viewchannel]
$modifyChannelPerms[$get[channel];$mentioned[1];+viewchannel]
$wait[2s]
$let[channel;$createChannel[$guildID;marketing-$username[$mentioned[1]];Text;true;1356279309169328158]]
$suppressErrors[{newEmbed:{title:Something went wrong!}{color:FF0000}{description:Please try again later.}}]
$onlyIf[$message[1]!=;{newEmbed:{title:Incorrect Usage}{color:FF0000}{description:**Usage:**
\`contributor [user] [channel name]\`}}]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You are missing \`Administrator\` permissions needed to run this command!}}]
`
}