const moment = require('moment')
const Discord = require('discord.js')
const { getVoiceConnection } = require('@discordjs/voice')

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'ping',
	description: "Check the bot's ping",
	callback: async ({
		message, // The DJS message object
		client, // Your bot's client object
		interaction,
		channel, // The DJS channel object
		// args, // An array of arguments without the command prefix/name
		// text, // A joined string of the above arguments
		// prefix, // The prefix used to run this command
		// instance, // Your WOKCommands instance
	}) => {
		const guildInfo = channel.guild
		const connection = getVoiceConnection(guildInfo.id)
		const RTCLatency = connection ? connection.ping.udp : ''
		const djsApiPing = client.ws.ping

		const sent = interaction
			? await interaction.reply({ content: 'Pinging...', fetchReply: true })
			: await message.reply({ content: 'Pinging...', fetchReply: true })

		const roundtripLatency = interaction
			? sent.createdTimestamp - interaction.createdTimestamp
			: sent.createdTimestamp - message.createdTimestamp

		const embed = new Discord.MessageEmbed()
			.setColor('#eaeaea')
			.setThumbnail(
				'https://cdn.discordapp.com/attachments/805260211329433601/891248045210103808/cats-ping-pong.gif'
			)
			.setTitle('**Pong!**')
			.setDescription(
				`💓 Discord API latency: \`${djsApiPing}ms\` \n` +
					`⌛ Actual latency: \`${roundtripLatency}ms\`\n` +
					`${RTCLatency !== '' ? `⏲ RTC latency: \`${RTCLatency}ms\`` : ''} `
			)
			.setFooter(
				`${client.user.username} | ${moment(Date.now()).format('LLL')}`,
				client.user.displayAvatarURL()
			)

		interaction ? interaction.editReply({ embeds: [embed] }) : sent.edit({ embeds: [embed] })
	},
}
