import {EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {GameGuild} from "./serverTypes";

export async function getEmbed(gameGuild: GameGuild, serverUrl: string): Promise<InteractionReplyOptions> {

    const embed = new EmbedBuilder()
    embed.setTitle("Terraria is not supported yet")

    return {embeds: [embed]};
}
