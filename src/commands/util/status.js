const setStatus = (client, status) => {
	client.user.setStatus(status)
}

module.exports = {
	slash: 'both',
	testOnly: true,
	name: 'status',
	description: 'Set bot status',
	minArgs: 1,
	expectedArgs: '<status>',
	ownerOnly: true,
	callback: async ({ client, text }) => {
		if (!['online', 'idle', 'dnd', 'invisible'].includes(text))
			return `Invalid status! Please enter <online|idle|dnd|invisible>`
		setStatus(client, text)
		return `Set status ${text}`
	},
}
