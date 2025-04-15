import {GameGuild} from "./serverTypes.js";
import {AttachmentBuilder, EmbedBuilder, TextChannel} from "discord.js";
import {GetPlayersImage} from "../commands/common.js";
import {client} from "../main.js";
import {GetGuild} from "../storage/Db.js";
import * as mc from 'minecraft-server-util'
import {JavaStatusResponse} from "minecraft-server-util";

export async function logPlayerChange(gameGuild: GameGuild) {
    let statusResponse: JavaStatusResponse
    let isOnline = false;

    try {
        statusResponse = await mc.status(gameGuild.defaultServer.Host);
        isOnline = true;
    } catch (error) {
        console.error(`Failed to query server ${gameGuild.defaultServer.Host}:`, error);
        return;
    }

    const embed = new EmbedBuilder()
    const channel = gameGuild.loggingChannelId
        ? (await client.channels.fetch(gameGuild.loggingChannelId)) as TextChannel
        : null;
    gameGuild.adminId = (await GetGuild(gameGuild.id)).adminId;

    if (!channel) return;
    if (!isOnline && gameGuild.serverOnline) {
        if (gameGuild.downCount < 2) {
            gameGuild.downCount += 1;
            return;
        }
        gameGuild.downCount = 0;
        let content = ""
        gameGuild.serverOnline = false;
        if (gameGuild.adminId) {
            if (gameGuild.adminId == "@everyone") {
                content = `Attention @everyone!`
            }
            else {
                content = `Attention <@${gameGuild.adminId}>!`;
            }
        }
        embed.setDescription(`Bot could not reach server, it may be offline!`);

        await channel.send({ content, embeds: [embed] });
        return;
    }
    else if (isOnline && gameGuild.currentPlayersList) {
        const oldUUIDs = new Set(gameGuild.currentPlayersList.map(player => player.id));
        const newUUIDs = new Set(statusResponse.players?.sample?.map(player => player.id) ?? []);

        const joined = statusResponse.players?.sample?.filter(player => !oldUUIDs.has(player.id)) ?? [];
        const left = gameGuild.currentPlayersList.filter(player => !newUUIDs.has(player.id));

        if (joined.length > 0 || left.length > 0) {
            let playerNameString = ""
            const toSend = {
                embeds: [],
                files: []
            };

            if (statusResponse.players?.sample) {
                for (let i = 0; i < statusResponse.players.sample.length; i++) {
                    const player = statusResponse.players.sample[i];
                    playerNameString += `${player.name}, `;
                }
                playerNameString = playerNameString.trim().slice(0, -1);
                try {
                    const combinedImage = await GetPlayersImage(statusResponse.players);
                    const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
                    embed.setImage(`attachment://players.png`);
                    toSend.files = [playerImage]
                }
                catch {}

            }
            if (joined.length > 0) embed.addFields([{
                name: 'Joined:',
                value: joined.map(player => player.name).join(', ')
            }])
            if (left.length > 0) embed.addFields([{
                name: 'Left:',
                value: left.map(player => player.name).join(', ')
            }])
            if (playerNameString.length >0) embed.addFields([
                { name: '\u200B', value: '\u200B' },
                {name: `Playing:`, value: playerNameString, inline: true}
            ]);

            toSend.embeds = [embed];
            await channel.send(toSend);

        }
    }
    if (isOnline) {
        gameGuild.serverOnline = true;
        gameGuild.currentPlayersList = statusResponse.players?.sample ?? [];
    }
}