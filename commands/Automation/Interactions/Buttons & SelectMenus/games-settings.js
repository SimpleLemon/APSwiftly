"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const TRIVIA_TYPE_DESCRIPTION = [
  "This is the type of questions the game starts with. There're two types:",
  "",
  "* **Single**",
  "* **Multiple**",
  "",
  '**Single** starts the game with only "True" or "False" answer for each question. **Multiple** starts the game with multiple answers for each question.',
].join("\n");

const TRIVIA_DIFFICULTY_DESCRIPTION = [
  "This option is dedicated to how hard the game will be. There're 3 options:",
  "",
  "* **Easy**",
  "* **Medium**",
  "* **Hard**",
  "",
  "To change difficulty to any of the options above, use the buttons below to do so!",
].join("\n");

const FLOOD_DIFFICULTY_DESCRIPTION = [
  "Which difficulty do you prefer to use?",
  "",
  "* **Easy**: Starts with blocks at small size",
  "* **Normal**: Starts with blocks at medium size",
  "* **Hard**: Starts with blocks at large size",
  "",
  "To change difficulty to any of the options above, use the buttons below to do so!",
].join("\n");

const HANGMAN_THEMES = [
  { label: "Nature", description: "Sets the theme to Nature-related", value: "nature" },
  { label: "Sport", description: "Sets the theme to Sport-related", value: "sport" },
  { label: "Color", description: "Sets the theme to Color-related", value: "color" },
  { label: "Camp", description: "Sets the theme to Camp-related", value: "camp" },
  { label: "Fruit", description: "Sets the theme to Fruit-related", value: "fruit" },
  { label: "Discord", description: "Sets the theme to Discord-related", value: "discord" },
  { label: "Winter", description: "Sets the theme to Winter-related", value: "winter" },
  { label: "Pokemon", description: "Sets the theme to Pokemon-related", value: "pokemon" },
];

function toUpper(value) {
  return String(value ?? "").toLocaleUpperCase();
}

function floodMode(difficulty) {
  const value = Number(difficulty);
  if (value === 18) return "Hard";
  if (value === 13) return "Normal";
  if (value === 8) return "Easy";
  return String(difficulty ?? "");
}

function notForYou(ctx) {
  return ctx.reply("This interaction is not for you.", { flags: 64 });
}

function triviaSettingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`triviasettings_${authorId}`)
      .setPlaceholder("Select a option")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Type",
          description: "How the game should start?",
          value: "triviatype",
        },
        {
          label: "Difficulty",
          description: "How hard the game will be?",
          value: "triviadifficulty",
        },
      ])
  );
}

function triviaTypeEmbed(ctx) {
  return new EmbedBuilder()
    .setTitle("Trivia type")
    .setDescription(TRIVIA_TYPE_DESCRIPTION)
    .addFields({
      name: "**Current type**",
      value: `* \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "trivia_type", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));
}

function triviaToggleRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Toggle")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`triviatypetoggle_${authorId}`)
  );
}

function triviaDifficultyEmbed(ctx) {
  return new EmbedBuilder()
    .setTitle("Trivia Difficulty")
    .setDescription(TRIVIA_DIFFICULTY_DESCRIPTION)
    .addFields({
      name: "**Current difficulty**",
      value: `* \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "trivia_difficulty", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));
}

function triviaDifficultyRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Easy")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`triviaopteasy_${authorId}`),
    new ButtonBuilder()
      .setLabel("Medium")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`triviaoptmedium_${authorId}`),
    new ButtonBuilder()
      .setLabel("Hard")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`triviaopthard_${authorId}`)
  );
}

function floodSettingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`floodsettings_${authorId}`)
      .setPlaceholder("Select a option")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Difficulty",
          description: "How hard the game will be?",
          value: "flooddifficulty",
        },
      ])
  );
}

function floodDifficultyEmbed(ctx) {
  return new EmbedBuilder()
    .setTitle("Flood difficulty")
    .setDescription(FLOOD_DIFFICULTY_DESCRIPTION)
    .addFields({
      name: "**Current difficulty**",
      value: `* \`${floodMode(ctx.getGlobalUserVar(ctx.authorId, "flood_difficulty", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));
}

function floodDifficultyRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Easy")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`floodopteasy_${authorId}`),
    new ButtonBuilder()
      .setLabel("Normal")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`floodoptnormal_${authorId}`),
    new ButtonBuilder()
      .setLabel("Hard")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`floodopthard_${authorId}`)
  );
}

function hangmanSettingsRow(authorId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`hangmansettings_${authorId}`)
      .setPlaceholder("Select a theme")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(HANGMAN_THEMES)
  );
}

function hangmanThemeEmbed(ctx, title) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription("Welcome to Hangman Themes! To select a theme to use, use the dropdown menu below!")
    .addFields({
      name: "**Current theme**",
      value: `* \`${toUpper(ctx.getGlobalUserVar(ctx.authorId, "hangman_theme", "main"))}\``,
    })
    .setColor(ctx.getVar("embedcolor"));
}

