# 🎧 DJ Murrr Bot 

A discord bot allows you to streaming music from youtube and listen together with your friends! Built with NodeJS & DiscordJS

> This project is just for experiment and my own interests/project only. You may do your own customiszation for your own use!


## Pre-requisite

-   basic knowledge on Javascript and NodeJS.
-   know how to read documentation 😬

## Setup

1. DJ Murrr is using Node v16.9.1 thus Node version that above 16 is required. [Download NodeJS Here](https://nodejs.org/en/) on your machine.
2. Clone or download this repo as zip and extract it.
3. Open cli/powershell, run `npm install`
4. Replace the `.example.env`. to `.env` and change the require information accordingly
5. Create your own discord bot. Watch this [video](https://www.youtube.com/watch?v=JMmUW4d3Noc) will guide you how to create your own bot and more!
6. Start and run the bot `npm start`!
7. If you want to host on your machine or device. You can use [pm2](https://pm2.keymetrics.io/) to manage your bot.
8. If the bot start running as soon as you open you pc/laptop you can create your own [batch script](https://www.howtogeek.com/263177/how-to-write-a-batch-script-on-windows/) too! See *`example.startup.bat`*

## Limitation

- Try avoid streaming a music with length more than `1hr 30min`. The bot will crash when it reach the maximum limit of the length. This is due to the node js default limit of the memory usage and heap usage.
- When queuing playlist more than 100 songs/videos. Only the first `100 video` will added to the queue.
- `Save queue` feature only available when mongo connection is found. 
- The bot is not capable to stream music simutaneously in different server. **It will share the same song queue across the server.** **NOT** encourage to add the bot to **multiple server**.


## Help

If you don't understand something in the documentation, you are experiencing problems, or you have any ideas of suggestions, please don't hesitate to contact [me](https://discordapp.com/users/380295136774586369).
