import {PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {UpdateOrAddGuild, UpdateOrAddGuildServer} from "../storage/Db.js";
import {GetServerChoices, TryGetServer} from "./common.js";

export const DefaultServerCommand = new SlashCommandBuilder()
    .setName('default-server')
    .setDescription('Sets a server as the default for server-status')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('The server to set as default.')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function interactionDefaultServer(interaction) {
    if (interaction.isChatInputCommand() && interaction.commandName === 'default-server') {

        let tryResult = TryGetServer(interaction);
        let server = tryResult.server;
        if (tryResult.result == false) {return}

        await UpdateOrAddGuild(interaction.guildId, server.Host);
        UpdateOrAddGuildServer(interaction.guildId, server)
            .then(() => {
                return interaction.reply({content: `Added ${server.Host} as the default server`, ephemeral: true});
            })
            .catch(error => {
                console.error(error);
                return interaction.reply({content: `Could not add the default server, how did you get here???`, ephemeral: true})
            })
    }
    else if (interaction.isAutocomplete() && interaction.commandName === 'default-server') {
        interaction.respond(await GetServerChoices(interaction.guildId))
    }
    else {
        return;
    }
}
