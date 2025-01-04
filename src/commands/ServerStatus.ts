import {
    ActionRowBuilder,
    ComponentType, EmbedBuilder, InteractionReplyOptions, Message,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
} from "discord.js";
import {functionMap, GameGuild, Server, ServerTypes} from "../InteractionBackend/serverTypes.js";
import {GetDefaultServer, GetGuild, GetServers, UpdateOrAddGuild, UpdateOrAddGuildServer} from "../storage/Db.js";
import {AddServerSelectMenu, GetServerChoices} from "./common.js";

export const McStatusCommand = new SlashCommandBuilder()
    .setName('server-status')
    .setDescription('Provides information about a particular Minecraft Server')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('The server to get the status for.')
            .setRequired(false)
            .setAutocomplete(true)
    );

export async function interactionMcStatus(interaction): Promise<void> {
    if (interaction.commandName === 'server-status' && interaction.isChatInputCommand()) {
        // @ts-ignore
        let reply: InteractionReplyOptions = {fetchReply: true};
        let serverReply: InteractionReplyOptions = {};
        let server: Server = {URL: "", Type: ServerTypes.Minecraft}; //defining server just to make the compiler happy
        let guild: GameGuild = await GetGuild(interaction.guildId)

        if (interaction.options.getString('server')) {
            server =JSON.parse(interaction.options.getString('server'))
            serverReply = await functionMap[server.Type+'status'](guild, server);
        }
        else {
            let defaultServer: Server;
            try {
                defaultServer = await GetDefaultServer(interaction.guildId);
                try {
                    serverReply = await functionMap[defaultServer.Type+'status'](guild, defaultServer);
                }
                catch {
                    reply.embeds = [new EmbedBuilder().setDescription('Failed to fetch server data')]
                }
                console.log(defaultServer.URL);

            } catch (error) {
                console.log('could not find default server');
                reply.embeds = [new EmbedBuilder()
                    .setDescription('Could not find default server, Did you add a server?')];

            }


        }
        console.log({...reply,...serverReply});
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
        const response = await interaction.reply({...reply,...serverReply});
        if (serverChoices.length > 1){
            const collector = response.createMessageComponentCollector({componentType: ComponentType.StringSelect , time: 3_600_000});

            collector.on('collect', async i => {
                const server: Server = JSON.parse(i.values[0])
                try {
                    serverReply = await functionMap[server.Type+'status'](guild, server);
                }
                catch {}

                await i.update(serverReply);
            });
        }

    }
    else if (interaction.commandName === 'server-status' && interaction.isAutocomplete()) {
        interaction.respond(await GetServerChoices(interaction.guildId))
    }
}


