module.exports = {
	name: "denied",
    type: "interaction",
    prototype: "slash",
    info: {
    description: "Send denial message to user."
    },
	code:`
 $interactionFollowUp[{newEmbed:{title:Success!}{description:You have sent <@!$slashOption[user]> the denial message}{color:00FF00}}]
$sendDm[{newEmbed:{title:Dear $slashOption[name],}{description:**Thank you for applying to the APStudy Contributor Program**
We regret to inform you that your application was not selected.
\`\`\`Reason: $slashOption[reason]\`\`\`If anything changes, we will let you know.

Sincerely,
APStudy Contributor Team}{color:White}}
{actionRow:{button:Don't reply \— bot can't read.:secondary:unimportantcustomid2:true}};$slashOption[user]]
$onlyIf[$hasPerms[$guildID;$authorID;administrator]==true;You are missing \`Administrator\` permissions needed to run this command!
{ephemeral}
{interaction}]
$interactionDefer[true]
`
}

// $createApplicationCommand[global;denied;Send denial message to user.;Administrator;guild,user;guild;slash;[
//   {
//     "type": 6,
//     "name": "user",
//     "description": "User",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "name",
//     "description": "Applicant's Name",
//     "required": true
//   },
//   {
//     "type": 3,
//     "name": "reason",
//     "description": "Reason for Denial",
//     "required": true
//   }
// ]]