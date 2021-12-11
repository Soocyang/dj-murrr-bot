require('dotenv').config()
const { Client, Intents } = require('discord.js')
const WOKCommands = require('wokcommands')
const path = require('path')
const mongoose = require('mongoose')

const MusicService = require('./service/MusicService.js')

mongoose.connect(process.env.MONGO_URI, { keepAlive: true, keepAliveInitialDelay: 300000 }).then(
	() => console.log('Connected to DB!'),
	(err) => console.log(err)
)

const client = new Client({
	// intents
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Intents.FLAGS.GUILD_INTEGRATIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	],
	// Use recommended partials for the built-in help menu
	partials: ['MESSAGE', 'REACTION'],
})

let musicPlayer = new MusicService()
let botPrefix = process.env.PREFIX

module.exports = {
	musicPlayer: musicPlayer,
	botPrefix: botPrefix,
}

client.once('ready', async () => {
	console.log('DJ Murrr is Online!')
	setPresence()
	setInterval(() => setPresence(), 86400000)

	new WOKCommands(client, {
		commandsDir: path.join(__dirname, 'commands'),
		testServers: [process.env.GUILD_ID, process.env.GUILD_ID_2],
		showWarns: false,
	})
		.setDefaultPrefix(botPrefix)
		.setBotOwner(process.env.MY_USER_ID)
		.setCategorySettings([
			{
				name: 'Music',
				emoji: '🎵',
			},
		])
})

function setPresence() {
	client.user.setActivity(`${botPrefix}help`, { type: 'PLAYING' })
}

client.login(process.env.BOT_TOKEN)
