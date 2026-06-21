module.exports = {
    name: "ai",
    type: "interaction",
    prototype: "slash",
    info: {
    description: "Chat with AI"
    },
    code:`
$interactionFollowUp[{newEmbed:{color:00ff00}
{title:APSwiftly AI}{author:$username[$authorID]:$authorAvatar}
{description:$getObjectProperty[aiAPI;response]}
{footer:Tokens Consumed - $getObjectProperty[aiAPI;usage.total_tokens]}
}]
$createObject[aiAPI;$nonEscape[$jsonRequest[https://api.apstudy.org/ai/discord?message=$uri[$slashOption[message]];[0].response;Something went wrong, please try again later.]]]
$cooldown[5s;{newEmbed:{title:Slow down}{description:To prevent spam, please wait **%sec%** before using this command again!}}{ephemeral}]
$onlyIf[$charCount[$slashOption[message]]>=5;{newEmbed:{title:Message too short!}{description:Try again with a proper message please! Wasting tokens is not nice.}}{ephemeral}]
$onlyIf[$charCount[$slashOption[message]]<=2000;{newEmbed:{title:Message too long!}{description:Try again with a shorter message please! The maximum input message is 2000 characters.}}{ephemeral}]
$interactionDefer[false]
`
}