import {GameGuild} from "./serverTypes.js";
import {AttachmentBuilder, EmbedBuilder, TextChannel} from "discord.js";
import {GetPlayersImage} from "../commands/common.js";
import {client} from "../main.js";
import {GetGuild} from "../storage/Db.js";

export async function logPlayerChange(gameGuild: GameGuild) {
    const serverInfo = await fetch(`https://api.mcsrvstat.us/3/${gameGuild.defaultServer.URL}`);
    const serverData = await serverInfo.json();
    let content = ""
    const embed = new EmbedBuilder()
    gameGuild.adminId = (await GetGuild(gameGuild.id)).adminId;
    if (!serverData.online && gameGuild.serverOnline) {
        gameGuild.serverOnline = false;
        if (gameGuild.adminId) {
            content=`Attention <@${gameGuild.adminId}>!`;
        }
        embed.setDescription(`Server url invalid or server is offline`);

        const channel = gameGuild.loggingChannelId
            ? (await client.channels.fetch(gameGuild.loggingChannelId)) as TextChannel
            : null;

        if (channel) {
            await channel.send({ content, embeds: [embed] });
        }
        return;
    }
    if (serverData.online) {
        gameGuild.serverOnline = true;
    }
    if (gameGuild.currentPlayersList) {
        const oldUUIDs = new Set(gameGuild.currentPlayersList.map(player => player.uuid));
        const newUUIDs = new Set(serverData.players.list.map(player => player.uuid));

        const joined = gameGuild.currentPlayersList.filter(player => !oldUUIDs.has(player.uuid));
        const left = serverData.players.list.filter(player => !newUUIDs.has(player.uuid));

        if (joined.length > 0 || left.length > 0) {
            try {
                let playerNameString = "";
                for (let i = 0; i < serverData.players.list.length; i++) {
                    const player = serverData.players.list[i];
                    playerNameString += `${player.name}, `;
                }
                playerNameString = playerNameString.trim().slice(0, -1);
                if (joined.length > 0) embed.addFields([{
                    name: 'Joined:',
                    value: joined.map(player => player.name).join(', ')
                }])
                if (left.length > 0) embed.addFields([{
                    name: 'Left:',
                    value: left.map(player => player.name).join(', ')
                }])
                embed.addFields([
                    { name: '\u200B', value: '\u200B' },
                    {name: `Playing:`, value: playerNameString, inline: true}
                ]);

                const combinedImage = await GetPlayersImage(serverData.players);
                const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
                embed.setImage(`attachment://players.png`);

                const channel = gameGuild.loggingChannelId
                    ? (await client.channels.fetch(gameGuild.loggingChannelId)) as TextChannel
                    : null;

                if (channel) {
                    await channel.send({
                        embeds: [embed],
                        files: [playerImage]
                    });
                }
            }
            catch (error) {
                console.error("Error in logPlayerChange:", error);
            }
        }
    }
    gameGuild.currentPlayersList = serverData.players.list;
}