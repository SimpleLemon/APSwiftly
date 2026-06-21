module.exports = {
	name: "grammar",
	info: {
    description: "Ask Contributor to use Grammarly",
    perms: ["`SendMessages,ManageChannels`"]
	},
	code:`$title[Grammar Checking Tools]
$description[> To ensure readability, please use a grammar checking tool.
> Below are free tools.
⭐️ **Suggested:** https://www.grammarly.com/
**Alternatives:**
https://quillbot.com/
https://prowritingaid.com/
https://www.languagetool.org/]
$color[00FF00]
$suppressErrors[{newEmbed:{title:Something went wrong!}{color:FF0000}{description:Please try again later.}}]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;{newEmbed:{title:Incorrect Usage}{color:FF0000}{description:**Usage:**
\`checkin [time]\`}}]
$onlyForCategories[1356279309169328158;{newEmbed:{title:Error}{color:FF0000}{description:This command cannot be used here!}}]
`
}