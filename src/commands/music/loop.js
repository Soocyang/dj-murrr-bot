const bot = require('../../index.js')
const musicPlayer = bot.musicPlayer

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'loop',
	aliases: ['lo'],
	category: 'Music',
	description: 'Toggle loop for currently playing song',
	callback: ({ message, channel, client, guild, member }) => {
		let guildMember
		let voiceChannel
		let textChannel

		if (message) {
			const guildInfo = message.channel.guild
			guildMember = guildInfo.members.cache.find((user) => user.id === message.author.id)
			voiceChannel = guildMember.voice.channel
			textChannel = message.channel
		} else {
			guildMember = guild.members.cache.find((user) => user.id === member.user.id)
			voiceChannel = guildMember.voice.channel
			textChannel = channel
		}

		if (!voiceChannel) return 'You need to be in a voice channel to execute this command!'
		if (!musicPlayer.connection) return 'DJ Murrr is not playing music in the server right now'
		if (voiceChannel.id !== musicPlayer.connection.packets.state.channel_id) {
			return `You need to be in the same voice channel <#${musicPlayer.connection.packets.state.channel_id}> as <@${client.user.id}> to use this command!`
		}

		let response = musicPlayer.loop()

		// if (message) {
		// 	message.reply(response);
		// }

		return response
	},
}