async function setTriviaDifficulty(ctx, value, label) {
  if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

  const current = String(ctx.getGlobalUserVar(ctx.authorId, "trivia_difficulty", "main"));
  if (current === value) {
    return ctx.reply("This difficulty option is already used!", { flags: 64 });
  }

  ctx.setGlobalUserVar(ctx.authorId, "trivia_difficulty", value, "main");

  await ctx.update({
    embeds: [triviaDifficultyEmbed(ctx)],
    components: [triviaSettingsRow(ctx.authorId), triviaDifficultyRow(ctx.authorId)],
  });
  await ctx.followUp(`Set Trivia's difficulty to \`${label}\`!`, { flags: 64 });
}

async function setFloodDifficulty(ctx, value, label) {
  if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

  const current = Number(ctx.getGlobalUserVar(ctx.authorId, "flood_difficulty", "main"));
  if (current === value) {
    return ctx.reply("This difficulty option is already used!", { flags: 64 });
  }

  ctx.setGlobalUserVar(ctx.authorId, "flood_difficulty", value, "main");

  await ctx.update({
    embeds: [floodDifficultyEmbed(ctx)],
    components: [floodSettingsRow(ctx.authorId), floodDifficultyRow(ctx.authorId)],
  });
  await ctx.followUp(`Set Flood's difficulty to \`${label}\`!`, { flags: 64 });
}

module.exports = [
  {
    component: "select",
    customId: "triviasettings",
    async execute(ctx) {
      const value = ctx.values[0];
      if (value !== "triviatype" && value !== "triviadifficulty") return;
      if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

      if (value === "triviatype") {
        return ctx.update({
          embeds: [triviaTypeEmbed(ctx)],
          components: [triviaSettingsRow(ctx.authorId), triviaToggleRow(ctx.authorId)],
        });
      }

      return ctx.update({
        embeds: [triviaDifficultyEmbed(ctx)],
        components: [triviaSettingsRow(ctx.authorId), triviaDifficultyRow(ctx.authorId)],
      });
    },
  },
  {
    component: "button",
    customId: "triviatypetoggle",
    async execute(ctx) {
      if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

      const current = String(ctx.getGlobalUserVar(ctx.authorId, "trivia_type", "main"));
      const next = current === "single" ? "multiple" : "single";
      ctx.setGlobalUserVar(ctx.authorId, "trivia_type", next, "main");

      const result =
        next === "single"
          ? 'From now on, Trivia will start with only "True" or "False" answer for each question!'
          : "From now on, Trivia will start with multiple answers for each question!";

      await ctx.update({
        embeds: [triviaTypeEmbed(ctx)],
        components: [triviaSettingsRow(ctx.authorId), triviaToggleRow(ctx.authorId)],
      });
      await ctx.followUp(result, { flags: 64 });
    },
  },
  {
    component: "button",
    customId: "triviaopteasy",
    async execute(ctx) {
      await setTriviaDifficulty(ctx, "easy", "Easy");
    },
  },
  {
    component: "button",
    customId: "triviaoptmedium",
    async execute(ctx) {
      await setTriviaDifficulty(ctx, "medium", "Medium");
    },
  },
  {
    component: "button",
    customId: "triviaopthard",
    async execute(ctx) {
      await setTriviaDifficulty(ctx, "hard", "Hard");
    },
  },
  {
    component: "select",
    customId: "floodsettings",
    async execute(ctx) {
      if (ctx.values[0] !== "flooddifficulty") return;
      if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

      return ctx.update({
        embeds: [floodDifficultyEmbed(ctx)],
        components: [floodSettingsRow(ctx.authorId), floodDifficultyRow(ctx.authorId)],
      });
    },
  },
  {
    component: "button",
    customId: "floodopteasy",
    async execute(ctx) {
      await setFloodDifficulty(ctx, 8, "Easy");
    },
  },
  {
    component: "button",
    customId: "floodoptnormal",
    async execute(ctx) {
      await setFloodDifficulty(ctx, 13, "Normal");
    },
  },
  {
    component: "button",
    customId: "floodopthard",
    async execute(ctx) {
      await setFloodDifficulty(ctx, 18, "Hard");
    },
  },
  {
    component: "select",
    customId: "hangmansettings",
    async execute(ctx) {
      const value = ctx.values[0];
      if (!HANGMAN_THEMES.some((theme) => theme.value === value)) return;
      if (ctx.parts[1] !== ctx.authorId) return notForYou(ctx);

      const current = String(ctx.getGlobalUserVar(ctx.authorId, "hangman_theme", "main"));
      if (current === value) {
        return ctx.reply("This theme is already used!", { flags: 64 });
      }

      ctx.setGlobalUserVar(ctx.authorId, "hangman_theme", value, "main");

      const title = ctx.message.embeds[0]?.title ?? "Hangman Themes";

      await ctx.update({
        embeds: [hangmanThemeEmbed(ctx, title)],
        components: [hangmanSettingsRow(ctx.authorId)],
      });
      await ctx.followUp(`Set Hangman's theme to \`${toUpper(value)}\`!`, { flags: 64 });
    },
  },
];
