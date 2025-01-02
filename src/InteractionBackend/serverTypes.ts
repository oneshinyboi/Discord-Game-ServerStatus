import {EmbedBuilder, InteractionReplyOptions} from "discord.js";
import {getReply as mcStatusGetEmbed} from "./MinecraftServerStatus.js";
import {getReply as mcPlaytimeGetEmbed} from "./MinecraftPlaytime.js";
import {getEmbed as terrGetEmbed} from "./TerrariaServerStatus.js";
interface FunctionMap {
    [key: string]: (gameGuild: GameGuild, serverUrl: string, serverPort?: number, rconPassword?: string) => Promise<InteractionReplyOptions>;
}
export enum ServerTypes {
    Terraria = "Terraria",
    Minecraft = "Minecraft",
}
export interface Server {
    URL: string,
    Type: ServerTypes,
    Alias?: string | null
}
export interface GameGuild {
    id: string,
    defaultServer?: Server | null,
    adminId?: string | null,
    loggingChannelId?: string | null,
    loggingChannelInterval?: number | null,
    currentPlayersList?: any[],
    serverOnline?: boolean
}
export const functionMap: FunctionMap = {
    [ServerTypes.Terraria]: (gameGuild, serverUrl) => terrGetEmbed(gameGuild, serverUrl),
    [ServerTypes.Minecraft+'status']: (gameGuild, serverUrl) => mcStatusGetEmbed(gameGuild, serverUrl),
    [ServerTypes.Minecraft+'playtime']: (gameGuild, serverUrl) => mcPlaytimeGetEmbed(gameGuild, serverUrl),
};

