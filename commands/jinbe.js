const { ApplicationCommandOptionType } = require("discord.js");
const omikujiSystem = require("./omikuji.js");

module.exports = {
  name: "jinbe",
  description: "🥠おみくじを引こう！！",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "secret",
      description: "結果を非公開で送信したい場合は設定してください。",
      required: false,
      choices: [{ name: "非公開にする", value: "true" }],
    },
  ],

  run: async (client, interaction) => {
    try {
      ///jinbeコマンドは、/omikujiコマンドのエイリアスとして使用する。
      omikujiSystem.run(client, interaction);
    } catch (err) {
      err.id = "jinbe_omikuji";
      const errorNotification = require("../errorFunction.js");
      errorNotification(client, interaction, err);
    }
  },
};
