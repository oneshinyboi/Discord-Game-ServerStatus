import {AttachmentBuilder, EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {GameGuild, Server} from "./serverTypes.js";
import {GetPlayersImage} from "../commands/common.js";

export async function getReply(gameGuild: GameGuild, server: Server): Promise<InteractionReplyOptions> {
    const serverInfo = await fetch(`https://api.mcsrvstat.us/3/${server.URL}`);
    /*const serverData = {
        "ip": "208.26.80.224",
        "port": 25565,
        "debug": {
            "ping": true,
            "query": false,
            "srv": false,
            "querymismatch": false,
            "ipinsrv": false,
            "cnameinsrv": false,
            "animatedmotd": false,
            "cachehit": false,
            "cachetime": 1724368151,
            "cacheexpire": 1724368211,
            "apiversion": 3,
            "dns": {
                "a": [
                    {
                        "name": "veryshiny.net",
                        "type": "A",
                        "class": "IN",
                        "ttl": 14400,
                        "rdlength": 0,
                        "rdata": "",
                        "address": "208.26.80.224"
                    }
                ]
            },
            "error": {
                "query": "Failed to read from socket."
            }
        },
        "motd": {
            "raw": [
                "A Minecraft Server"
            ],
            "clean": [
                "A Minecraft Server"
            ],
            "html": [
                "A Minecraft Server"
            ]
        },
        "players": {
            "online": 1,
            "max": 20,
            "list": [
                {
                    "name": "TheHydroBalls",
                    "uuid": "3c83fb2c-5d14-4af3-b091-b1321d3aaafc"
                },
                {
                    "name": "DeeezBigBawls",
                    "uuid": "8d9f363f-e1af-43ba-9a00-e746f57b3290"
                },
                {
                    "name": "DeezSmallBawls",
                    "uuid": "42eaee24-42a9-44e8-96e5-00afe64711eb"
                }

            ]
        },
        "version": "1.21.1",
        "online": true,
        "protocol": {
            "version": 767,
            "name": "1.21.1"
        },
        "hostname": "veryshiny.net",
        "eula_blocked": false
    }*/
    const serverData = await serverInfo.json();
    let content= ""
    const embed = new EmbedBuilder()
        .setTitle(`Info for Minecraft Server: ${server.Alias ?? server.URL}`);

    if (!serverData.online) {
        if (gameGuild.adminId) {
            if (gameGuild.adminId == "@everyone") {
                content = `Attention @everyone!`
            }
            else {
                content = `Attention <@${gameGuild.adminId}>!`;
            }
        }
        embed.setDescription(`Server is offline!`);
        return {content: content, embeds: [embed]};
    }
    else {
        embed
            .setColor(0x0099FF)
            .setTitle(`Info for Minecraft Server: ${server.Alias ?? server.URL}`)
            .addFields([
                {name: 'Online Players', value: `${serverData.players.online}`, inline: true},
                { name: '\u200B', value: '\u200B' },
            ]);
        if (serverData.players.list) {
            let playerNameString = "";
            for (let i = 0; i < serverData.players.list.length; i++) {
                const player = serverData.players.list[i];
                playerNameString += `${player.name}, `;
            }
            playerNameString = playerNameString.trim().slice(0, -1);
            if (playerNameString.length > 0) embed.addFields([{name: `Playing:`, value: playerNameString, inline: true}]);

            try {
                const combinedImage = await GetPlayersImage(serverData.players);
                const playerImage = new AttachmentBuilder(combinedImage, {name: 'players.png'});
                embed.setImage(`attachment://players.png`);
                return {embeds: [embed], files: [playerImage]};
            } catch {}
        }
        return {embeds: [embed]};
    }
}