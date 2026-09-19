"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const CONTRIBUTOR_CATEGORY_ID = "1356279309169328158";
const STAFF_ROLE_ID = "1519016533005832332";

const STAFF_LINES = [
  "Derek Chen (Founder) | <@!784527187453542440>",
  "Tristan Lee (Director) | <@!1199894139446247526>",
  "Ryon Tom (Manager) | <@!1226697393219567657>",
  "Max F. (Asst. Manager) | <@!1501045455386312804>",
];

const MODAL_FIELDS = [
  { id: "nameInput", label: "Name", style: TextInputStyle.Short, required: true, placeholder: "User's name" },
  { id: "emailInput", label: "Email", style: TextInputStyle.Short, required: true, placeholder: "User's email address" },
  { id: "publicInput", label: "Public Name", style: TextInputStyle.Short, required: true, placeholder: "User's Public Name" },
  { id: "responseInput", label: "Response", style: TextInputStyle.Short, required: true, placeholder: "User's average response time" },
  { id: "otherInput", label: "Other", style: TextInputStyle.Paragraph, required: false, placeholder: "Anything else" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function disabledReplyRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Don't reply — bot can't read.")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("unimportantcustomid2")
      .setDisabled(true)
  );
}

function missingAdministratorEmbed() {
  return new EmbedBuilder()
    .setTitle("Missing Permissions")
    .setColor("#FF0000")
    .setDescription("You are missing `Administrator` permissions needed to run this command!");
}

const contributorCommand = {
  slash: { name: "contributor" },
  info: {
    description: "Create a Channel with a contributor",
    perms: ["`SendMessages,ManageChannels`"],
  },
  async execute(ctx) {
    if (!ctx.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply({ embeds: [missingAdministratorEmbed()] }, { flags: 64 });
    }

    const target = ctx.options.getUser("user");
    const channelName = ctx.options.getString("channelname");

    await ctx.defer({ flags: 64 });

    try {
      const channel = await ctx.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: CONTRIBUTOR_CATEGORY_ID,
      });

      await wait(2000);
      await channel.permissionOverwrites.edit(STAFF_ROLE_ID, { ViewChannel: true });
      await channel.permissionOverwrites.edit(target.id, { ViewChannel: true });

      await channel.send({
        content: `Hello <@!${target.id}>`,
        embeds: [new EmbedBuilder().setDescription(STAFF_LINES.join("\n")).setColor("#7dfdff")],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("Update Info").setStyle(ButtonStyle.Secondary).setCustomId("ainfo")
          ),
        ],
      });

      const dmEmbed = new EmbedBuilder()
        .setTitle("Application Decision")
        .setColor("#FFFFFF")
        .setDescription(
          [
            "Congratulations! You have been selected to participate in the APStudy Contributor Program! Your application has impressed the selection committee and you are now given the opportunity to create notes and manage your own AP subject page on APStudy.",
            "",
            "**Here are your next steps:**",
            `1. Visit <#${channel.id}> and confirm your acceptance and responsibilities as an APStudy Contributor Program member.`,
            "2. Tasks and assignments will be open to you shortly after we recieve your acceptance, please make sure you are checking your Discord regularly!",
            "",
            `Congratulations and welcome to the APStudy Contributor team! We are thrilled to work with you and if you have any questions, please contact <@!${ctx.authorId}>`,
            "",
            "Sincerely,",
            "APStudy Contributor Team",
          ].join("\n")
        );

      await target.send({ embeds: [dmEmbed], components: [disabledReplyRow()] });

      const embed = new EmbedBuilder()
        .setTitle("Success!")
        .setColor("#00FF00")
        .setDescription(`<@!${ctx.authorId}> has added <@!${target.id}> to <#${channel.id}>`);
      await ctx.followUp({ embeds: [embed] });
    } catch {
      const embed = new EmbedBuilder()
        .setTitle("Something went wrong!")
        .setColor("#FF0000")
        .setDescription("Please try again later.");
      await ctx.followUp({ embeds: [embed] });
    }
  },
};

const ainfoButton = {
  component: "button",
  customId: "ainfo",
  async execute(ctx) {
    if (!ctx.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      return ctx.reply({ embeds: [missingAdministratorEmbed()] }, { flags: 64 });
    }

    const modal = new ModalBuilder().setTitle("APStudy Contributor Information").setCustomId("ainfomodal");
    modal.addComponents(
      ...MODAL_FIELDS.map((field) =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(field.label)
            .setStyle(field.style)
            .setRequired(field.required)
            .setPlaceholder(field.placeholder)
        )
      )
    );

    await ctx.showModal(modal);
  },
};

const ainfoModal = {
  component: "modal",
  customId: "ainfomodal",
  async execute(ctx) {
    const fields = ctx.interaction.fields;
    const embed = new EmbedBuilder()
      .setColor("#7dfdff")
      .setDescription(
        [
          `\`\`\`Name: ${fields.getTextInputValue("nameInput")}\`\`\``,
          `\`\`\`Email: ${fields.getTextInputValue("emailInput")}\`\`\``,
          `\`\`\`Public Name: ${fields.getTextInputValue("publicInput")}\`\`\``,
          `\`\`\`Response Time: ${fields.getTextInputValue("responseInput")}\`\`\``,
          `\`\`\`Other Name: ${fields.getTextInputValue("otherInput")}\`\`\``,
        ].join("") + `\n-# Updated by <@!${ctx.authorId}>`
      );

    const sent = await ctx.channel.send({ embeds: [embed] });
    await sent.pin().catch(() => {});
    await ctx.reply("Success!", { flags: 64 });
  },
};

module.exports = [contributorCommand, ainfoButton, ainfoModal];
