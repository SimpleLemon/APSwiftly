module.exports = ({
name: "hours",
aliases: ['me'],
code: `
$title[$username[$mentioned[1;true]]'s Volunteer Hours]
$color[03d7fc] 
$description[<a:APStudy_gif:1338711325081211004> **Hours:** \`$getGlobalUserVar[hours;$mentioned[1;true];custom]\`]
$reply
$footer[Missing hours? Contact APStudy Representatives.]
`
})  