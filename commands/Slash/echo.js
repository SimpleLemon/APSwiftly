module.exports = {
name: "echo",
type: "interaction",
prototype: "slash",
info: {
 description: "Echos message that you send."
},
code: `$interactionReply[$message;users;false]

$onlyIf[$getVar[userapps]==true;User apps are currently disabled.
{ephemeral}
{interaction}
]
`
}
