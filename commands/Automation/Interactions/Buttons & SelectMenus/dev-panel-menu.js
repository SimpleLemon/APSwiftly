"use strict";

const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const {
  isOn,
  mainPanel,
  botInvitationPage,
  errorLoggingPage,
  errorChannelSetupPage,
  embedColorPage,
  preReleasePage,
  startupPage,
  startupChannelSetupPage,
  showBuildInfoPage,
  memberRequirementPage,
  embedColorModal,
  memberRequirementModal,
  leaveServerModal,
} = require("../../../../src/services/devPanel");

const { excludeSpecialChars } = require("../../../../src/utils/text");

const NOT_FOR_YOU = "This interaction is not for you.";

function ownerMismatch(ctx) {
  return ctx.parts[1] !== ctx.authorId;
}

function notForYou(ctx) {
  return ctx.reply(NOT_FOR_YOU, { flags: 64 });
}

function ephemeral(ctx, message) {
  return ctx.reply(message, { flags: 64 });
}

async function ownerGate(ctx) {
  if (ownerMismatch(ctx)) {
    await notForYou(ctx);
    return false;
  }
  return true;
}

// ---- validation helpers (mirror aoi.js $isValidHex/$isValidColor/$isNumber/$isInteger) ----
function isValidHex(value) {
  const hex = String(value).replace("#", "");
  return !Number.isNaN(Number.parseInt(hex, 16));
}

function isValidColor(value) {
  return /^#?([0-9A-Fa-f]{3}){1,2}$/.test(String(value));
}

function isNumber(value) {
  const text = String(value).trim();
  return text !== "" && !Number.isNaN(Number(text));
}

function isInteger(value) {
  if (Number.isNaN(Number(value))) return false;
  return Number.isInteger(Number(value));
}

function channelExists(ctx, channelId) {
  return Boolean(ctx.guild?.channels?.cache?.has(channelId));
}

async function canUseChannel(ctx, channel) {
  if (!ctx.guild) return false;
  const me = ctx.guild.members.me ?? (await ctx.guild.members.fetchMe().catch(() => null));
  if (!me) return false;
  return Boolean(
    channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
  );
}

/** Mirrors the awaited Enable-pre-release / Disable-pre-release semantics. */
function syncReleaseType(ctx) {
  const target = ctx.getVar("DevReleaseTypeToSet") ?? "Pre-release";
  const releaseType = String(ctx.getVar("release_type") ?? "Stable");
  if (isOn(ctx.getVar("pre_release"))) {
    if (!releaseType.includes(target)) ctx.setVar("release_type", target);
  } else if (!releaseType.includes("Stable")) {
    ctx.db.deleteVar("release_type");
  }
}

