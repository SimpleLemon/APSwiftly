module.exports = {
name: "reload",
type: "interaction",
prototype: "slash",
info: {
 description: "Developer Only - Reloads Command",
},
code: `
$interactionReply[{newEmbed:{title:Commands has been reloaded!}
{description:
* **Prefix#COLON#**  $commandsCount
* **Awaited#COLON#** $commandsCount[awaited]
* **Interactions#COLON#** $get[interactions]
* **Slash#COLON#** $commandsCount[slash]}
{color:Green}}
{actionRow:{button:$get[total] Commands:secondary:unimportantcustomid:true}}]

$let[total;$sum[$commandsCount;$commandsCount[awaited];$commandsCount[button];$commandsCount[selectMenu];$commandsCount[modal];$commandsCount[slash]]]
$let[interactions;$sum[$commandsCount[button];$commandsCount[selectMenu];$commandsCount[modal]]]
$updateCommands
$onlyIf[$checkContains[$clientOwnerIDs[| ];$authorID]==true;]

$onlyIf[$getVar[userapps]==true;User apps are currently unavailable.
{ephemeral}
{interaction}
]
`
}