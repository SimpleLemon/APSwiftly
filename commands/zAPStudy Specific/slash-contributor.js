module.exports = [{
	name: "contributor",
	info: {
    description: "Create a Channel with a contributor",
    perms: ["`SendMessages,ManageChannels`"]
	},
    type: "interaction",
    prototype: "slash",
	code:`
$interactionFollowUp[{newEmbed:{title:Success!}{description:<@!$authorID> has added <@!$slashOption[user]> to <#$get[channel]>}{color:00FF00}}]

$sendDm[{newEmbed:{title:Application Decision}{description:Congratulations! You have been selected to participate in the APStudy Contributor Program! Your application has impressed the selection committee and you are now given the opportunity to create notes and manage your own AP subject page on APStudy.

**Here are your next steps:**
1. Visit <#$get[channel]> and confirm your acceptance and responsibilities as an APStudy Contributor Program member.
2. Tasks and assignments will be open to you shortly after we recieve your acceptance, please make sure you are checking your Discord regularly!

Congratulations and welcome to the APStudy Contributor team! We are thrilled to work with you and if you have any questions, please contact <@!$authorID>

Sincerely,
APStudy Contributor Team}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]

$let[messageid;$channelSendMessage[$get[channel];Hello <@!$slashOption[user]>
{newEmbed:{description:Derek Chen (Founder) | <@!784527187453542440>
Tristan Lee (Director) | <@!1199894139446247526>
Ryon Tom (Manager) | <@!1226697393219567657>
Max F. (Asst. Manager) | <@!1501045455386312804>}{color:7dfdff}}
{actionRow:{button:Update Info:secondary:ainfo:false}};false]]
$modifyChannelPerms[$get[channel];1519016533005832332;+viewchannel]
$modifyChannelPerms[$get[channel];$slashOption[user];+viewchannel]
$wait[2s]
$let[channel;$createChannel[$guildID;$slashOption[channelname];Text;true;1356279309169328158]]
$suppressErrors[{newEmbed:{title:Something went wrong!}{color:FF0000}{description:Please try again later.}}
{ephemeral}
{interaction}]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You are missing \`Administrator\` permissions needed to run this command!}}
{ephemeral}
{interaction}]
$interactionDefer[true]
`
}, {
name: "ainfo",
type: "interaction",
prototype: "button",
code: `
$interactionModal[APStudy Contributor Information;ainfomodal;
  {actionRow:
    {textInput:Name:1:nameInput:true:User's name}
  }
  {actionRow:
    {textInput:Email:1:emailInput:true:User's email address}
  }
  {actionRow:
    {textInput:Public Name:1:publicInput:true:User's Public Name}
  }
  {actionRow:
    {textInput:Response:1:responseInput:true:User's average response time}
  }
  {actionRow:
    {textInput:Other:2:otherInput:false:Anything else}
  }
]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You are missing \`Administrator\` permissions needed to run this command!}}
{ephemeral}
{interaction}]
`
}, {
name: "ainfomodal",
type: "interaction",
prototype: "modal",
code: `
$interactionReply[Success!;users;true;false]
$pinMessage[$get[id]]
$let[id;$sendMessage[{newEmbed:{description:\`\`\`Name#COLON# $textInputValue[nameInput]\`\`\`\`\`\`Email#COLON# $textInputValue[emailInput]\`\`\`\`\`\`Public Name#COLON# $textInputValue[publicInput]\`\`\`\`\`\`Response Time#COLON# $textInputValue[responseInput]\`\`\`\`\`\`Other Name#COLON# $textInputValue[otherInput]\`\`\`
-# Updated by <@!$authorID>}
{color:7dfdff}};true]]
`
}];

// $createApplicationCommand[global;contributor;Add an APStudy contributor;Administrator;guild;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "Contributor @ User",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "channelname",
//     "description": "Channel Name (ap-coursename)",
//     "required": true
//   }
// ]]