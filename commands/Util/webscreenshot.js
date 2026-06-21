module.exports = ({
name: "webscreenshot",
aliases: ['screenshot','webss','websitess','ss'],
code: `
$image[attachment://screenshot.png]
$attachment[https://image.thum.io/get/auth/11091-RandomBot/nomention/$message;screenshot.png]
$footer[Requested by $username[$authorID]]

$onlyIf[$guildID!=;]
$cooldown[3s;{newEmbed:{title:Be Patient}
{description:Please wait for %time% to use this command again.}
{color:FF2D00}}]
$onlyIf[$isValidLink[$message[1]]==true;The link you've given isn't valid]
`
})