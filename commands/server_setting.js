const {
  ApplicationCommandOptionType,
  PermissionsBitField,
} = require("discord.js");
const serverDB = require("../models/server_db.js");
const userDB = require("../models/user_db.js");

module.exports = {
  name: "server_setting",
  description: "🛠️サーバーの設定を変更します。",
  options: [
    {
      name: "birthday_celebrate",
      description: "誕生日を祝う機能の設定をします。",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "true_or_false",
          description:
            "登録して誕生日を祝う機能を有効にするか無効にするか選択してください。",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            {
              name: "有効にする",
              value: "true",
            },
            {
              name: "無効にする",
              value: "false",
            },
          ],
        },
        {
          name: "channel",
          description:
            "誕生日を祝うチャンネルを指定してください。(有効に設定する場合のみ使用されます)",
          type: ApplicationCommandOptionType.Channel,
          require: false,
        },
      ],
    },
    {
      name: "show",
      description: "設定を閲覧します。",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async (client, interaction) => {
    try {
      if (interaction.options.getSubcommand() == "birthday_celebrate") {
        await interaction.deferReply({ ephemeral: true });
        if (
          !interaction.memberPermissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.editReply({
            content:
              "あなたは管理者権限を持っていないため、サーバー設定を変更できません。\n変更したい場合は、サーバー管理者にこのコマンドを実行するようにお願いしてください。",
            ephemeral: true,
          });
        } else {
          let status = interaction.options.getString("true_or_false");
          let channel = interaction.options.getChannel("channel");

          let data = serverDB.find({ _id: interaction.guild.id });
          if (!data) {
            return interaction.reply({
              content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
              ephemeral: true,
            });
          } else {
            if (status == "true") {
              if (channel) {
                var st = channel.id;
              } else {
                return interaction.editReply({
                  content: "⚠️誕生日を祝うチャンネルを指定してください。",
                  ephemeral: true,
                });
              }
            } else {
              var st = null;

              //このサーバーに関連する誕生日データを削除
              await userDB.deleteMany({ serverID: interaction.guild.id });
            }

            serverDB
              .findById(interaction.guild.id)
              .catch(async (err) => {
                console.log(err);
                await interaction.editReply({
                  content:
                    "内部エラーが発生しました。\nこの旨をサポートサーバーでお伝えください。",
                  ephemeral: true,
                });
              })
              .then((model) => {
                model.channelID = st;
                model.status = status;
                model.save().then(async () => {
                  await interaction.editReply({
                    embeds: [
                      {
                        title: "設定を更新しました！",
                        color: 0x10ff00,
                      },
                    ],
                  });
                  return;
                });
              });
          }
        }
      } else if (interaction.options.getSubcommand() == "show") {
        serverDB
          .findById(interaction.guild.id)
          .catch((err) => {
            console.log(err);
          })
          .then((model) => {
            if (!model) {
              return interaction.reply({
                content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
                ephemeral: true,
              });
            }

            if (model.status == "true") {
              var status = "有効(true)";
              var channel = interaction.guild.channels.cache.find(
                (ch) => ch.id === model.channelID
              );
              if (!channel) {
                var channel = "`見つかりませんでした！`";
              }
            } else if (model.status == "false") {
              var status = "無効(false)";
              var channel =
                "`(機能が無効のため、この項目は無効化されています)`";
            }

            return interaction.reply({
              embeds: [
                {
                  title: `${interaction.guild.name}の設定`,
                  description: `- 誕生日を祝う機能：　${status}\n- 誕生日を祝うチャンネル:　${channel}`,
                },
              ],
            });
          });
      }
    } catch (err) {
      err.id = "server_settings";
      const errorNotification = require("../errorFunction.js");
      errorNotification(client, interaction, err);
    }
  },
};
