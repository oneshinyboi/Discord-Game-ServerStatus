import {
    ActionRowBuilder,
    ComponentType, EmbedBuilder,
    InteractionReplyOptions,
    SlashCommandBuilder,
    StringSelectMenuBuilder
} from "discord.js";
import {AddServerSelectMenu, GetServerChoices} from "./common.js";
import {functionMap, GameGuild, Server, ServerTypes} from "../InteractionBackend/serverTypes.js";
import {GetGuild} from "../storage/Db.js";

export const McPlaytimeCommand = new SlashCommandBuilder()
    .setName('playtime')
    .setDescription('Provides the playtime leaderboard for a particular minecraft server')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('The server to get the playtime for.')
            .setRequired(false)
            .setAutocomplete(true)
    );

export async function interactionMcPlaytime(interaction): Promise<void> {
    if (interaction.commandName == 'playtime' && interaction.isChatInputCommand()) {

        let reply: InteractionReplyOptions = {fetchReply: true};
        let server: Server = {Host: "", Type: ServerTypes.Minecraft}; //defining server just to make the compiler happy
        let guild: GameGuild = await GetGuild(interaction.guildId)


        if (interaction.options.getString('server')) {
            server =JSON.parse(interaction.options.getString('server'))
            try {
                reply = await functionMap[server.Type+'playtime'](guild, server);
            }
            catch {
                reply.embeds = [new EmbedBuilder().setDescription('Failed to fetch server data')]
            }
        }



        console.log(reply);
        const serverChoices = await GetServerChoices(interaction.guildId);
        if (serverChoices.length > 1) {
            const select = new StringSelectMenuBuilder()
                .setCustomId('select-server')
                .setPlaceholder('Select a server')
            await AddServerSelectMenu(interaction.guildId, select);

            const row = new ActionRowBuilder()
                .addComponents(select);
            // @ts-ignore
            reply.components = [row];
        }
        const response = await interaction.reply(reply);
        if (serverChoices.length > 1){
            const collector = response.createMessageComponentCollector({componentType: ComponentType.StringSelect , time: 3_600_000});

            collector.on('collect', async i => {
                const server: Server = JSON.parse(i.values[0])
                try {
                    reply = await functionMap[server.Type+'playtime'](guild, server);
                }
                catch {}

                await i.update(reply);
            });
        }
    }

}
