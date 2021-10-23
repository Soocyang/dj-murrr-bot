const Discord = require("discord.js");
const { version } = require("../../../package.json");
//
const getEmbed = async (client) => {
	const user = await client.users.cache.find((user) => user.id === process.env.MY_USER_ID);
	const embed = new Discord.MessageEmbed()
		.setColor("#eaeaea")
		.setAuthor(client.user.username, client.user.displayAvatarURL())
		// .setThumbnail(client.user.displayAvatarURL())
		.setThumbnail(
			"https://media.discordapp.net/attachments/751684116109590670/891171749322973184/dj-cat.gif"
		)
		.setTitle("**Help Menu**")
		.setDescription("**Commands**\n\n" + "**:headphones: Musics :musical_note:**\n")
		.addFields(
			{
				name: "--play <song/url/playlist>",
				value: "Play songs in your current voice channel or add song(s) to the queue. \n `alias: --p` ",
				inline: true,
			},
			{
				name: "--queue",
				value: "Shows all enqueued songs \n `alias: --q`",
				inline: true,
			},
			{
				name: "--remove <positions>",
				value: "Remove song(s) the queue E.g. --remove 4 7 8 \n `alias: --rm`",
				inline: true,
			},
			{
				name: "--skip",
				value: "Skip currently playing song \n `alias: --s`",
				inline: true,
			},
			{
				name: "--loop",
				value: "Toggle loop for currently playing song \n `alias: --lo`",
				inline: true,
			},
			{
				name: "--loopqueue",
				value: "Toggle loop for current song queue \n `alias: --lq`",
				inline: true,
			},
			{
				name: "--pushtop <position>",
				value: "Move a specific song to the top (next playing) \n `alias: --pt`",
				inline: true,
			},
			{
				name: "--jump <position>",
				value: "Jumps to a specific song in the song queue \n `alias: --j`",
				inline: true,
			},
			{
				name: "--move <from:position> <to:position>",
				value: "Move a song to the specific position in the song queue \n `alias: --mv`",
				inline: true,
			},
			{
				name: "--nowplaying",
				value: "Shows currently playing song \n `alias: --np`",
				inline: true,
			},
			{
				name: "--shuffle",
				value: "Shuffles current song queue \n `alias: --sf`",
				inline: true,
			},
			{
				name: "--pause",
				value: "Pause the player \n `alias: --ps`",
				inline: true,
			},
			{
				name: "--resume",
				value: "Resume the player \n `alias: --rs`",
				inline: true,
			},
			{
				name: "--clear",
				value: "Clears the song queue and reset the player \n `alias: --cl`",
				inline: true,
			},
			{
				name: "--disconnect",
				value: "Disconnect from the voice channel and reset player queue. \n `alias: --dc/--leave`",
				inline: true,
			},
			{
				name: "--getqueue",
				value: "Show and play from saved queue/playlist \n `alias: --pq/--gq`",
				inline: true,
			},
			{
				name: "--savequeue",
				value: "Save current the current song queue to a playlist that can play in future! \n `alias: --sq`",
				inline: true,
			},
			{
				name: "--deletequeue",
				value: "Delete the saved queue/playlist \n `alias: --dq/--rq`",
				inline: true,
			}
		)
		// .setImage(
		// 	"https://media.discordapp.net/attachments/846048517830606868/890878385641889822/ezgif.com-gif-maker.gif"
		// )
		.setFooter(`Version: v${version} | By Murrr`, `${user.displayAvatarURL()}`);

	return embed;
};

module.exports = {
	slash: "both",
	testOnly: true,
	name: "help",
	description: "Shows a list of commands what DJ Murrr can do!",
	callback: async ({ client }) => {
		// console.log(message.content);
		const embed = getEmbed(client);

		return embed;
	},
};
