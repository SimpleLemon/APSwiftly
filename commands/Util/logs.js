module.exports = {
    name: "logs",
    info: {
        description: "Setup Logs available of the bot.",
        perms: ["`SendMessages`"]
    },
	aliases: ['logging','logs-setup','setup-logs','logging-setup'],
    code: `
$sendMessage[{newEmbed:{title:Logging}{description:**Channel Selection#COLON#**
Message Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[msgeventschannel]>]
Server Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]
Member Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[membereventschannel]>]
Voice Events#COLON# \`Soon!\`

**Settings#COLON#**
Include Bots in Message Logs#COLON# \`$advancedReplaceText[$getGuildVar[includebots];on;True;off;False]\`

Edit server logging using the dropdown menu below!}{color:$getVar[embedcolor]}}

{actionRow:{selectMenu:setuplogsmenu_$authorID:⚙️ Configure server logging:1:1:false:{stringInput:Message Events:msgeventlogs:Configure message logs:false}{stringInput:Server Events:servereventlogs:Configure server edit logs:false}{stringInput:Member Events:membereventlogs:Configure member logs:false}}}
]
$onlyPerms[managechannels;You do not have \`ManageChannels\` permission to use this.]
$cooldown[3s; Slow down! Don't spam the command!
Time remaining: <t:$truncate[$divide[$sum[$getCooldownTime[3s;user;setup-logs;$authorID];$dateStamp];1000]]:R>]
`
}
