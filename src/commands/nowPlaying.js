const bot = require("../index.js");

module.exports = {
	slash: "both",
	testOnly: true,
	name: "nowPlaying",
	aliases: ["np"],
	category: "Music",
	description: "Shows currently playing song",
	useNowPlaying: (msg) => {
		const embed = bot.musicPlayer.nowPlaying();
		msg.channel.send(embed);
	},
	callback: ({}) => {
		if (!bot.musicPlayer.connection)
			return "DJ Murrr is not playing music in the server right now";

		const embed = bot.musicPlayer.nowPlaying();
		return embed;
	},
};
