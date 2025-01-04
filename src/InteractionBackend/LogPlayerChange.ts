import {GameGuild} from "./serverTypes.js";
import {AttachmentBuilder, EmbedBuilder, TextChannel} from "discord.js";
import {GetPlayersImage} from "../commands/common.js";
import {client} from "../main.js";
import {GetGuild} from "../storage/Db.js";

export async function logPlayerChange(gameGuild: GameGuild) {
    const serverInfo = await fetch(`https://api.mcsrvstat.us/3/${gameGuild.defaultServer.URL}`);
    const serverData = await serverInfo.json();
    const embed = new EmbedBuilder()
    const channel = gameGuild.loggingChannelId
        ? (await client.channels.fetch(gameGuild.loggingChannelId)) as TextChannel
        : null;
    gameGuild.adminId = (await GetGuild(gameGuild.id)).adminId;

    if (!channel) return;
    if (serverData && !serverData.online && gameGuild.serverOnline) {
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
        embed.setDescription(`Server is offline!`);

        await channel.send({ content, embeds: [embed] });
        return;
    }
    else if (serverData && gameGuild.currentPlayersList) {
        const oldUUIDs = new Set(gameGuild.currentPlayersList.map(player => player.uuid));
        const newUUIDs = new Set(serverData.players?.list?.map(player => player.uuid) ?? []);

        const joined = serverData.players?.list?.filter(player => !oldUUIDs.has(player.uuid)) ?? [];
        const left = gameGuild.currentPlayersList.filter(player => !newUUIDs.has(player.uuid));

        if (joined.length > 0 || left.length > 0) {
            let playerNameString = ""
            const tosend = {
                embeds: [],
                files: []
            };

            if (serverData.players?.list) {
                for (let i = 0; i < serverData.players.list.length; i++) {
                    const player = serverData.players.list[i];
                    playerNameString += `${player.name}, `;
                }
                playerNameString = playerNameString.trim().slice(0, -1);
                try {
                    const combinedImage = await GetPlayersImage(serverData.players);
                    const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
                    embed.setImage(`attachment://players.png`);
                    tosend.files = [playerImage]
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

            tosend.embeds = [embed];
            await channel.send(tosend);

        }
    }
    else if (!serverData){
        embed
            .setColor(0x0099FF)
            .setTitle(`Could not fetch info for ${gameGuild.defaultServer.Alias ?? gameGuild.defaultServer.URL}`);
        await channel.send({embeds: [embed]});
    }
    if (serverData.online) {
        gameGuild.serverOnline = true;
        gameGuild.currentPlayersList = serverData.players?.list ?? [];
    }
}