const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	SlashCommandBuilder,
} = require('discord.js');
const Sentry = require('@sentry/node');
// for using sentry
require('../instrument');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('omikuji')
		.setDescription('🥠おみくじを引こう！！')
		.addStringOption((option) =>
			option
				.setName('secret')
				.setDescription('結果を非公開で送信したい場合は設定してください。')
				.setRequired(false)
				.addChoices({ name: '非公開にする', value: 'true' }),
		),

	run: (client, interaction, secretInput) => {
		try {
			const userInput = secretInput
				? secretInput
				: interaction.options.getString('secret');
			const secret = userInput === 'true';

			const omikuji_choice = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(secret ? 'secret_omi1' : 'omi1')
					.setLabel('を引く')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('1️⃣'),
				new ButtonBuilder()
					.setCustomId(secret ? 'secret_omi2' : 'omi2')
					.setLabel('を引く')
					.setStyle(ButtonStyle.Success)
					.setEmoji('2️⃣'),
				new ButtonBuilder()
					.setCustomId(secret ? 'secret_omi3' : 'omi3')
					.setLabel('を引く')
					.setStyle(ButtonStyle.Danger)
					.setEmoji('3️⃣'),
			);
			return interaction.reply({
				embeds: [
					{
						title: '↓直感で押して！↓',
						color: 0xff0000,
						thumbnail: {
							url: 'attachment://file.png',
						},
						footer: {
							text: `画像： フリーイラスト素材集 ジャパクリップ`,
						},
					},
				],
				files: [{ attachment: 'images/omikuji.png', name: 'file.png' }],
				components: [omikuji_choice],
				flags: MessageFlags.Ephemeral,
			});
		} catch (err) {
			Sentry.setTag('Error Point', 'omikuji');
			Sentry.captureException(err);
		}
	},
};
