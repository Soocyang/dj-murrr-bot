const Discord = require("discord.js");
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	demuxProbe,
	VoiceConnectionStatus,
	AudioPlayerStatus,
	NoSubscriberBehavior,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const ytdlExec = require("youtube-dl-exec").raw;
const ytSearch = require("yt-search");
const ytsr = require("ytsr");
const randomColor = require("randomcolor");

const Song = require("../classes/Song.js");

//subfunction for searching yt video
const videoFinder = async (query) => {
	/*** using yt-search ***/
	// const vidResult = await ytSearch(query);
	// return vidResult.items.length > 1 ? vidResult.items[0] : null;

	/*** using ytsr ***/
	const vidResult = await ytsr(query, { limit: 1 });
	return vidResult.items.length > 0 ? vidResult.items[0] : null;
};

// let streamOptions = {
// 	seek: 0,
// 	volume: 0.5,
// 	highWaterMark: 1,
// };

let timeoutDisconnect;
let timeoutBreak;
let timeoutRemoveReaction;
let timeoutVolControl;

class MusicService {
	constructor() {
		this.player = {};
		this.connection = false;
		this.dispatcher = {};
		this.currentTrackIndex = -1;
		this.songQueue = [];
		this.loopFlag = false;
		this.loopQueueFlag = false;
		this.isPlaying = false;
		this.latestCmd = "";
		this.queueEmbedId = "";
		this.queueListing = "";
		this.queuePage = 0;
		this.volumeControlEmbedId = "";
		this.playerTimeout = 900000;
	}

