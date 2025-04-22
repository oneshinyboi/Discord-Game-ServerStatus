import {GetPlayersImage} from "../commands/common.js";
import {AttachmentBuilder, EmbedBuilder} from "discord.js";
import {JavaStatusResponse} from "minecraft-server-util";

export async function embedPLayerHeads(statusResponse: JavaStatusResponse, embed: EmbedBuilder) {
    if (statusResponse.players?.sample) {
        let playerNameString = "";
        for (let i = 0; i < statusResponse.players.sample.length; i++) {
            const player = statusResponse.players.sample[i];
            playerNameString += `${player.name}, `;
        }
        playerNameString = playerNameString.trim().slice(0, -1);
        if (playerNameString.length > 0) embed.addFields([{ name: '\u200B', value: '\u200B' }, {name: `Playing:`, value: playerNameString, inline: true}]);

        try {
            const combinedImage = await GetPlayersImage(statusResponse.players);
            const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
            embed.setImage(`attachment://players.png`);
            return {embeds: [embed], files: [playerImage]};
        } catch {}
    }
}