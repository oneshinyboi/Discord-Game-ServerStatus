import {InteractionReplyOptions} from "discord.js";
import {getReply as mcStatusGetEmbed} from "./MinecraftServerStatus.js";
import {getReply as mcPlaytimeGetEmbed} from "./MinecraftPlaytime.js";
import {getEmbed as terrGetEmbed} from "./TerrariaServerStatus.js";
interface FunctionMap {
    [key: string]: (gameGuild: GameGuild, server: Server, serverPort?: number, rconPassword?: string) => Promise<InteractionReplyOptions>;
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
    [ServerTypes.Terraria]: (gameGuild, server) => terrGetEmbed(gameGuild, server),
    [ServerTypes.Minecraft+'status']: (gameGuild, server) => mcStatusGetEmbed(gameGuild, server),
    [ServerTypes.Minecraft+'playtime']: (gameGuild, server) => mcPlaytimeGetEmbed(gameGuild, server),
};