	// PASSING:
	join(voiceChannel) {
		this.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});
		return `**Joined to** <#${voiceChannel.id}>`;
	}

	// REVIEW:
	async play(textChannel) {
		clearTimeout(timeoutDisconnect);

		const currentTrack = this.songQueue[this.currentTrackIndex];

		/*** NEWER ***/
		// const stream = ytdlExec(
		// 	currentTrack.url,
		// 	{
		// 		o: "-",
		// 		q: "",
		// 		f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
		// 		r: "100K",
		// 	},
		// 	{ stdio: ["ignore", "pipe", "ignore"] }
		// );

		/*** OLD ***/
		// const stream = ytdl(currentTrack.url, {
		// 	filter: "audio",
		// 	quality: "highestaudio",
		// 	highWaterMark: 1 << 25,
		// });

		this.player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Pause,
			},
		});

		/**
		 * With Newer
		 */
		// const resource = createAudioResource(stream.stdout);

		/*** LATEST ***/
		const resource = await this.createAudioResource(currentTrack);
		this.player.play(resource);

		// Subscribe to player

		try {
			await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
			this.dispatcher = this.connection.subscribe(this.player);
		} catch (error) {
			connection.destroy();
			textChannel.send("Error joining voice channel, please try again!");
			console.log(error);
		}

		// Loop flag true skip sending embed.
		if (!this.loopFlag) {
			const nowPlayingEmbed = this.nowPlaying();
			textChannel.send({ embeds: [nowPlayingEmbed] });
		}

		// Player on ends/finished
		this.player.on(AudioPlayerStatus.Idle, () => {
			if (!this.loopFlag) {
				this.currentTrackIndex += 1;
				// This setTimeout is for 5s break between each song
				timeoutBreak = setTimeout(() => {
					if (this.currentTrackIndex > this.songQueue.length - 1) {
						if (this.loopQueueFlag) {
							this.currentTrackIndex = 0;
							this.play(textChannel);
							return;
						}
						textChannel.send("The queue is empty now!");
						this.currentTrackIndex -= 1;
						this.isPlaying = false;
						timeoutDisconnect = setTimeout(() => {
							const res = this.disconnect();
							textChannel.send(res);
						}, this.playerTimeout);

						return;
					}
					this.play(textChannel);
				}, 5000);
			} else {
				this.play(textChannel);
			}
		});

		this.player.on("error", (error) => {
			textChannel.send("Error playing song, skip to next song");
			console.log(error);
		});
	}

	async addSongToQueue(textChannel, input, guildMember) {
		clearTimeout(timeoutDisconnect);

		// let songUrl;
		const playListId = this.validatePlaylistURL(input);

		// Validate song url
		if (ytdl.validateURL(input)) {
			const vidId = ytdl.getURLVideoID(input);
			const video = await videoFinder(vidId);
			const embed = this.pushOneSong(video, textChannel, guildMember);
			return embed;
		} else if (!!playListId) {
			try {
				// const filters1 = await ytsr.getFilters(input);
				// const filter1 = filters1.get("Type").get("Playlist");
				// console.log(testPlaylist);
				const playList = await ytSearch({ listId: playListId });
				const embed = this.queuePlaylist(textChannel, playList, guildMember);
				return embed;
			} catch (error) {
				console.log("Playlist not found");
				return "**⚠ Error! Song or Playlist Not Found!**";
			}
		} else {
			const video = await videoFinder(input);
			if (!video) {
				return "**⚠ Error! Song or Playlist Not Found!**";
			}
			// songUrl = video.url;
			const embed = this.pushOneSong(video, textChannel, guildMember);
			return embed;
		}
	}

	nowPlaying() {
		if (this.currentTrackIndex === -1) return "Player not playing";
		// console.log("now playing song index: " + this.currentTrackIndex);
		const currentTrack = this.songQueue[this.currentTrackIndex];
		// console.log(currentTrack.title);
		const embed = new Discord.MessageEmbed()
			.setColor(randomColor())
			.setTitle("🎵 Now Playing")
			.setDescription(`**[${currentTrack.title}](${currentTrack.url})**`)
			.setThumbnail(currentTrack.thumbail)
			.addField("Song duration", `⌚ ${currentTrack.duration}`, true)
			.addField("Channel", `🎤 ${currentTrack.author}`, true)
			.setFooter(`Requested by ${currentTrack.username}`, `${currentTrack.userpic}`);
		return embed;
	}

	// PASSING:
	skip(textChannel) {
		if (this.songQueue.length < 1) return "No song in the queue!";

		// If skipping last song --> destroy dispatcher
		if (this.songQueue.length - 1 === this.currentTrackIndex) {
			// If loopQueue Flag is on reset currentTrackIndex
			if (this.loopQueueFlag) {
				this.loopFlag = 0;
				this.currentTrackIndex = 0;
				try {
					this.play(textChannel);
					// this.isPlaying = 1;
					return "⏭ **Skipped**";
				} catch (e) {
					console.log(e);
					return "⚠ Error";
				}
			}

			this.player.stop();
			// this.currentTrackIndex -= 1;
			// this.isPlaying = false;
			// this.loopFlag = 0;

			return "⏭ **Skipped**";
		}

		this.loopFlag = 0;
		this.currentTrackIndex += 1;

		try {
			this.play(textChannel);
			// this.isPlaying = 1;
			return "⏭ **Skipped**";
		} catch (e) {
			console.log(e);
			return "⚠ Error";
		}
	}

	jump(textChannel, position) {
		const songIndex = parseInt(position);

		if (isNaN(songIndex) || songIndex <= 0 || songIndex > this.songQueue.length)
			return `**⚠ Invalid position number!**`;

		this.currentTrackIndex = songIndex - 1;
		this.loopFlag = 0;

		try {
			this.play(textChannel);
			// this.isPlaying = 1;
			return `⏭ **Jumped to position \`${songIndex}\` **`;
		} catch (e) {
			console.log(e);
			return "⚠ Error";
		}
	}

	getQueue(guildInfo, textChannel) {
		if (!this.songQueue.length) {
			return `**❕ Song Queue is Empty**`;
		}

		let totalDuration = 0;
		// Clear previous embed if exist
		if (this.queueEmbedId) {
			this.queuePage = 0;
			textChannel.messages.fetch(this.queueEmbedId).then((msg) => msg.delete());
		}

		const toMatrix = (arr, width) =>
			arr.reduce((rows, key, index) => {
				totalDuration += key.length;
				if (index % width == 0) {
					rows.push([{ index, key }]);
					return rows;
				} else {
					rows[rows.length - 1].push({ index, key });
					return rows;
				}
			}, []);

		let tempQueue = this.songQueue;
		let playedQueue = tempQueue.slice(0, this.currentTrackIndex);
		let upNextQueue = tempQueue.slice(this.currentTrackIndex);

		tempQueue = upNextQueue.concat(playedQueue);

		const result = toMatrix(tempQueue, 10);
		this.queueListing = result;

		// console.log(this.queueListing);

		const tracksDescription = this.getQueueByPage(this.queuePage);
		const totalDurationString = this.secondsToHms(totalDuration);

		const embed = new Discord.MessageEmbed()
			.setColor(randomColor())
			.setTitle(`💽 Song Queue for ${guildInfo.name}`)
			.setDescription(tracksDescription)
			.addField(
				`⠀`,
				`**Total songs \`${
					this.songQueue.length
				}\` | Total length \`${totalDurationString}\` ${this.loopQueueFlag ? "| 🔁" : ""} ${
					this.loopFlag ? "| 🔂" : ""
				}**`
			)
			.setFooter(`Showing Page 1/${this.queueListing.length}`, guildInfo.iconURL());

		return embed;
	}

	getQueueByPage(page) {
		let tracks = "";

		this.queueListing[page].forEach((item, i) => {
			const song = item.key;

			// array starts 0...
			let currentTrackIndex = this.currentTrackIndex + 1;
			let trackIndex = item.index + currentTrackIndex;

			if (trackIndex > this.songQueue.length) {
				trackIndex -= this.songQueue.length;
			}

			// Append 0 to single decimal num
			const trackIndexText = trackIndex < 10 ? "0" + trackIndex : trackIndex;

			if (i === 0) {
				tracks +=
					trackIndex === currentTrackIndex
						? "**🎵 Now Playing** \n"
						: trackIndex < currentTrackIndex
						? "**:ballot_box_with_check: Played  \n**"
						: "**⏩ Up Next  \n**";
			} else if (i === 1 && page === 0) {
				tracks +=
					trackIndex < currentTrackIndex
						? "**:ballot_box_with_check: Played  \n**"
						: "**⏩ Up Next  \n**";
			} else if (trackIndex === 1) {
				tracks += "**:ballot_box_with_check: Played  \n**";
			}

			tracks += `\`${trackIndexText}.\` [${song.title}](${song.url}) \`⌚${song.duration}\` : \`${song.username}\`\n\n`;
		});

		const descriptions = `${tracks}\n`;
		return descriptions;
	}

	pause() {
		this.player.pause();
		return "**⏸ Pasued**";
	}

	resume() {
		this.player.unpause();
		return "**▶ Resumed**";
	}

	loop() {
		this.loopFlag = !this.loopFlag;
		if (this.loopFlag)
			return `**🔂 Loop On: \`${this.songQueue[this.currentTrackIndex].title}\`**`;
		return `**▶ Loop Off**`;
	}

	loopqueue() {
		this.loopQueueFlag = !this.loopQueueFlag;
		if (this.loopQueueFlag) return `**🔁 Loop Queue On**`;
		return `**▶ Loop Queue Off**`;
	}

	shuffleQueue() {
		let currentTrack = this.songQueue[this.currentTrackIndex];
		this.songQueue.splice(this.currentTrackIndex, 1);
		this.shuffle(this.songQueue);
		this.songQueue.splice(0, 0, currentTrack);
		this.currentTrackIndex = 0;
		return `**🔀 Shuffled Queue !**`;
	}

	pushTop(position) {
		const songIndex = parseInt(position);

		if (isNaN(songIndex) || songIndex <= 0 || songIndex > this.songQueue.length)
			return `**⚠ Invalid position number!**`;

		let song = this.songQueue[songIndex - 1]; // Get song to push

		this.songQueue.splice(songIndex - 1, 1); // Delete the song from orig position

		this.songQueue.splice(this.currentTrackIndex + 1, 0, song); // Push song to next playing song

		return `**:ballot_box_with_check: Pushed \`${song.title}\` **`;
	}

	move(input) {
		const inputInt = input.map((arg) => parseInt(arg));
		const fromIndex = inputInt[0] - 1;
		const toIndex = inputInt[1] - 1;

		if (inputInt.includes(NaN) || inputInt.some((index) => index <= 0))
			return `**⚠ Invalid position number!**`;

		if (inputInt.some((index) => index > this.songQueue.length))
			return `**⚠ Invalid position number!**`;

		if (fromIndex === toIndex) return `**⚠ Same position detected**`;

		let song = this.songQueue[fromIndex];
		this.songQueue.splice(fromIndex, 1);
		this.songQueue.splice(toIndex, 0, song);

		return `**:ballot_box_with_check: Moved \`${song.title}\` from \`${fromIndex + 1}\` to \`${
			toIndex + 1
		}\`**`;
	}

	//PASSING:
	remove(positions, guildMember, textChannel) {
		const positionsArr = positions.split(" ");
		const indexes = positionsArr.map((index) => parseInt(index));

		if (indexes.includes(NaN) || indexes.some((index) => index <= 0))
			return `**⚠ Invalid position number!**`;

		if (indexes.some((index) => index > this.songQueue.length))
			return `**⚠ Invalid position number!**`;

		// Remove duplicates
		const uniqueIndexes = [...new Set(indexes)];

		// Filter out song to remove from main queue lists
		const filteredTracks = this.songQueue.filter((song, index) =>
			uniqueIndexes.includes(index + 1)
		);

		// Merge song to remove index (the real "index") and song to remove lists
		const tracksToRemove = filteredTracks.map((song, index) => {
			return { song, trackIndex: uniqueIndexes[index] - 1 };
		});

		let embedDesc = "";

		tracksToRemove.forEach((track, index) => {
			const { song, trackIndex } = track;
			// Remove song in songQueue
			this.songQueue.splice(trackIndex - index, 1);
			// PASSING: Update currentTrackIndex
			if (trackIndex < this.currentTrackIndex) this.currentTrackIndex -= 1;
			if (this.currentTrackIndex === trackIndex - index) {
				if (this.songQueue.length === 0) {
					this.player.stop();
					this.currentTrackIndex = -1;
					this.isPlaying = false;
					this.loopFlag = false;
					this.loopQueueFlag = false;
				} else {
					this.play(textChannel);
				}
			}

			embedDesc += `\`${trackIndex + 1}.\` [${song.title}](${song.url}) - \`${
				song.author
			}\`\n\n`;
			// console.log(`Removed ${song.title}`);
		});

		const embed = new Discord.MessageEmbed()
			.setColor(randomColor())
			.setAuthor(
				`Removed ${tracksToRemove.length} song(s) from the queue.`,
				guildMember.user.avatarURL()
			)
			.setDescription(embedDesc);
		return embed;
	}

	// PASSING:
	clearQueue() {
		this.player.stop();
		this.currentTrackIndex = -1;
		this.isPlaying = false;
		this.loopFlag = false;
		this.loopQueueFlag = false;
		this.songQueue = [];
		// timeoutDisconnect = setTimeout(() => {
		// 	const res = this.disconnect();
		// 	textChannel.send(res);
		// }, this.playerTimeout);

		return "**:ballot_box_with_check: Cleared song queue**";
	}

	disconnect() {
		clearTimeout(timeoutBreak);
		this.connection.destroy();
		this.connection = false;
		this.dispatcher = {};
		this.player = {};
		this.currentTrackIndex = -1;
		this.songQueue = [];
		this.loopFlag = false;
		this.loopQueueFlag = false;
		this.isPlaying = false;
		// streamOptions.volume = 0.5;

		return "**📤 Player Disconnected**";
	}

	async queuePlaylist(textChannel, playList, guildMember) {
		let song;
		const alertInfo = playList.alertInfo === "" ? "--" : playList.alertInfo;

		playList.videos.forEach((video) => {
			const songUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

			song = new Song(
				video.title,
				songUrl,
				video.duration.timestamp,
				video.duration.seconds,
				video.author.name,
				video.thumbnail,
				`${guildMember.nickname || ""}(${guildMember.user.username})`,
				guildMember.user.avatarURL() ||
					`https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`
			);
			this.songQueue.push(song);
		});

		const embed = new Discord.MessageEmbed()
			.setColor(randomColor())
			.setTitle(`📥 Queued Playlist`)
			.setDescription(`**[${playList.title}](${playList.url})**`)
			.setThumbnail(playList.thumbnail)
			.addField("Total tracks", `${playList.size}`, true)
			.addField("Author", `${playList.author.name}`, true)
			.addField("More info", `${alertInfo}`, false)
			.setFooter(
				`Requested by ${guildMember.nickname || ""}(${guildMember.user.username})`,
				`${
					guildMember.user.avatarURL() ||
					`https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`
				}`
			);

		if (!this.isPlaying) {
			this.currentTrackIndex += 1;
			// Start the player flag from -1 to 0
			this.play(textChannel);
			// Set isPlaying true
			this.isPlaying = true;
			console.log("Starting Player...");
			return embed;
		} else {
			return embed;
		}
	}

	// async pushOneSong(songUrl, textChannel, guildMember) {
	async pushOneSong(songDetails, textChannel, guildMember) {
		let song;
		try {
			// Get Song details
			// const songDetails = (await ytdl.getBasicInfo(video.url)).videoDetails;

			const durationInMMSS = songDetails.duration.split(":");
			const songLength =
				durationInMMSS.length > 1
					? parseInt(durationInMMSS[0]) * 60 + parseInt(durationInMMSS[1])
					: 0;

			// const songLength = parseInt(songDetails.lengthSeconds);
			// const songDuration = this.secondsToHms(songLength);

			song = new Song(
				songDetails.title,
				songDetails.url,
				songDetails.duration,
				songLength,
				songDetails.author.name,
				songDetails.bestThumbnail.url,
				`${guildMember.nickname || ""}(${guildMember.user.username})`,
				guildMember.user.avatarURL() ||
					`https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`
			);

			this.songQueue.push(song);
			// textChannel.send("Added to queue");
		} catch (error) {
			console.log(error);
			textChannel.send("**⚠ Error adding song to queue**");
		}

		if (this.isPlaying) {
			//if Yes reply song added to the queue
			const embed = new Discord.MessageEmbed()
				.setColor(randomColor())
				.setAuthor("Song added to the queue", song.userpic)
				.setDescription(`**[${song.title}](${song.url})**`)
				.setThumbnail(song.thumbail)
				.addField("Song duration", `⌚ ${song.duration}`, true)
				.addField("Channel", `🎤 ${song.author}`, true);

			return embed;
		} else {
			this.currentTrackIndex += 1;
			// Start the player flag from -1 to 0
			this.play(textChannel);
			// Set isPlaying true
			this.isPlaying = true;
			console.log("Starting Player...");
			return "STARTING_PLAYER";
		}
	}

	handleQueueReaction(reaction) {
		if (reaction.message.id === this.queueEmbedId) {
			if (reaction.emoji.name === "◀") {
				this.queuePage -= 1;
				if (this.queuePage < 0) {
					this.queuePage += 1;
					return;
				}
			}
			if (reaction.emoji.name === "▶") {
				this.queuePage += 1;
				if (this.queuePage >= this.queueListing.length) {
					this.queuePage -= 1;
					return;
				}
			}

			// Retrieve message embed
			const retrievedEmbed = reaction.message.embeds[0];
			const queuePage = this.getQueueByPage(this.queuePage);
			const editedEmbed = new Discord.MessageEmbed(retrievedEmbed)
				.setDescription(queuePage)
				.setFooter(
					`Showing Page ${this.queuePage + 1}/${this.queueListing.length}`,
					reaction.message.guild.iconURL()
				);
			reaction.message.edit({ embeds: [editedEmbed] });
		}
	}

	async handleQueuePaging(message) {
		// ClearTimeout for remove reaction of previous queue embed.
		if (timeoutRemoveReaction) {
			clearTimeout(timeoutRemoveReaction);
			timeoutRemoveReaction = null;
		}

		// Return if song queue has less than 10 songs
		if (this.songQueue.length <= 10) {
			// Reset latest cmd
			this.latestCmd = "";
			return;
		}

		// PASSING: IF the message has embed --> Assume is Queue Embed
		if (message.embeds.length) {
			await message.react("◀");
			await message.react("▶");

			this.queueEmbedId = message.id;

			timeoutRemoveReaction = setTimeout(() => {
				message.reactions
					.removeAll()
					.catch((error) => console.error("Failed to clear reactions: ", error));
				this.queueEmbedId = "";
				this.queuePage = 0;
			}, 60000);
		}

		// Reset latest cmd
		this.latestCmd = "";
	}

	// volumeControl() {
	// 	this.latestCmd = "volume";
	// 	streamOptions.volume;

	// 	const embed = new Discord.MessageEmbed()
	// 		.setColor(randomColor())
	// 		.setTitle(`Current Volume: \`${streamOptions.volume * 100}\`%`);
	// 	return embed;
	// }

	async handleVolumeControlReaction(message) {
		// ClearTimeout for remove reaction of vol control.
		if (timeoutVolControl) {
			clearTimeout(timeoutVolControl);
			timeoutVolControl = null;
		}

		if (message.embeds.length) {
			await message.react("🔉");
			await message.react("🔊");

			this.volumeControlEmbedId = message.id;

			timeoutVolControl = setTimeout(() => {
				message.reactions
					.removeAll()
					.catch((error) => console.error("Failed to clear reactions: ", error));
				this.queueEmbedId = "";
				this.queuePage = 0;
			}, 60000);
		}

		// reset latest cmd
		this.latestCmd = "";
	}

	// handleVolumeChange(reaction) {
	// 	if (reaction.message.id === this.volumeControlEmbedId) {
	// 		if (reaction.emoji.name === "🔉") {
	// 			if (streamOptions.volume === 0.1) return;
	// 			streamOptions.volume = Math.round((streamOptions.volume - 0.1) * 10) / 10;
	// 		}
	// 		if (reaction.emoji.name === "🔊") {
	// 			if (streamOptions.volume === 1) return;
	// 			streamOptions.volume = Math.round((streamOptions.volume + 0.1) * 10) / 10;
	// 		}

	// 		// Set volume
	// 		this.dispatcher.setVolume(streamOptions.volume);

	// 		// Retrieve message embed
	// 		const retrievedEmbed = reaction.message.embeds[0];
	// 		const editedEmbed = new Discord.MessageEmbed(retrievedEmbed).setTitle(
	// 			`Current Volume: \`${Math.round(streamOptions.volume * 100)}\`%`
	// 		);

	// 		reaction.message.edit(editedEmbed);
	// 	}
	// }

	validatePlaylistURL(url) {
		var regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match && match[2]) {
			const playListId = match[2];
			return playListId;
		}
		return false;
	}

	secondsToHms(d) {
		d = Number(d);
		var h = Math.floor(d / 3600);
		var m = Math.floor((d % 3600) / 60);
		var s = Math.floor((d % 3600) % 60);

		var hDisplay = h > 0 ? `${h}:` : "";
		var mDisplay = m > 0 ? `${m}:` : "";
		var sDisplay = s > 0 ? s : "";
		return hDisplay + mDisplay + sDisplay;
	}

	shuffle(array) {
		var currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	}

	async createAudioResource(currentTrack) {
		return new Promise((resolve, reject) => {
			const process = ytdlExec(
				currentTrack.url,
				{
					o: "-",
					q: "",
					f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
					r: "100K",
				},
				{ stdio: ["ignore", "pipe", "ignore"] }
			);
			if (!process.stdout) {
				reject(new Error("No stdout"));
				return;
			}
			const stream = process.stdout;
			const onError = (error) => {
				if (!process.killed) process.kill();
				stream.resume();
				reject(error);
			};
			process
				.once("spawn", () => {
					demuxProbe(stream)
						.then((probe) =>
							resolve(
								createAudioResource(probe.stream, {
									metadata: this,
									inputType: probe.type,
								})
							)
						)
						.catch(onError);
				})
				.catch(onError);
		});
	}
}

module.exports = MusicService;
