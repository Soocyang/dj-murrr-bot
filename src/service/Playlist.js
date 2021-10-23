const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const PlaylistSchema = new Schema({
	title: String,
	author_id: String,
	guild_id: String,
	playlist: [{}],
	totalSongs: Number,
	totalLength: String,
	createdAt: { type: Date, default: Date.now },
})

const Playlist = mongoose.model('Playlist', PlaylistSchema)

module.exports = { Playlist }
