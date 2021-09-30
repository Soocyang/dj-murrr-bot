const Discord = require("discord.js");
const bot = require("../index.js");
const musicPlayer = bot.musicPlayer;

module.exports = {
	slash: "both",
	testOnly: true,
	name: "disconnect",
	aliases: ["dis", "leave"],
	category: "Music",
	description: "Disconnect from the voice channel and reset player queue.",
	callback: ({ message, channel, client, guild, member }) => {
		let guildMember;
		let user;
		let voiceChannel;
		let textChannel;

		if (message) {
			const guildInfo = message.channel.guild;
			guildMember = guildInfo.members.cache.find((user) => user.id === message.author.id);
			user = message.author;
			voiceChannel = guildMember.voice.channel;
			textChannel = message.channel;
		} else {
			guildMember = guild.members.cache.find((user) => user.id === member.user.id);
			user = new Discord.User(client, guildMember.user);
			voiceChannel = guildMember.voice.channel;
			textChannel = channel;
		}

		if (!voiceChannel) return "You need to be in a voice channel to execute this command!";
		if (!musicPlayer.connection) return "DJ Murrr is not playing music in the server right now";
		if (voiceChannel.id !== musicPlayer.connection.packets.state.channel_id) {
			return `You need to be in the same voice channel <#${musicPlayer.connection.packets.state.channel_id}> as <@${client.user.id}> to use this command!`;
		}
		const res = musicPlayer.disconnect();

		// if (message) {
		// 	message.reply("**📤 Player Disconnected**");
		// }

		return res;
	},
};
