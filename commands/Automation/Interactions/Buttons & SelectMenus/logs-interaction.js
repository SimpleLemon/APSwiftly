module.exports = [{
    type: "interaction",
    prototype: "button",
    code: `$interactionUpdate[{newEmbed:{title:Logging Menu}{description:**Channel Selection#COLON#**
Message Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[msgeventschannel]>]
Server Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]
Member Events#COLON# $advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[membereventschannel]>]
Voice Events#COLON# \`Soon!\`

**Settings#COLON#**
Include Bots in Message Logs#COLON# \`$advancedReplaceText[$getGuildVar[includebots];on;True;off;False]\`}{color:$getVar[embedcolor]}}
{actionRow:{selectMenu:setuplogsmenu_$authorID:⚙️ Configure server logging:1:1:false:{stringInput:Message Events:msgeventlogs:Configure message logs:false}{stringInput:Server Events:servereventlogs:Configure server edit logs:false}{stringInput:Member Events:membereventlogs:Configure member logs:false}}}
]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==setuplogshome;]

`
},{
// Message Events Interaction
    type: "interaction",
    prototype: "selectMenu",
    code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Message Events}{description:
**Channel#COLON#**
$get[msgeventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[msgdeletelog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Deleted Messages
> $advancedReplaceText[$checkCondition[$getGuildVar[msgeditlog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Edited Messages
}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:msgeventresetchannel_$authorID:false}}
{actionRow:{selectMenu:msgeventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:msgeventsetupmenu_$authorID:Modify logging modules:1:2:false:{stringInput:Deleted Messages:1:Toggle logging for deleted messages:false}{stringInput:Edited Messages:2:Toggle logging for edited messages:false}}}]


$let[msgeventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;No channel selected;false;<#$getGuildVar[msgeventschannel]>]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$getSelectMenuValues[all]==msgeventlogs;]
$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==setuplogsmenu;]

`
},{
// Message Events - Channel Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Message Events}{description:
**Channel#COLON#**
$get[msgeventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[msgdeletelog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Deleted Messages
> $advancedReplaceText[$checkCondition[$getGuildVar[msgeditlog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Edited Messages
}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:msgeventresetchannel_$authorID:false}}
{actionRow:{selectMenu:msgeventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:msgeventsetupmenu_$authorID:Modify logging modules:1:2:false:{stringInput:Deleted Messages:1:Toggle logging for deleted messages:false}{stringInput:Edited Messages:2:Toggle logging for edited messages:false}}}]

$let[msgeventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;No channel selected;false;<#$getGuildVar[msgeventschannel]>]]

    $setGuildVar[msgeventschannel;$getSelectMenuValues[all]]

    $onlyIf[$hasPermsInChannel[$getSelectMenuValues[all];$clientID;sendmessages;viewchannel]==true;I do not have permissions there. Please ensure that I have the following permissions in <#$getSelectMenuValues[all]>:
    \`ViewChannel\`
    \`SendMessages\`
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$getSelectMenuValues[all]!=$getGuildVar[msgeventschannel];
    This channel is already being used for Message Event logging!
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$channelType[$getSelectMenuValues[all]]==text;Only Text Channels are supported at this time.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$guildChannelExists[$guildID;$getSelectMenuValues[all]]==true;The channel you chose does not exists.
    Please set a valid channel that exists in this server.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==msgeventchannelsetupmenu;]
`
},{
// Message Events - Reset Button
        type: "interaction",
        prototype: "button",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Message Events}{description:
**Channel#COLON#**
$get[msgeventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[msgdeletelog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Deleted Messages
> $advancedReplaceText[$checkCondition[$getGuildVar[msgeditlog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Edited Messages
}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:msgeventresetchannel_$authorID:false}}
{actionRow:{selectMenu:msgeventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:msgeventsetupmenu_$authorID:Modify logging modules:1:2:false:{stringInput:Deleted Messages:1:Toggle logging for deleted messages:false}{stringInput:Edited Messages:2:Toggle logging for edited messages:false}}}]

$let[msgeventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;No channel selected;false;<#$getGuildVar[msgeventschannel]>]]

    $deleteVar[msgeventschannel;$guildID;main]

    $onlyIf[$getGuildVar[msgeventschannel]!=none;
    There's no channel to reset.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==msgeventresetchannel;]

    `
    },{
// Message Events - Module Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Message Events}{description:
**Channel#COLON#**
$get[msgeventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[msgdeletelog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Deleted Messages
> $advancedReplaceText[$checkCondition[$getGuildVar[msgeditlog]==off];true;<:box:1374183092092403782>;false;<:box_tick:1374183078158925844>] Edited Messages

ALL with seperator - $getSelectMenuValues[all;_]}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:msgeventresetchannel_$authorID:false}}
{actionRow:{selectMenu:msgeventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:msgeventsetupmenu_$authorID:Modify logging modules:1:2:false:{stringInput:Deleted Messages:1:Toggle logging for deleted messages:false}{stringInput:Edited Messages:2:Toggle logging for edited messages:false}}}]

$let[msgeventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[msgeventschannel]==none];true;No channel selected;false;<#$getGuildVar[msgeventschannel]>]]

$setGuildVar[msgdeletelog;$advancedReplaceText[$checkCondition[$getSelectMenuValues[all;_]==2];true;$getGuildVar[msgdeletelog];false;$advancedReplaceText[$checkCondition[$getGuildVar[msgdeletelog]==on];true;off;false;on]]]
$setGuildVar[msgeditlog;$advancedReplaceText[$checkCondition[$getSelectMenuValues[all;_]==1];true;$getGuildVar[msgeditlog];false;$advancedReplaceText[$checkCondition[$getGuildVar[msgeditlog]==on];true;off;false;on]]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==msgeventsetupmenu;]
    `
},{
// Member Events Interaction
    type: "interaction",
    prototype: "selectMenu",
    code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Member Events}{description:
**Channel#COLON#**
$get[membereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[roleuserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Role Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Name Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nicknameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Nickname Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[banneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Bans
> $advancedReplaceText[$checkCondition[$getGuildVar[unbanneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Unbans}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:membereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:membereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:membereventsetupmenu_$authorID:Modify logging modules:1:5:false:{stringInput:Role Updates:1:Toggle logging for role updates:false}{stringInput:Name Updates:2:Toggle logging for name updates:false}{stringInput:Nickname Updates:3:Toggle logging for nickname updates:false}{stringInput:Member Bans:4:Toggle logging for member bans:false}{stringInput:Member Unbans:5:Toggle logging for member unbans:false}}}]


$let[membereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[membereventschannel]>]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$getSelectMenuValues[all]==membereventlogs;]
$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==setuplogsmenu;]

`
},{
// Member Events - Channel Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Member Events}{description:
**Channel#COLON#**
$get[membereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[roleuserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Role Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Name Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nicknameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Nickname Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[banneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Bans
> $advancedReplaceText[$checkCondition[$getGuildVar[unbanneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Unbans}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:membereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:membereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:membereventsetupmenu_$authorID:Modify logging modules:1:5:false:{stringInput:Role Updates:1:Toggle logging for role updates:false}{stringInput:Name Updates:2:Toggle logging for name updates:false}{stringInput:Nickname Updates:3:Toggle logging for nickname updates:false}{stringInput:Member Bans:4:Toggle logging for member bans:false}{stringInput:Member Unbans:5:Toggle logging for member unbans:false}}}]

    $let[membereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;No channel selected;false;<#$getGuildVar[membereventschannel]>]]

    $setGuildVar[membereventschannel;$getSelectMenuValues[all]]

    $onlyIf[$hasPermsInChannel[$getSelectMenuValues[all];$clientID;sendmessages;viewchannel]==true;I do not have permissions there. Please ensure that I have the following permissions in <#$getSelectMenuValues[all]>:
    \`ViewChannel\`
    \`SendMessages\`
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$getSelectMenuValues[all]!=$getGuildVar[membereventschannel];
    This channel is already being used for Member Event logging!
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$channelType[$getSelectMenuValues[all]]==text;Only Text Channels are supported at this time.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$guildChannelExists[$guildID;$getSelectMenuValues[all]]==true;The channel you chose does not exists.
    Please set a valid channel that exists in this server.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==membereventchannelsetupmenu;]
    `
    },{
// Member Events - Reset Button
        type: "interaction",
        prototype: "button",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Member Events}{description:
**Channel#COLON#**
$get[membereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[roleuserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Role Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Name Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nicknameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Nickname Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[banneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Bans
> $advancedReplaceText[$checkCondition[$getGuildVar[unbanneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Unbans}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:membereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:membereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:membereventsetupmenu_$authorID:Modify logging modules:1:5:false:{stringInput:Role Updates:1:Toggle logging for role updates:false}{stringInput:Name Updates:2:Toggle logging for name updates:false}{stringInput:Nickname Updates:3:Toggle logging for nickname updates:false}{stringInput:Member Bans:4:Toggle logging for member bans:false}{stringInput:Member Unbans:5:Toggle logging for member unbans:false}}}]

    $let[membereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;No channel selected;false;<#$getGuildVar[membereventschannel]>]]

    $deleteVar[membereventschannel;$guildID;main]

    $onlyIf[$getGuildVar[membereventschannel]!=none;
    There's no channel to reset.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==membereventresetchannel;]

    `
    },{
// Member Events - Module Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Member Events}{description:
**Channel#COLON#**
$get[membereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[roleuserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Role Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Name Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[nicknameupdatelog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Nickname Updates
> $advancedReplaceText[$checkCondition[$getGuildVar[banneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Bans
> $advancedReplaceText[$checkCondition[$getGuildVar[unbanneduserslog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Member Unbans}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:membereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:membereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:membereventsetupmenu_$authorID:Modify logging modules:1:5:false:{stringInput:Role Updates:1:Toggle logging for role updates:false}{stringInput:Name Updates:2:Toggle logging for name updates:false}{stringInput:Nickname Updates:3:Toggle logging for nickname updates:false}{stringInput:Member Bans:4:Toggle logging for member bans:false}{stringInput:Member Unbans:5:Toggle logging for member unbans:false}}}]

    $let[membereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[membereventschannel]==none];true;No channel selected;false;<#$getGuildVar[membereventschannel]>]]

$setGuildVar[roleuserslog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];1];false;$getGuildVar[roleuserslog];true;$advancedReplaceText[$checkCondition[$getGuildVar[roleuserslog]==on];true;off;false;on]]]
$setGuildVar[nameupdatelog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];2];false;$getGuildVar[nameupdatelog];true;$advancedReplaceText[$checkCondition[$getGuildVar[nameupdatelog]==on];true;off;false;on]]]
$setGuildVar[nicknameupdatelog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];3];false;$getGuildVar[nicknameupdatelog];true;$advancedReplaceText[$checkCondition[$getGuildVar[nicknameupdatelog]==on];true;off;false;on]]]
$setGuildVar[banneduserslog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];4];false;$getGuildVar[banneduserslog];true;$advancedReplaceText[$checkCondition[$getGuildVar[banneduserslog]==on];true;off;false;on]]]
$setGuildVar[unbanneduserslog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];5];false;$getGuildVar[unbanneduserslog];true;$advancedReplaceText[$checkCondition[$getGuildVar[unbanneduserslog]==on];true;off;false;on]]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==membereventsetupmenu;]
`
},{
// Server Events Interaction
    type: "interaction",
    prototype: "selectMenu",
    code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Server Events}{description:
**Channel#COLON#**
$get[servereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[Integrationlog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Integration Updates}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:servereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:servereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:servereventsetupmenu_$authorID:Modify logging modules:1:1:false:{stringInput:Integration Updates:1:Toggle logging for integration updates:false}}}]

$let[servereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$getSelectMenuValues[all]==servereventlogs;]
$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==setuplogsmenu;]
`
},{
// Server Events - Channel Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Server Events}{description:
**Channel#COLON#**
$get[servereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[Integrationlog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Integration Updates}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:servereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:servereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:servereventsetupmenu_$authorID:Modify logging modules:1:1:false:{stringInput:Integration Updates:1:Toggle logging for integration updates:false}}}]

$let[servereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]]

    $setGuildVar[servereventschannel;$getSelectMenuValues[all]]

    $onlyIf[$hasPermsInChannel[$getSelectMenuValues[all];$clientID;sendmessages;viewchannel]==true;I do not have permissions there. Please ensure that I have the following permissions in <#$getSelectMenuValues[all]>:
    \`ViewChannel\`
    \`SendMessages\`
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$getSelectMenuValues[all]!=$getGuildVar[servereventschannel];
    This channel is already being used for Server Event logging!
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$channelType[$getSelectMenuValues[all]]==text;Only Text Channels are supported at this time.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$guildChannelExists[$guildID;$getSelectMenuValues[all]]==true;The channel you chose does not exists.
    Please set a valid channel that exists in this server.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==servereventchannelsetupmenu;]
    `
    },{
// Server Events - Reset Button
        type: "interaction",
        prototype: "button",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Server Events}{description:
**Channel#COLON#**
$get[servereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[Integrationlog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Integration Updates}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:servereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:servereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:servereventsetupmenu_$authorID:Modify logging modules:1:1:false:{stringInput:Integration Updates:1:Toggle logging for integration updates:false}}}]

$let[servereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]]

    $deleteVar[servereventschannel;$guildID;main]

    $onlyIf[$getGuildVar[servereventschannel]!=none;
    There's no channel to reset.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
    {ephemeral}
    {interaction}
    ]

    $onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==servereventresetchannel;]

    `
    },{
// Server Events - Module Selection
        type: "interaction",
        prototype: "selectMenu",
        code: `$interactionUpdate[{newEmbed:{author:$guildName:$guildIcon}{title:Server Events}{description:
**Channel#COLON#**
$get[servereventschannel]
> $advancedReplaceText[$checkCondition[$getGuildVar[Integrationlog]==on];false;<:box:1374183092092403782>;true;<:box_tick:1374183078158925844>] Integration Updates}{color:$getVar[embedcolor]}}
{actionRow:{button:Menu:2:setuplogshome_$authorID:false:<:left_arrow:1374180400489828362>}{button:Reset:2:servereventresetchannel_$authorID:false}}
{actionRow:{selectMenu:servereventchannelsetupmenu_$authorID:Select a channel to use (Tip∶ try typing):1:1:false:{channelInput:Text}}}
{actionRow:{selectMenu:servereventsetupmenu_$authorID:Modify logging modules:1:1:false:{stringInput:Integration Updates:1:Toggle logging for integration updates:false}}}]

$let[servereventschannel;$advancedReplaceText[$checkCondition[$getGuildVar[servereventschannel]==none];true;\`No channel selected\`;false;<#$getGuildVar[servereventschannel]>]]

$setGuildVar[Integrationlog;$advancedReplaceText[$checkContains[$getSelectMenuValues[all;_];1];false;$getGuildVar[Integrationlog];true;$advancedReplaceText[$checkCondition[$getGuildVar[Integrationlog]==on];true;off;false;on]]]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;2]==$interactionData[author.id];This interaction is not for you.
{ephemeral}
{interaction}
]

$onlyIf[$advancedTextSplit[$interactionData[customId];_;1]==servereventsetupmenu;]
`
}]