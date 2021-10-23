const { Playlist } = require('../../service/Playlist')
const musicPlayer = require('../../index.js').musicPlayer

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'savequeue',
	aliases: ['sq'],
	description: 'Save current the current song queue to a playlist that can play in future!',
	minArgs: 1,
	expectedArgs: '<title>',
	callback: async ({ message, interaction, text }) => {
		const reply = await message.reply(`Saving queue...`)

		// init data
		const title = text
		const user_id = interaction ? interaction.member.id : message.author.id
		const guild_id = interaction ? interaction.guildId : message.guildId

		// get player current playlist/queue
		if (musicPlayer.songQueue.length <= 0)
			reply.edit('**⚠ Unable to save empty a song queue!**')

		// Save queue to db
		const playlist = new Playlist({
			title: title,
			author_id: user_id,
			guild_id: guild_id,
			playlist: musicPlayer.songQueue,
			totalSongs: musicPlayer.songQueue.length,
		})

		playlist.save(function (err) {
			if (err) {
				console.log(err)
				reply.edit(`**Error saving playlist!**`)
			}
		})

		reply.edit(`Queue saved as **${text}**!`)
	},
}
