const Discord = require("discord.js");
const bot = require("../../index.js");
const musicPlayer = bot.musicPlayer;

module.exports = {
	slash: "both",
	testOnly: true,
	name: "queue",
	aliases: ['q'],
	category: "Music",
	description: "Shows all enqueued songs",
	init: (client) => {
		client.on("messageCreate", (message) => {
			if (musicPlayer.latestCmd == "queue") {
				musicPlayer.handleQueuePaging(message);
			}
		});

		client.on("messageReactionAdd", (reaction) => {
			musicPlayer.handleQueueReaction(reaction);
		});

		client.on("messageReactionRemove", (reaction) => {
			musicPlayer.handleQueueReaction(reaction);
		});
	},
	callback: ({ interaction, message, channel, client, guild, member }) => {
		let guildInfo;
		let guildMember;
		let voiceChannel;
		let textChannel;

		if (message) {
			musicPlayer.latestCmd = "queue";
			guildInfo = message.channel.guild;
			guildMember = guildInfo.members.cache.find((user) => user.id === message.author.id);
			voiceChannel = guildMember.voice.channel;
			textChannel = message.channel;
		} else {
			musicPlayer.latestCmd = interaction.commandName;
			guildInfo = guild;
			guildMember = guild.members.cache.find((user) => user.id === member.user.id);
			voiceChannel = guildMember.voice.channel;
			textChannel = channel;
		}

		if (!voiceChannel) return "You need to be in a voice channel to execute this command!";
		if (!musicPlayer.connection) return "DJ Murrr is not playing music in the server right now";
		const voiceChannelId = musicPlayer.connection.packets.state.channel_id;
		if (voiceChannel.id !== voiceChannelId) {
			return `You need to be in the same voice channel <#${voiceChannelId}> as <@${client.user.id}> to use this command!`;
		}

		// Queue function here
		const res = musicPlayer.getQueue(guildInfo, textChannel);

		// if (message) {
		// 	textChannel.send({ embeds: [res] }).then((msg) => {
		// 		musicPlayer.handleQueuePaging(msg);
		// 	});
		// }

		return res;
	},
};
