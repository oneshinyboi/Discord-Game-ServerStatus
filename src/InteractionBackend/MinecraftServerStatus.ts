import {AttachmentBuilder, EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {GameGuild, Server} from "./serverTypes.js";
import * as mc from "minecraft-server-util";
import {JavaStatusResponse} from "minecraft-server-util";
import {embedPLayerHeads} from "./common.js";

export async function getReply(gameGuild: GameGuild, server: Server): Promise<InteractionReplyOptions> {
    let statusResponse: JavaStatusResponse;
    let isOnline = false;

    let content= ""
    const embed = new EmbedBuilder()
        .setTitle(`Info for Minecraft Server: ${server.Alias ?? server.Host}`);

    try {
        statusResponse = await mc.status(server.Host);
        isOnline = true;
    } catch (error) {
        console.error(`Failed to query server ${gameGuild.defaultServer.Host}:`, error);
        embed.setDescription(`Bot could not reach server, it may be offline!`);
        return {embeds: [embed]};
    }

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
                {name: 'Motd', value: `${statusResponse.motd.clean}`},
            ]);
        const result = await embedPLayerHeads(statusResponse, embed)
        if (result) {
            return result;
        }
        return {embeds: [embed]};
    }
}