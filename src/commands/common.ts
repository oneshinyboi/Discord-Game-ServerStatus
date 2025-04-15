import {GetGuilds, GetServers} from "../storage/Db.js";
import {SelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js";
import {GameGuild, Server, ServerTypes} from "../InteractionBackend/serverTypes.js";
import {logPlayerChange} from "../InteractionBackend/LogPlayerChange.js";
import {createCanvas, Image, loadImage} from "canvas";


export type ChoiceOption = {
    name: string;
    value: string;
};
let scheduledIntervals = new Map();

export async function AddServerSelectMenu(guildId: string, selectMenuBuilder: SelectMenuBuilder) {
    const options = await GetServers(guildId);
    options.forEach((server) => {
        selectMenuBuilder.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(server.Alias ?? server.Host)
                .setValue(JSON.stringify(server))
                .setDescription(`${server.Type} server`)
        )
    })
}
export async function GetServerChoices(guildId: string): Promise<ChoiceOption[]> {
    const option: ChoiceOption[] = [];
    const servers = await GetServers(guildId);
    servers.forEach((server) => {
        option.push({name: `${server.Alias ? server.Alias + ',' : ''} ${server.Host}, ${server.Type}`, value: JSON.stringify(server)});
    })
    return option;
}

export function TryGetServer(interaction): {server: Server, result: boolean} {
    let server: Server = {Host: "", Type: ServerTypes.Minecraft}; //defining server just to make the compiler happy
    try {
        server = JSON.parse(interaction.options.getString('server'));
        return {server: server, result: true};
    }
    catch{
        interaction.reply({content: `Please pick one of the options.`, ephemeral: true});
        return {server: server, result: false};
    }
}
export function StartLogging(guild: GameGuild) {
    StopLogging(guild);
    guild.serverOnline = true;
    guild.downCount = 0;
    guild.currentPlayersList = guild.currentPlayersList || [];
    const intervalId = setInterval(async () => {
        await logPlayerChange(guild);
    }, guild.loggingChannelInterval * 60 * 1000)

    scheduledIntervals.set(guild.id, intervalId);
}

export function StopLogging(guild: GameGuild) {
    const intervalId = scheduledIntervals.get(guild.id);
    if (intervalId) {
        clearInterval(intervalId);
        scheduledIntervals.delete(guild.id);
    }
}

export async function InitializeLogging() {
    console.log("initializing logging");
    const guilds: GameGuild[] = await GetGuilds();
    for (const guild of guilds) {
        if (guild.loggingChannelId != null) {
            StartLogging(guild)
        }
    }
    console.log("logging initialized");
}

export async function GetPlayersImage(players: {
    online: number;
    max: number;
    sample: {
        name: string;
        id: string;
    }[];
}): Promise<Buffer> {
    const playerImages: Image[] = await Promise.all(players.sample.map(async (player) => {
        const imageUrl = `https://api.mineatar.io/face/${player.id}`;
        return await loadImage(imageUrl);
    }));

    const canvas = createCanvas(playerImages.length * (32), 32); // 32x32 images with 10 px buffer
    const ctx = canvas.getContext('2d');

    playerImages.forEach((image, index) => {
        ctx.drawImage(image, index * (32), 0);
    });

    return canvas.toBuffer();
}