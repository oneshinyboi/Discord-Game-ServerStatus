import {AttachmentBuilder, EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {GameGuild, Server} from "./serverTypes.js";
import {GetPlayersImage} from "../commands/common.js";
import * as mc from "minecraft-server-util";
import {JavaStatusResponse} from "minecraft-server-util";

export async function getReply(gameGuild: GameGuild, server: Server): Promise<InteractionReplyOptions> {
    let statusResponse: JavaStatusResponse;
    let isOnline = false;

    try {
        statusResponse = await mc.status(server.Host);
        isOnline = true;
    } catch (error) {
        console.error(`Failed to query server ${gameGuild.defaultServer.Host}:`, error);
    }

    let content= ""
    const embed = new EmbedBuilder()
        .setTitle(`Info for Minecraft Server: ${server.Alias ?? server.Host}`);

    if (!isOnline) {
        if (gameGuild.adminId) {
            if (gameGuild.adminId == "@everyone") {
                content = `Attention @everyone!`
            }
            else {
                content = `Attention <@${gameGuild.adminId}>!`;
            }
        }
        embed.setDescription(`Bot could not reach server, it may be offline!`);
        return {content: content, embeds: [embed]};
    }
    else {
        embed
            .setColor(0x0099FF)
            .setTitle(`Info for Minecraft Server: ${server.Alias ?? server.Host}`)
            .addFields([
                {name: 'Ping', value: `${statusResponse.roundTripLatency}ms`, inline: true},
                {name: 'Online Players', value: `${statusResponse.players.online}`, inline: true},
                {name: 'Max Players', value: `${statusResponse.players.max}`, inline: true},
                {name: 'Version', value: `${statusResponse.version.name}`},
                {name: 'Motd', value: `${statusResponse.motd.clean[0]}`},
                { name: '\u200B', value: '\u200B' },
            ]);
        if (statusResponse.players?.sample) {
            let playerNameString = "";
            for (let i = 0; i < statusResponse.players.sample.length; i++) {
                const player = statusResponse.players.sample[i];
                playerNameString += `${player.name}, `;
            }
            playerNameString = playerNameString.trim().slice(0, -1);
            if (playerNameString.length > 0) embed.addFields([{name: `Playing:`, value: playerNameString, inline: true}]);

            try {
                const combinedImage = await GetPlayersImage(statusResponse.players);
                const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
                embed.setImage(`attachment://players.png`);
                return {embeds: [embed], files: [playerImage]};
            } catch {}
        }
        return {embeds: [embed]};
    }
}