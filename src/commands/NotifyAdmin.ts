import {PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {UpdateOrAddGuild} from "../storage/Db.js";

export const NotifyAdminCommand = new SlashCommandBuilder()
    .setName('ping-admin')
    .setDescription('toggles pinging an admin if the server is down')
    .addBooleanOption(option =>
        option
            .setName('enabled')
            .setDescription('Enable or disable the notifications')
            .setRequired(true)
    )
    .addMentionableOption(option =>
        option
            .setName('target')
            .setDescription('The user or role to ping (required if enabling)')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function interactionNotifyAdmin(interaction): Promise<void> {
    if (interaction.commandName === 'ping-admin' && interaction.isChatInputCommand()) {
        const enabled = interaction.options.getBoolean('enabled')
        const target = interaction.options.getMentionable('target');

        if (enabled) {
            if (!target) {
                await interaction.reply({
                    content: 'You must specify a user or role to ping when enabling pings.',
                    ephemeral: true,
                });
                return;
            }
            if (target.id == interaction.guildId) {
                await UpdateOrAddGuild(interaction.guildId, null, "@everyone", null)

                await interaction.reply({
                    content: `Notifications enabled! @everyone will be pinged when the server is down.`,
                    ephemeral: true,
                });
            }
            else {
                await UpdateOrAddGuild(interaction.guildId, null, target.id, null)
                const targetType = target.user ? 'user' : 'role';
                await interaction.reply({
                    content: `Notifications enabled! The ${targetType} <@${target.id}> will be pinged when the server is down.`,
                    ephemeral: true,
                });
            }

        } else {
            await UpdateOrAddGuild(interaction.guildId, null, "", null)
            await interaction.reply({
                content: 'Notifications have been disabled.',
                ephemeral: true ,
            });
        }
    }
}
