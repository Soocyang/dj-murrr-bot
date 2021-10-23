const Discord = require('discord.js')
const { Playlist } = require('../../service/Playlist')
const MusicPlayer = require('../../index.js').musicPlayer

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'getqueue',
	aliases: ['gq', 'pq'],
	description: 'Show and play from saved queue/playlist',
	maxArgs: 1,
	expectedArgs: '[position]',
	callback: async ({ message, interaction, channel, member, guild }) => {
		const { intArr, playlists } = await getSavedQueueInfo(message, channel)

		// Check if get queue err
		if (intArr.length === 0) return

		// Creating collector listening to user input
		const filter = (m) => intArr.includes(m.content)
		let collector

		if (interaction) {
			collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 15000 })
		} else {
			collector = message.channel.createMessageCollector({ filter, max: 1, time: 15000 })
		}

		collector.on('collect', async (m) => {
			// Check is bot in vc
			let guildMember
			let voiceChannel

			if (message) {
				const guildInfo = message.channel.guild
				guildMember = guildInfo.members.cache.find((user) => user.id === message.author.id)
				voiceChannel = guildMember.voice.channel
			} else {
				guildMember = guild.members.cache.find((user) => user.id === member.user.id)
				voiceChannel = guildMember.voice.channel
			}

			if (!voiceChannel)
				return channel.send('You need to be in a voice channel to play the queue!')

			if (!MusicPlayer.connection) {
				const res = MusicPlayer.join(voiceChannel)
				await channel.send(res)
				await channel.send(
					`:minidisc: **Starting player in <#${voiceChannel.id}> and bounded to** <#${channel.id}>`
				)
			}

			// find and get playlist
			const playlist = playlists[parseInt(m) - 1]
			const replies = await m.reply(`Adding \`${playlist.title}\` to queue`)

			const playlistInfo = await Playlist.findById(playlist._id)

			MusicPlayer.songQueue.push(...playlistInfo.playlist)

			const embed = new Discord.MessageEmbed()
				.setColor('#eaeaea')
				.setTitle(`**Added to queue!**`)
				.setDescription(`**Saved Queue Title: \`${playlistInfo.title}\`**`)
				.addField('Total tracks', `${playlistInfo.totalSongs}`, true)
				.addField('Author', `<@${playlistInfo.author_id}>`, true)

			replies.edit({ embeds: [embed] })

			// Check is player playing
			if (!MusicPlayer.isPlaying) {
				MusicPlayer.currentTrackIndex += 1
				// Start the player flag from -1 to 0
				MusicPlayer.play(channel)
				// Set isPlaying true
				MusicPlayer.isPlaying = true
				const timeElapsed = Date.now()
				const currDatetime = new Date(timeElapsed)
				console.log(
					`Starting Player in ${message.guild.name} at ${currDatetime.toLocaleString()}`
				)
			}
		})

		collector.on('end', (collected) => {
			// if (collected.size === 0) message.reply('**Please try again DJ Murrr do not received any input from you!**')
		})
	},
}

/**
 * Get Queue Info Embed
 * @param  {} message
 */
const getSavedQueueInfo = async (message, channel) => {
	// Fetch all playlist from db
	let playlists
	try {
		playlists = await Playlist.find(
			{ guild_id: `${channel.guild.id}` },
			{ __v: 0, playlist: 0 }
		)
	} catch (error) {
		message.reply('**⚠ Error fetching saved queue**')
		return { intArr: [], playlists: null }
	}

	// Putting playlist info together
	let playlistsInfo = ''
	const intArr = []
	playlists.forEach((playlist, index) => {
		intArr.push(`${index + 1}`)
		playlistsInfo += `\`${index + 1}.\` **${playlist.title}** • \` ${
			playlist.totalSongs
		} songs\` • <@${playlist.author_id}>\n`
	})

	// Setting embed
	const embed = new Discord.MessageEmbed()
		.setColor('#eaeaea')
		.setTitle('**Saved Queue**')
		.setDescription(
			`${
				intArr.length !== 0 ? playlistsInfo : `Saved queue is empty add some now!`
			} \n**Reply with the position of the saved queue to play it!**\n`
		)

	message.reply({ embeds: [embed] })

	return { intArr, playlists }
}
