import {PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {GetServerChoices, TryGetServer} from "./common.js";
import {RemoveServer} from "../storage/Db.js";

export const DeleteServerCommand = new SlashCommandBuilder()
    .setName('delete-server')
    .setDescription('Deletes an existing server.')
    .addStringOption(option =>
        option.setName('server')
            .setDescription('The server to delete.')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function  interactionDeleteServer(interaction) {
    if (interaction.isChatInputCommand() && interaction.commandName === 'delete-server') {
        let tryResult = TryGetServer(interaction);
        let server = tryResult.server;
        if (tryResult.result == false) {return}

        await RemoveServer(interaction.guildId, server)
            .then(() => {
                return interaction.reply({content: `Deleted ${server.Host}`, ephemeral: true})
            })
            .catch(error => {
                console.error(error)
            })

    }
    else if (interaction.isAutocomplete() && interaction.commandName === 'delete-server') {
        interaction.respond(await GetServerChoices(interaction.guildId))
    }
    else {
        return;
    }

}