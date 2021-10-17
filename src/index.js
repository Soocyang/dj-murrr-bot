require("dotenv").config();
const { Client, Intents } = require("discord.js");
const WOKCommands = require("wokcommands");
const path = require("path");
const MusicService = require("./service/MusicService.js");

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
	partials: ["MESSAGE", "REACTION"],
});

let musicPlayer = new MusicService();
let botPrefix = "--";

module.exports = {
	musicPlayer: musicPlayer,
	botPrefix: botPrefix,
};

client.once("ready", async () => {
	console.log("DJ Murrr is Online!");
	client.user.setActivity(`=help`, { type: "PLAYING" });

	new WOKCommands(client, {
		commandsDir: path.join(__dirname, "commands"),
		testServers: [process.env.GUILD_ID],
		showWarns: false,
	})
		.setDefaultPrefix(botPrefix)
		.setBotOwner(process.env.MY_USER_ID)
		.setCategorySettings([
			{
				name: "Music",
				emoji: "🎵",
			},
		]);
});

client.login(process.env.BOT_TOKEN);
