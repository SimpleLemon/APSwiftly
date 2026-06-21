module.exports = {
    name: "pvsa",
    info: {
        description: "PVSA Information",
        perms: ["`SendMessages`"]
    },
    code: `
$title[PVSA Information]
$color[FFD700]
$description[**Eligibility**
- Be a US citizen or lawful permanent resident of the US (i.e., green card holder)
- Record Date(s) of Volunteer
- Meet the minimum volunteer hour requirement (check image)
**Cost**
Varies. Check PVSA's \[official website\](https://presidentialserviceawards.gov/award-packages) for cost.
Keep in mind there is a $23 shipping fee.
]
$image[https://i.imgur.com/ZCZb4G8.png]
$reply
$cooldown[3s; Slow down! Don't spam the command!]
`
}