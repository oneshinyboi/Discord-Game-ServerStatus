import { PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {Server, ServerTypes} from "../InteractionBackend/serverTypes.js";
import {UpdateOrAddGuild, UpdateOrAddGuildServer} from "../storage/Db.js";
import {ChoiceOption, GetServerChoices} from "./common.js";



const choices: ChoiceOption[] = [];
Object.values(ServerTypes).forEach((serverType) => {
    choices.push({name: serverType, value: serverType})
})
export const AddServerCommand = new SlashCommandBuilder()
    .setName('add-server')
    .setDescription('Adds a new server')
    .addStringOption(option =>
        option.setName('host')
            .setDescription('The URL or hostname of the game server.')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('game')
            .setDescription('The game that this server hosts.')
            .setRequired(true)
            .addChoices(choices)
    )
    .addStringOption(option =>
        option.setName('alias')
            .setDescription('A friendly name to refer to the server as')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function interactionAddServer(interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'add-server') {
        const server: Server = {
            URL: interaction.options.getString('host').trim(),
            Type: interaction.options.getString('game').trim(),
        };
        if (interaction.options.get('alias')) {
            server.Alias = interaction.options.getString('alias')
        }
        if ((await GetServerChoices(interaction.guildId)).length <= 0) {
            await UpdateOrAddGuild(interaction.guildId, server.URL)
        }
        UpdateOrAddGuildServer(interaction.guildId, server)
            .then(() => {
                return interaction.reply({content: `Added ${server.URL} ${server.Alias? `as ${server.Alias}` : ''}`, ephemeral: true});
            })
            .catch(error => {
                console.error(error);
            })
    }
}


