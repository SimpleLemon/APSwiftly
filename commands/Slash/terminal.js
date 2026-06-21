module.exports = {
name: "terminal",
type: "interaction",
prototype: "slash",
info: {
 description: "Developer Only - Run terminal commands on discord",
},
$if: "old",
code: `
$if[$charCount[$exec[$message]]>=2000]
$createFile[$exec[$message];result.txt]
$else
$interactionReply[\`\`\`$exec[$message]\`\`\`]
$endif
$onlyIf[$message!=;Please send a terminal command to be executed.{ephemeral}
{interaction}]
$onlyIf[$checkContains[$clientOwnerIDs[| ];$authorID]==true;]

$onlyIf[$getVar[userapps]==true;User apps are currently unavailable.
{ephemeral}
{interaction}
]
`
}