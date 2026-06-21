module.exports = {
  name: "acreate",
  code: `
Done without errors.
$createApplicationCommand[global;echo;Echos message that you send.;false;guild,user;guild,dm;slash;[
  {
    "type": 3,
    "name": "message",
    "description": "Input Message",
    "required": true
  }
]]
$createApplicationCommand[global;reload;Developer Only - Reloads Command;false;guild,user;guild,botdm,dm;slash]
$createApplicationCommand[global;terminal;Developer Only - Run terminal commands on Discord;false;guild,user;guild,botdm,dm;slash;[
  {
    "type": 3,
    "name": "message",
    "description": "Command to run in terminal",
    "required": true
  }
]]
$deleteApplicationCommand[global;$getApplicationCommandID[randomcolor]]
$deleteApplicationCommand[global;$getApplicationCommandID[about]] 
$deleteApplicationCommand[global;$getApplicationCommandID[report]]

$onlyIf[$checkContains[$clientOwnerIDs[| ];$authorID]==true;]

  `
}
