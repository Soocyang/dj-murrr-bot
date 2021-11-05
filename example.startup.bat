@REM Delay batch script from running to allow internet connection to ready b4 hand.
TIMEOUT 3

@REM Your project/bot directory path
cd Programming\Discord-Bot

@REM Run the command, you can just use npm start if you want but when it crash it will not auto restart the bot
@REM Thus prefer to use pm2 to manage the process!
pm2 start bot.js

cmd /k