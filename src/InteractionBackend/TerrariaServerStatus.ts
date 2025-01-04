import {EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {GameGuild, Server} from "./serverTypes.js";

export async function getEmbed(gameGuild: GameGuild, server: Server): Promise<InteractionReplyOptions> {

    const embed = new EmbedBuilder()
    embed.setTitle("Terraria is not supported yet")

    return {embeds: [embed]};
}
