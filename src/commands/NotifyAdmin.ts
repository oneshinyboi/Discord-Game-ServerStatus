import {PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {UpdateOrAddGuild} from "../storage/Db.js";

export const NotifyAdminCommand = new SlashCommandBuilder()
    .setName('notify-admin')
    .setDescription('toggles notifying an admin if the server is down')
    .addBooleanOption(option =>
        option
            .setName('enabled')
            .setDescription('Enable or disable the notifications')
            .setRequired(true)
    )
    .addMentionableOption(option =>
        option
            .setName('target')
            .setDescription('The user or role to notify (required if enabling)')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function interactionNotifyAdmin(interaction): Promise<void> {
    if (interaction.commandName === 'notify-admin' && interaction.isChatInputCommand()) {
        const enabled = interaction.options.getBoolean('enabled')
        const target = interaction.options.getMentionable('target');

        if (enabled) {
            if (!target) {
                await interaction.reply({
                    content: 'You must specify a user or role to notify when enabling notifications.',
                    ephemeral: true,
                });
                return;
            }
            if (target.id == interaction.guildId) {
                await UpdateOrAddGuild(interaction.guildId, null, "@everyone", null)

                await interaction.reply({
                    content: `Notifications enabled! @everyone will be notified when the server is down.`,
                    ephemeral: true,
                });
            }
            else {
                await UpdateOrAddGuild(interaction.guildId, null, target.id, null)
                const targetType = target.user ? 'user' : 'role';
                await interaction.reply({
                    content: `Notifications enabled! The ${targetType} <@${target.id}> will be notified when the server is down.`,
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
