module.exports = [{
	name: "checkin",
	info: {
    description: "Check-in Reminder",
    perms: ["`SendMessages,ManageChannels`", "`Administrator`", "`Role: 1519016533005832332`"]
	},
	code:`
$setChannelVar[checkintimeoutid;$setTimeout[checkinTimeout;$math[$parseTime[$message[1]]/1000]s;{"channelID": "$channelID"};true];$channelID;custom]
$setChannelVar[checkinid;$get[checkinmessageid];$channelID;custom]
$let[checkinmessageid;$sendMessage[{newEmbed:{title:Check-In Scheduled in $message[1]}{description:Did you finish early? Click the 🔔 button.
To cancel this check in, press ❌}{color:00FF00}{reply}}
{actionRow:{button:Early Check-In:primary:earlycheckin:false:🔔}{button::primary:cancelcheckin:false:❌}};true]]
$onlyIf[$parseTime[$message[1]]<=1814400000;{newEmbed:{title:Incorrect Usage}{description:The maximum time limit is 21 days!}{color:Red}}]
$onlyIf[$parseTime[$message[1]]!=-1;{newEmbed:{title:Incorrect Usage}{description:Enter a valid time with format like \`1m/1d/1h\`}{color:Red}}]
$onlyIf[$getChannelVar[checkinid;$channelID;custom]==;{newEmbed:{title:A Check-In is already running}{description:Cancel the old check-in before creating a new one!}{color:Red}}]
$onlyIf[$or[$hasPerms[$guildID;$authorID;administrator]==true;$hasRoles[$guildID;$authorID;1519016533005832332]==true];{newEmbed:{title:Missing Permissions}{color:FF0000}{description:You need \`Administrator\` or the <@&1519016533005832332> role to run this command.}}]
$onlyForCategories[1356279309169328158;{newEmbed:{title:Error}{color:FF0000}{description:This command cannot be used here!}}]
`
}, {
	name: "checkinTimeout",
	type: "timeout",
	code: `
$setChannelVar[checkinid;;$timeoutData[channelID];custom]
$editmessage[$getChannelVar[checkinid;$timeoutData[channelID];custom];{newEmbed:{title:Reminder Sent}{description:Check-In reminder has been sent!}{color:545454}}{actionRow:{button:Early Check-In:primary:earlycheckin:true:🔔}{button::primary:cancelcheckin:true:❌}};$timeoutData[channelID]]
$channelSendMessage[$timeoutData[channelID];<@&1258652618482389014> {newEmbed:{title:This is the Scheduled Check-In}{color:52f757}{description:How are your notes going\?
Do you have any questions for the APStudy representatives\?}};false]
`
}, {
    name: "cancelcheckin",
    type: "interaction",
    prototype: "button",
    code: `
$setChannelVar[checkinid;;$channelID;custom]
$interactionReply[You have canceled this check-in!;users;true]
$stopTimeout[$getChannelVar[checkintimeoutid;$channelID;custom]]
$editmessage[$getChannelVar[checkinid;$channelID;custom];{newEmbed:{title:Canceled!}{description:Check-in Reminder has been canceled by <@!$authorID>}{color:545454}}{actionRow:{button:Canceled:2:cancelcheckin:true:❌}}]`
} , {
    name: "earlycheckin",
    type: "interaction",
    prototype: "button",
    code: `
$setChannelVar[checkinid;;$channelID;custom]
$stopTimeout[$getChannelVar[checkintimeoutid;$channelID;custom]]
$interactionReply[<@&1258652618482389014> {newEmbed:{title:This is the Scheduled Check-In}{color:52f757}{description:How are your notes going\?
Do you have any questions for the APStudy representatives\?}};users;false]
$editmessage[$getChannelVar[checkinid;$channelID;custom];{newEmbed:{title:Check-In Sent Early}{description:Check-In reminder has been sent early by <@!$authorID>}{color:545454}}{actionRow:{button:Sent Early:2:earlycheckin:true:🔔}}]`
}];