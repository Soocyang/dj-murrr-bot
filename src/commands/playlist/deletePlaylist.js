const { Playlist } = require('../../service/Playlist')

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'deletequeue',
	aliases: ['dq', 'rq'],
	description: 'Delete the saved queue/playlist',
	minArgs: 1,
	expectedArgs: '<position>',
	callback: async ({ message, text, channel }) => {
		const reply = await message.reply(`Deleting queue...`)

		try {
			// init data
			const position = parseInt(text) - 1

			// Fetch all playlist from db
			let playlists
			playlists = await Playlist.find(
				{ guild_id: `${channel.guild.id}` },
				{ __v: 0, playlist: 0 }
			)

			// Search and delete queue in db
			const selectedQueue = playlists[position]
			Playlist.findByIdAndDelete(selectedQueue._id, (err, doc) => {
				console.log(
					err
						? err
						: `Queue ${doc.title}:${
								doc.author_id
						  } deleted at ${new Date(Date.now()).toLocaleString()}`
				)
			})

			reply.edit(`**📤 Queue ${selectedQueue.title} deleted!**!`)
		} catch (error) {
			reply.edit('**⚠ Error deleting saved queue**')
		}
	},
}
