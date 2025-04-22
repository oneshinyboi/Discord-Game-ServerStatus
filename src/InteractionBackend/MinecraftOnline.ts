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
            .setTitle(`${statusResponse.players.online} players are playing ${server.Alias ?? server.Host}`);
        const result = await embedPLayerHeads(statusResponse, embed)
        if (result) {
            return result;
        }
        return {embeds: [embed]};
    }
}