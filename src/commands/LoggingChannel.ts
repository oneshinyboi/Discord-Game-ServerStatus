import {ChannelType, PermissionFlagsBits, SlashCommandBuilder} from "discord.js";
import {GetGuild, UpdateOrAddGuild} from "../storage/Db.js";
import {StartLogging, StopLogging} from "./common.js";

export const LoggingChannelCommand = new SlashCommandBuilder()
    .setName('logging-channel')
    .setDescription('Designates a channel to track players joining or leaving the DefaultServer')
    .addBooleanOption(option =>
        option
            .setName('enabled')
            .setDescription('Enable or disable the channel')
            .setRequired(true)
        )
    .addChannelOption(option =>
        option
            .setName('target')
            .setDescription('The channel to send messages to (required if enabling)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option
            .setName('interval')
            .setDescription('The time in minutes to wait between checking for server joins/leaves (required if enabling)')
            .setRequired(false)
            .setMaxValue(1440)
            .setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function interactionLoggingChannel(interaction): Promise<void> {
    if (interaction.commandName === 'logging-channel' && interaction.isChatInputCommand()) {
        const enabled = interaction.options.getBoolean('enabled');
        const target = interaction.options.getChannel('target');
        const interval = interaction.options.getInteger('interval');

        if (enabled) {
            if (!target || !interval) {
                await interaction.reply({
                    content: 'You must specify a channel and interval to send messages when enabling logging',
                    ephemeral: true,
                });
                return;
            }
            await UpdateOrAddGuild(interaction.guildId, null, null, target.id, interval)
            const guild = await GetGuild(interaction.guildId);
            if (!guild.defaultServer) {
                await interaction.reply({
                    content: 'You must specify a default server before enabling logging',
                    ephemeral: true,
                });
                return;
            }
            StartLogging(guild);
            await interaction.reply({
                content: `Logging enabled! Messages will be sent to <#${target.id}> every ${interval} minute${interval == 1 ? "": "s"}.`,
                ephemeral: true ,
            });
        }
        else {
            await UpdateOrAddGuild(interaction.guildId, null, null, "")
            StopLogging(await GetGuild(interaction.guildId));
            await interaction.reply({
                content: 'Logging has been disabled.',
                ephemeral: true ,
            });
        }
    }
}