const { ApplicationCommandOptionType, MessageFlags } = require("discord.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");
const Sentry = require("@sentry/node");
// for using sentry
require("../instrument");

module.exports = {
  name: "birthday_register",
  description: "🔧誕生日を登録・更新しよう！",
  options: [
    {
      type: ApplicationCommandOptionType.Number,
      name: "month",
      description: "誕生月を入力してください（半角数字で入力）",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Number,
      name: "day",
      description: "誕生日を入力してください(半角数字で入力)",
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      //誕生日を祝う機能が使えるか確認
      serverDB
        .findOne({ _id: interaction.guild.id })
        .catch((err) => {
          Sentry.captureException(err);
          return interaction.reply({
            content:
              "内部エラーが発生しました。\nサーバー用データベースが正常に作成されなかった可能性があります。",
            flags: MessageFlags.Ephemeral,
          });
        })
        .then(async (model) => {
          if (!model) {
            return interaction.reply({
              content: `申し訳ございません。本BOTの新規サーバー登録が正常に行われなかった可能性があります。\n一度サーバーからkickして、[このURL](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274878024832&integration_type=0&scope=bot+applications.commands)から再招待をお願い致します。`,
              flags: MessageFlags.Ephemeral,
            });
          }

          if (model.status == "false") {
            return interaction.reply({
              content:
                "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
              flags: MessageFlags.Ephemeral,
            });
          } else if (model.status == "true") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // スラッシュコマンドの入力情報を取得
            let new_birthday_month = interaction.options.getNumber("month");
            let new_birthday_day = interaction.options.getNumber("day");
            let lastDay = new Date(2020, new_birthday_month, 0).getDate();

            let user_id = interaction.user.id;

            if (new_birthday_month >= 1 && new_birthday_month <= 12) {
              if (new_birthday_day >= 1 && new_birthday_day <= lastDay) {
                if (new_birthday_month >= 1 && new_birthday_month <= 9) {
                  new_birthday_month = `0${new_birthday_month}`;
                }
                if (new_birthday_day >= 1 && new_birthday_day <= 9) {
                  new_birthday_day = `0${new_birthday_day}`;
                }
                let usersInAllGuild = await userDB.find({ _id: user_id });
                if (!usersInAllGuild.length) {
                  // ユーザーDBに居ない場合は、新規登録
                  const profile = await userDB.create({
                    _id: user_id,
                    serverIDs: [interaction.guild.id],
                    user_name: interaction.user.name,
                    birthday_month: new_birthday_month,
                    birthday_day: new_birthday_day,
                    status: "yet",
                  });
                  profile
                    .save()
                    .catch(async (err) => {
                      Sentry.captureException(err);
                      return interaction.editReply(
                        "申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。"
                      );
                    })
                    .then(async () => {
                      return interaction.editReply({
                        embeds: [
                          {
                            title: "新規登録完了！",
                            description: `あなたの誕生日を\`${new_birthday_month}月${new_birthday_day}日\`に設定しました。`,
                            color: 0x0000ff,
                          },
                        ],
                        flags: MessageFlags.Ephemeral,
                      });
                    });
                } else {
                  // ユーザーDBに居る場合は、更新手続きを行う。
                  let users = await userDB.findOne({ _id: user_id });

                  // ユーザーDBのserverIDsに登録されていない場合は、登録する。
                  let registered = true;
                  if (!users.serverIDs.includes(interaction.guild.id)) {
                    registered = false;
                    await userDB.updateOne(
                      { _id: user_id },
                      { $push: { serverIDs: interaction.guild.id } }
                    );
                  }

                  await userDB
                    .findOne({ _id: user_id })
                    .catch((err) => {
                      Sentry.captureException(err);
                      return interaction.editReply({
                        content:
                          "誕生日のデータを更新する際に、内部エラーが発生しました。\nサポートサーバーからエラーが発生した旨を伝えてください。",
                      });
                    })
                    .then((model) => {
                      // 古い情報を取得
                      let old_month = model.birthday_month;
                      let old_day = model.birthday_day;
                      // 内容を更新
                      model.birthday_month = new_birthday_month;
                      model.birthday_day = new_birthday_day;
                      model.status = "yet";
                      model.save().then(async () => {
                        return interaction.editReply({
                          embeds: [
                            {
                              title: registered
                                ? "全サーバーにおける、誕生日の更新が完了しました！"
                                : "このサーバーでのあなたの誕生日を祝う設定を有効にし、全サーバーにおける、誕生日の更新が完了しました！",
                              description: `あなたの誕生日を\`${old_month}月${old_day}日\`から\`${new_birthday_month}月${new_birthday_day}日\`に更新しました。`,
                              color: 0x10ff00,
                            },
                          ],
                        });
                      });
                    });
                }
              } else {
                await interaction.editReply({
                  embeds: [
                    {
                      title: "エラー！",
                      description: `${new_birthday_month}月には、最大で${lastDay}日までしか存在しません。\n正しい月日使用して再度お試しください。`,
                      color: 0xff0000,
                    },
                  ],
                });
              }
            } else {
              await interaction.editReply({
                embeds: [
                  {
                    title: "エラー！",
                    description: `1年は1～12月までしか存在しません。\n正しい月日を使用して再度お試しください。`,
                    color: 0xff0000,
                  },
                ],
              });
            }
          } else {
            return interaction.editReply({
              content:
                "内部エラーが発生しました。\nサーバー用データベースのステータスの値が予期しない値であった可能性があります。",
            });
          }
        });
    } catch (err) {
      Sentry.setTag("Error Point", "birthday_register");
      Sentry.captureException(err);
    }
  },
};
