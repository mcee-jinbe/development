const { ApplicationCommandOptionType } = require("discord.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");

module.exports = {
  data: {
    name: "birthday_register",
    description: "🔧誕生日を登録・更新しよう！",
    options: [
      {
        type: ApplicationCommandOptionType.Number,
        name: "month",
        description: "誕生月を入力してください（半角数字で「1」~「12」を入力）",
        value: "month",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Number,
        name: "day",
        description: "誕生日を入力してください(半角数字で「1」~「31」を入力)",
        value: "day",
        required: true,
      },
    ],
  },
  async execute(interaction) {


    
    //誕生日を祝う機能が使えるか確認
    serverDB
      .findOne({ _id: interaction.guild.id })
      .catch((err) => {
        console.log(err);
        return interaction.reply({
          content:
            "内部エラーが発生しました。\nサーバー用データベースが正常に作成されなかった可能性があります。",
          ephemeral: true,
        });
      })
      .then(async (model) => {
        console.log("saving birthday");
        if (model.status == "false") {
          console.log("regist_cannnot use error send");
          return interaction.reply({
            content:
              "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
            ephemeral: true,
          });
        } else if (model.status == "true") {
          // スラッシュコマンドの入力情報を取得
          console.log("start birthday_regist");
          var new_birthday_month = interaction.options.getNumber("month");
          var new_birthday_day = interaction.options.getNumber("day");
          let lastday = new Date(2020, new_birthday_month, 0).getDate();

          let user_id = interaction.user.id;

          if (new_birthday_month >= 1 && new_birthday_month <= 12) {
            if (new_birthday_day >= 1 && new_birthday_day <= lastday) {
              if (new_birthday_month >= 1 && new_birthday_month <= 9) {
                var new_birthday_month = "0" + new_birthday_month;
              }
              if (new_birthday_day >= 1 && new_birthday_day <= 9) {
                var new_birthday_day = "0" + new_birthday_day;
              }
              let database_data = await userDB.find({
                uid: user_id,
                serverID: interaction.guild.id,
              });
              console.log("regist get userdb");
              if (!database_data.length) {
                console.log("start userdb regist")
                const profile = await userDB.create({
                  uid: user_id,
                  serverID: interaction.guild.id,
                  user_name: interaction.user.name,
                  birthday_month: new_birthday_month,
                  birthday_day: new_birthday_day,
                  status: "yet",
                });
                profile
                  .save()
                  .catch(async (err) => {
                    console.log(err);
                    console.log("regist error");
                    await interaction.reply(
                      "申し訳ございません。内部エラーが発生しました。\n開発者(<@728495196303523900>)が対応しますので、しばらくお待ちください。\n\n----業務連絡---\nデータベースの更新時にエラーが発生しました。\nコンソールを確認してください。"
                    );
                    return;
                  })
                  .then(async () => {
                    console.log("regist done");
                    await interaction.reply({
                      embeds: [
                        {
                          title: "新規登録完了！",
                          description: `あなたの誕生日を\`${new_birthday_month}月${new_birthday_day}日\`に設定しました。`,
                          color: 0x0000ff,
                        },
                      ],
                    });
                    return;
                  });
              } else {
                console.log("start get userdb regist_update");
                userDB
                  .findOne({ uid: user_id, serverID: interaction.guild.id })
                  .catch((err) => {
                    console.log("regist update error");
                    console.log(err);
                    return interaction.reply({
                      content:
                        "誕生日のデータを更新する際に、内部エラーが発生しました。\nサポートサーバーからエラーが発生した旨を伝えてください。",
                      ephemeral: true,
                    });
                  })
                  .then((model) => {
                    console.log("start regist update");
                    // 古い情報を取得
                    let old_month = model.birthday_month;
                    let old_day = model.birthday_day;
                    // 内容を更新
                    model.birthday_month = new_birthday_month;
                    model.birthday_day = new_birthday_day;
                    model.save().then(async () => {
                      console.log("update done");
                      await interaction.reply({
                        embeds: [
                          {
                            title: "更新完了！",
                            description: `あなたの誕生日を\`${old_month}月${old_day}日\`から\`${new_birthday_month}月${new_birthday_day}日\`に更新しました。`,
                            color: 0x10ff00,
                          },
                        ],
                      });
                      return;
                    });
                  });
              }
            } else {
              console.log("regist parameter error_day");
              await interaction.reply({
                embeds: [
                  {
                    title: "エラー！",
                    description: `${new_birthday_month}月には、最大で${lastday}日までしか存在しません。\n正しい月日使用して再度お試しください。`,
                    color: 0xff0000,
                  },
                ],
                ephemeral: true,
              });
            }
          } else {
            console.log("regist parameter error_month");
            await interaction.reply({
              embeds: [
                {
                  title: "エラー！",
                  description: `1年は1～12月までしか存在しません。\n正しい月日を使用して再度お試しください。`,
                  color: 0xff0000,
                },
              ],
              ephemeral: true,
            });
          }
        } else {
          console.log("regist unknown status error send");
          return interaction.reply({
            content:
              "内部エラーが発生しました。\nサーバー用データベースのステータスの値が予期しない値であった可能性があります。",
            ephemeral: true,
          });
        }
      });
  },
};
