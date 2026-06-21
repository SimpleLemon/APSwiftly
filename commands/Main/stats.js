module.exports = ({
 name: "stats",
 aliases: ["botstats","info"],
 info: {
        description: "Returns statistics about the bot.",
        perms: "`SendMessages`"
 },
 code: `
$title[Bot Statistics/Information]
$author[$username[$clientid];$useravatar[$clientid]]
$thumbnail[https://cdn.discordapp.com/attachments/795966035919634455/807884403904741386/5495053-statistic-icons-download-5953-free-png-and-vector-icons-statistic-png-512_512_preview.png]
$color[RANDOM]
$addField[Others;
• Total commands: $commandsCount
• Latency: $botPing ms
• Uptime: $uptime
• Owner: $usertag[$botownerid]]
$addField[Versions;
• NodeJS Version: $getObjectProperty[nodev]
• Discord.js Version: $getObjectProperty[discordv]]

$addField[Hosting Related Stats;• CPU Usage: $cpu
• CPU Model: $djsEval[require ('os').cpus()[0\\].model;yes] 
• CPU Platform: $djsEval[require ('os').platform();yes]
• RAM Usage: $ram MB
• Memory Usage: $djsEval[process.memoryUsage().rss / 1024 / 1024;yes] MB]
$addField[Bot Information;
Name: $username[$clientID]
Tag: #$discriminator[$clientID]
ID: $clientID
Total servers: $serverCount
Total users: $allMembersCount]
 $djseval[d.object.nodev = process.version
d.object.discordv = require('discord.js').version
$createObject[{}]]
$onlyIf[$guildID!=;]`
})