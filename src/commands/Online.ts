import {
    ActionRowBuilder,
    ComponentType, EmbedBuilder, InteractionReplyOptions,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
} from "discord.js";
import {functionMap, GameGuild, Server, ServerTypes} from "../InteractionBackend/serverTypes.js";
import {GetGuild} from "../storage/Db.js";
import {GetServerChoices} from "./common.js";

export const McOnlineCommand = new SlashCommandBuilder()
    .setName('online')
    .setDescription('Tells you which players are currently online')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('The server to list the players for.')
            .setRequired(false)
            .setAutocomplete(true)
    );

export async function interactionMcOnline(interaction): Promise<void> {
    if (interaction.commandName === 'online' && interaction.isChatInputCommand()) {
        // @ts-ignore
        let reply: InteractionReplyOptions = {fetchReply: true};
        let serverReply: InteractionReplyOptions = {};
        // TODO: Make this work with plaintext servers that arent in the db
        let server: Server = {Host: "", Type: ServerTypes.Minecraft}; //defining server just to make the compiler happy
        let guild: GameGuild = await GetGuild(interaction.guildId)

        if (interaction.options.getString('server')) {
            server = JSON.parse(interaction.options.getString('server'))
            serverReply = await functionMap[server.Type + 'online'](guild, server);
        } else {
            if (guild.defaultServer) {
                serverReply = await functionMap[guild.defaultServer.Type + 'online'](guild, guild.defaultServer);
            } else {
                console.log('could not find default server');
                reply.embeds = [new EmbedBuilder()
                    .setDescription('Could not find default server, Did you add a server?')];
            }
        }
        await interaction.reply({...reply,...serverReply});

    }
    else if (interaction.commandName === 'online' && interaction.isAutocomplete()) {
        interaction.respond(await GetServerChoices(interaction.guildId))
    }
}