module.exports = [
  {
    component: "button",
    customId: "developermainpage",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.update(mainPanel(ctx, "Developer Panel"));
    },
  },

  // ---- Bot Invitation Message ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "botwelcome") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(botInvitationPage(ctx));
    },
  },
  {
    component: "button",
    customId: "botgreettoggle",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const current = isOn(ctx.getVar("botinvitationmessage"));
      const next = current ? "off" : "on";
      ctx.setVar("botinvitationmessage", next);

      const result = isOn(next)
        ? "APSwiftly will now welcome new servers!"
        : "APSwiftly will no longer welcome new servers!";

      await ctx.update(botInvitationPage(ctx));
      await ctx.followUp(result, { flags: 64 });
    },
  },

  // ---- Error Logging ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "errorlog") return;
      if (!(await ownerGate(ctx))) return;
      if (ctx.getVar("errorsdisabled") !== false) {
        return ephemeral(
          ctx,
          "To configure this option, you need to disable `DisableAllErrors` from setup options first."
        );
      }
      await ctx.update(errorLoggingPage(ctx));
    },
  },
  {
    component: "button",
    customId: "errorlogtoggle",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const current = isOn(ctx.getVar("errorsystem"));
      const next = current ? "off" : "on";
      ctx.setVar("errorsystem", next);

      const result = isOn(next)
        ? "Error logs will now be logged!"
        : "Error logs will now no longer be logged!";

      await ctx.update(errorLoggingPage(ctx));
      await ctx.followUp(result, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "errorlogsetupchannel",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.update(errorChannelSetupPage(ctx));
    },
  },
  {
    component: "select",
    customId: "errorlogchannelmenusetup",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const selected = ctx.values[0];
      if (!channelExists(ctx, selected)) {
        return ephemeral(
          ctx,
          "The channel you chose no longer exists in this server.\nPlease set a valid channel which exists inside this server."
        );
      }

      const channel = ctx.guild.channels.cache.get(selected);
      if (channel.type !== ChannelType.GuildText) {
        return ephemeral(ctx, "We only support Text Channels for now.\nMake sure to set an Text channel instead.");
      }

      if (selected === ctx.getVar("errorchannel")) {
        return ephemeral(
          ctx,
          "This channel is already used for Error messages. Please, set a different channel instead."
        );
      }

      if (!(await canUseChannel(ctx, channel))) {
        return ephemeral(
          ctx,
          `Hmm. Seems like i don't have the right permissions there. Please ensure that i have the following permissions for the channel <#${selected}>:\n    \`ViewChannel\`\n    \`SendMessages\``
        );
      }

      ctx.setVar("errorchannel", selected);

      await ctx.update(errorChannelSetupPage(ctx));
      await ctx.followUp(`Successfully set <#${selected}> as the error log channel!`, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "errorresetchannel",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      if (ctx.getVar("errorchannel") === "none") {
        return ephemeral(ctx, "There's no channel to reset.");
      }

      ctx.db.deleteVar("errorchannel");

      await ctx.update(errorChannelSetupPage(ctx));
      await ctx.followUp("Channel has been reset!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "errorlogpage",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.update(errorLoggingPage(ctx));
    },
  },

  // ---- Embed color ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "botembedcolor") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(embedColorPage(ctx));
    },
  },
  {
    component: "button",
    customId: "setbotembedcolor",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.showModal(embedColorModal(ctx));
    },
  },
  {
    component: "modal",
    customId: "embedcolorsetresult",
    async execute(ctx) {
      const hex = ctx.interaction.fields.getTextInputValue("hexInput");

      if (!String(hex).startsWith("#")) {
        return ephemeral(ctx, "Your hex code must start with a `#`! Please, try again.");
      }
      if (!isValidHex(hex)) {
        return ephemeral(
          ctx,
          "You did not provide a hex code! Please, make sure to provide a actual hex code and try again."
        );
      }
      if (!isValidColor(hex)) {
        return ephemeral(
          ctx,
          "Your hex code containing the color is incorrect! Please, double check your hex code and try again."
        );
      }

      ctx.setVar("embedcolor", hex);

      await ctx.update(embedColorPage(ctx));
      await ctx.followUp(`\`${hex}\` will now be used as the new embed color!`, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "resetembedcolor",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      if (String(ctx.getVar("embedcolor")) === String(ctx.getVar("originalembedcolor"))) {
        return ephemeral(ctx, "The embed color is already at it's default setting.");
      }

      ctx.db.deleteVar("embedcolor");

      await ctx.update(embedColorPage(ctx));
      await ctx.followUp("Embed color has been reset!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "embedcolorpreview",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const embed = new EmbedBuilder()
        .setTitle("Preview")
        .setDescription("This is how the color will look on embeds!")
        .setFooter({ text: "Pretty cool right?" })
        .setColor(ctx.embedColor);

      await ephemeral(ctx, { embeds: [embed] });
    },
  },

  // ---- Pre-release ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "botdevmode") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(preReleasePage(ctx));
    },
  },
  {
    component: "button",
    customId: "togglebotdevmode",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const current = isOn(ctx.getVar("pre_release"));
      const next = current ? "off" : "on";
      ctx.setVar("pre_release", next);

      const result = isOn(next)
        ? "Pre-release mode will now be enabled!"
        : "Pre-release mode will now no longer be enabled!";

      await ctx.update(preReleasePage(ctx));
      await ctx.followUp(result, { flags: 64 });

      syncReleaseType(ctx);
    },
  },

  // ---- Startup ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "botstartup") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(startupPage(ctx));
    },
  },
  {
    component: "button",
    customId: "botstartuptoggle",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const current = isOn(ctx.getVar("startupchannelsystem"));
      const next = current ? "off" : "on";
      ctx.setVar("startupchannelsystem", next);

      const result = isOn(next) ? "Startup has been enabled!" : "Startup has been disabled!";

      await ctx.update(startupPage(ctx));
      await ctx.followUp(result, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "setbotstartupchannel",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.update(startupChannelSetupPage(ctx));
    },
  },
  {
    component: "select",
    customId: "botstartupchannelmenusetup",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const selected = ctx.values[0];
      if (!channelExists(ctx, selected)) {
        return ephemeral(
          ctx,
          "The channel you chose no longer exists in this server.\nPlease set a valid channel which exists inside this server."
        );
      }

      const channel = ctx.guild.channels.cache.get(selected);
      if (channel.type !== ChannelType.GuildText) {
        return ephemeral(ctx, "We only support Text Channels for now.\nMake sure to set an Text channel instead.");
      }

      if (selected === ctx.getVar("startupchannel")) {
        return ephemeral(
          ctx,
          "This channel is already used for Error messages. Please, set a different channel instead."
        );
      }

      if (!(await canUseChannel(ctx, channel))) {
        return ephemeral(
          ctx,
          `Hmm. Seems like i don't have the right permissions there. Please ensure that i have the following permissions for the channel <#${selected}>:\n    \`ViewChannel\`\n    \`SendMessages\``
        );
      }

      ctx.setVar("startupchannel", selected);

      await ctx.update(startupChannelSetupPage(ctx));
      await ctx.followUp(`Successfully set <#${selected}> as the startup channel!`, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "startupresetchannel",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      if (ctx.getVar("startupchannel") === "none") {
        return ephemeral(ctx, "There's no channel to reset.");
      }

      ctx.db.deleteVar("startupchannel");

      await ctx.update(startupChannelSetupPage(ctx));
      await ctx.followUp("Channel has been reset!", { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "startupbotpage",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.update(startupPage(ctx));
    },
  },

  // ---- Show build info ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "showbuildinfo") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(showBuildInfoPage(ctx));
    },
  },
  {
    component: "button",
    customId: "showbuildinfotoggle",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      const current = isOn(ctx.getVar("showbuildinfo"));
      const next = current ? "off" : "on";
      ctx.setVar("showbuildinfo", next);

      const result = isOn(next)
        ? "Build information will be now be shown"
        : "Build information will no longer be shown!";

      await ctx.update(showBuildInfoPage(ctx));
      await ctx.followUp(result, { flags: 64 });
    },
  },

  // ---- Member requirement ----
  {
    component: "select",
    customId: "devmenu",
    async execute(ctx) {
      if (ctx.values[0] !== "memberrequirement") return;
      if (!(await ownerGate(ctx))) return;
      await ctx.update(memberRequirementPage(ctx));
    },
  },
  {
    component: "button",
    customId: "setmemberrequirement",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.showModal(memberRequirementModal(ctx));
    },
  },
  {
    component: "modal",
    customId: "memberrequirementsetresult",
    async execute(ctx) {
      const input = excludeSpecialChars(ctx.interaction.fields.getTextInputValue("numberInput"));

      if (!isNumber(input)) {
        return ephemeral(ctx, "Please enter a actual number to proceed.");
      }
      if (!isInteger(input)) {
        return ephemeral(ctx, "Number must not be integer.");
      }

      ctx.setVar("servermemberrequirement", input);

      await ctx.update(memberRequirementPage(ctx));
      await ctx.followUp(`\`${input}\` will now be used as the requirement for new servers!`, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "resetmemberrequirement",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;

      if (Number(ctx.getVar("servermemberrequirement")) === 0) {
        return ephemeral(ctx, "The requirement is already set to `0`");
      }

      ctx.db.deleteVar("servermemberrequirement");

      await ctx.update(memberRequirementPage(ctx));
      await ctx.followUp("Requirement has been reset!", { flags: 64 });
    },
  },

  // ---- Leave a server ----
  {
    component: "button",
    customId: "leaveserverbutton",
    async execute(ctx) {
      if (!(await ownerGate(ctx))) return;
      await ctx.showModal(leaveServerModal(ctx));
    },
  },
  {
    component: "modal",
    customId: "leaveservermodalresult",
    async execute(ctx) {
      const input = ctx.interaction.fields.getTextInputValue("numberInput");

      if (!isNumber(input)) {
        return ephemeral(ctx, "Please enter a actual number to proceed.");
      }

      const guild = ctx.client.guilds.cache.get(input);
      if (!guild) {
        return ephemeral(
          ctx,
          "Please enter a valid server id to proceed.\n\n-# This error can also happen if the server specified is not cached"
        );
      }

      if (!ctx.client.guilds.cache.has(input)) {
        const prefix = ctx.getGuildVar("prefix") ?? "d!";
        return ephemeral(
          ctx,
          `I am not in the server you specified.\n\nTo see which servers i'm currently in, run \`${prefix}serverlist\` to do so!`
        );
      }

      await ctx.reply(`Successfully left the server "${guild.name}"!`, { flags: 64 });
      await guild.leave();
    },
  },
];
