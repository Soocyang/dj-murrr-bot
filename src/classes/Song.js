class Song {
	constructor(title, url, duration, length, author, thumbail, username, avatar) {
		this.title = title;
		this.url = url;
		this.duration = duration;
		this.length = length;
		this.author = author;
		this.thumbail = thumbail;
		this.username = username;
		this.userpic = avatar;
	}

	setTitle() {
		this.title = title;
	}
	setUrl() {
		this.url = url;
	}
	setDuration() {
		this.duration = duration;
	}
	setLength() {
		this.length = length;
	}
	setAuthor() {
		this.author = author;
	}
	setThumbail() {
		this.thumbail = thumbail;
	}
	setUsername() {
		this.username = username;
	}
	setAvatar() {
		this.avatar = avatar;
	}
}

module.exports = Song;
