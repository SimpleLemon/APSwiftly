module.exports = {
	name: "latex",
    type: "interaction",
    prototype: "slash",
    info: {
    description: "Send LaTeX message through image attachment."
    },
	code:`
$renderMath[$slashOption[latex]]
$interactionReply[Sent your LaTeX message!]
`
}

// $createApplicationCommand[global;latex;Send LaTeX message through image attachment.;false;guild,user;guild,botdm,dm;slash;[
//   {
//     "type": 3,
//     "name": "latex",
//     "description": "LaTeX message to send",
//     "required": true
//   }
// ]]