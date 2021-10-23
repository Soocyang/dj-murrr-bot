const bot = require("../../index.js");
const musicPlayer = bot.musicPlayer;

module.exports = {
	slash: "both",
	testOnly: true,
	name: "play",
	aliases: ["p"],
	category: "Music",
	description: "Play a song in your current voice channel or add song to the queue",
	minArgs: 1,
	expectedArgs: "<song>",
	callback: ({ message, channel, client, text, guild, member }) => {
		// console.log(text);
		const input = text;
		let guildMember;
		let voiceChannel;
		let textChannel;

		if (message) {
			const guildInfo = message.channel.guild;
			guildMember = guildInfo.members.cache.find((user) => user.id === message.author.id);
			voiceChannel = guildMember.voice.channel;
			textChannel = message.channel;
		} else {
			guildMember = guild.members.cache.find((user) => user.id === member.user.id);
			voiceChannel = guildMember.voice.channel;
			textChannel = channel;
		}

		if (!voiceChannel) return "You need to be in a voice channel to execute this command!";

		// Join player
		if (!musicPlayer.connection) {
			const res = musicPlayer.join(voiceChannel);

			textChannel.send(res);
			// Queue requested song
			musicPlayer.addSongToQueue(textChannel, input, guildMember).then((res) => {
				if (res === "STARTING_PLAYER") return;

				if (typeof res === String) {
					textChannel.send(res);
				} else {
					textChannel.send({ embeds: [res] });
				}
			});

			return `:minidisc: **Starting player in <#${voiceChannel.id}> and bounded to** <#${textChannel.id}>`;
		} else {
			// get vc_id;
			const voiceChannelId = musicPlayer.connection.packets.state.channel_id;

			if (voiceChannel.id !== voiceChannelId) {
				return `You need to be in the same voice channel <#${voiceChannelId}> as <@${client.user.id}> to use this command!`;
			}
			// Queue requested song
			musicPlayer.addSongToQueue(textChannel, input, guildMember).then((res) => {
				if (res === "STARTING_PLAYER") return;
				if (typeof res === String) {
					textChannel.send({ content: res });
				} else {
					textChannel.send({ embeds: [res] });
				}
			});
			return `🔎 **Searching** 🎤 \`${input}\``;
		}
	},
};
