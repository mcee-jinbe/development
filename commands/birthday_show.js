const { ApplicationCommandOptionType } = require("discord.js");
const { client } = require("../index.js");
const userDB = require("../models/user_db.js");
const serverDB = require("../models/server_db.js");

module.exports = {
  data: {
    name: "birthday_show",
    description: "🖥データベースに登録された情報を表示します",
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "type",
        description: "何の情報を表示しますか",
        required: true,
        choices: [
          { name: "サーバー全体", value: "all" },
          { name: "個人", value: "user" },
        ],
      },
      {
        type: ApplicationCommandOptionType.User,
        name: "user",
        value: "user",
        description:
          "誰の情報を表示しますか？（「全体の情報を表示」を選んだ場合は、無視されます）",
        required: false,
      },
    ],
  },
  async execute(interaction) {
    //誕生日を祝う機能が使えるか確認
    console.log("birthday show");
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
        if (model.status == "false") {
          console.log("birth show_cannot use error send");
          return interaction.reply({
            content:
              "申し訳ございません。このサーバーでは誕生日を祝う機能が利用できません。\nあなたがサーバーの管理者である場合は、`/server_setting`コマンドから設定を有効にできます。",
            ephemeral: true,
          });
        } else if (model.status == "true") {
    console.log("show start")
          await interaction.deferReply();

          let show_type = interaction.options.getString("type");
          let show_user = interaction.options.getUser("user");

          if (show_type == "all") {
            console.log("all show");
            userDB
              .find({
                serverID: interaction.guild.id,
              })
              .then(async (models) => {
                if (models.length) {
                  let member_list = [];
                  for (const key in models) {
                    let user_id = models[key].uid;
                    let user = await client.users.fetch(user_id);
                    let user_name = user.username;
                    let display_name = user.globalName;
                    let push_text = `${display_name}(@${user_name})`;
                    member_list.push(push_text);
                  }
                  console.log("all showed");
                  await interaction.editReply({
                    embeds: [
                      {
                        title: "現在、データベースに登録されているユーザー一覧",
                        description: `\`\`\`\n${member_list.join(
                          "\n"
                        )}\n\`\`\``,
                        color: 0xaad0ff,
                        timestamp: new Date(),
                      },
                    ],
                  });
                } else {
                  console.log("show no_user_data_error");
                  await interaction.editReply("誰も誕生日を登録していません。");
                }
              });
          } else if (show_type == "user") {
            console.log("show user");
            if (show_user !== null) {
              const isBot = (await client.users.fetch(show_user)).bot;
              if (!isBot) {
                console.log("show get userdb");
                userDB
                  .findOne({
                    uid: interaction.user.id,
                    serverID: interaction.guild.id,
                  })
                  .then(async (model) => {
                    if (!model) {
                      console.log("show user_nodata");
                      await interaction.editReply({
                        content: "誕生日が登録されていません。",
                        ephemeral: false,
                      });
                    } else {
                      let database_month = model.birthday_month;
                      let database_day = model.birthday_day;

                      console.log("showed user data");
                      await interaction.editReply({
                        content: "",
                        embeds: [
                          {
                            title: `${show_user.username}さんの情報`,
                            description: `ユーザー名：　\`${show_user.username}\`\nユーザーID：　\`${show_user.id}\`\n誕生日(登録されたもの)：　\`${database_month}月${database_day}日\``,
                          },
                        ],
                        ephemeral: false,
                      });
                    }
                  });
              } else {
                console.log("show it_is_not_user");
                await interaction.editReply({
                  content: "",
                  embeds: [
                    {
                      title: "エラー！",
                      description:
                        "指定された対象は「<:bot:1050345033305436170>」です。\n残念ながら、私は彼らの誕生日を祝う事が出来ません。対象には人を選んでください。",
                      color: 0xff0000,
                    },
                  ],
                });
              }
            } else {
              console.log("show user no_user");
              await interaction.editReply({
                content: "",
                embeds: [
                  {
                    title: "エラー！",
                    description:
                      "誕生日の情報を表示する対象を指定してください。\n　例)　`/birthday_show [個人]　[@Hoshimikan6490]`",
                    color: 0xff0000,
                  },
                ],
              });
            }
          }
        }
      });
  },
};
