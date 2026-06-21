module.exports = ({
name: "rich",
aliases: ['leaderboard','lb'],
code: `
$title[Volunteering Leaderboard]
$description[$globalUserLeaderBoard[hours;desc;\`{top}. \` <@!{id}> • **{value}** hours.;10;1;custom]]
$color[00ccf0]
$reply

$cooldown[5s;{newEmbed:{title:Be Patient}
{description:Please wait for %time% to do this command again!}
{color:FF2D00}}]
$suppressErrors[{newEmbed:{title:Error}
{description:{Something went wrong.}}
{color:FF2D00}}]`

})