import sqlite3 from 'sqlite3';
import {GameGuild, Server} from '../InteractionBackend/serverTypes'

const { Database } = sqlite3;

const db = new Database('storage/database.sqlite');

export async function GetGuild(guildId: string): Promise<GameGuild> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT *
                    FROM Guilds
                    WHERE Id = ?`, [guildId], async (err, row) => {
                if (err) {
                    return reject(`Error retrieving guild: ${err.message}`);
                }
                if (row) {
                    const gameGuild: GameGuild = {
                        id: row["Id"],
                        adminId: row["AdminId"],
                        loggingChannelId: row["LoggingChannelId"],
                        loggingChannelInterval: row["LoggingChannelInterval"]
                    };
                    try {
                        gameGuild.defaultServer = await GetDefaultServer(guildId)
                    }
                    catch {}
                    resolve(gameGuild);
                }
            })
        })
    })
}
export async function GetGuilds(): Promise<GameGuild[]> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(`SELECT * FROM Guilds`, async (err, rows) => {
                if (err) {
                    reject(`Error retrieving guilds: ${err.message}`);
                    return;
                }
                if (rows) {
                    try {
                        const guilds: GameGuild[] = await Promise.all(
                            rows.map(async row => await GetGuild(row["Id"]))
                        );
                        resolve(guilds)
                    }
                    catch (error) {
                        reject(`Error processing guilds: ${error.message}`);
                    }
                }
                else {
                    resolve([]);
                }
            })
        })
    })
}
export async function UpdateOrAddGuild(guildId: string, defaultURL: string = null, adminId: string = null, loggingChannelId: string = null, loggingChannelInterval: string = null): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT *
                    FROM Guilds
                    WHERE Id = ?`, [guildId], (err, row) => {
                if (err) {
                    return reject(`Error retrieving guild: ${err.message}`);
                }

                if (row && defaultURL!=null) {
                    db.run(`UPDATE Guilds
                            SET DefaultServerURL = ?
                            WHERE Id = ?`, [defaultURL == "" ? null: defaultURL, guildId], (err) => {
                        if (err) {
                            return reject(`Error updating guild: ${err.message}`);
                        }
                        resolve();
                    });
                }
                if (row && adminId!=null) {
                    db.run(`UPDATE Guilds
                            SET AdminId = ?
                            WHERE Id = ?`, [adminId == "" ? null: adminId, guildId], (err) => {
                        if (err) {
                            return reject(`Error updating guild: ${err.message}`);
                        }
                        resolve();
                    });
                }
                if (row && loggingChannelId!=null) {
                    db.run(`UPDATE Guilds
                            SET LoggingChannelId = ?
                            WHERE Id = ?`, [loggingChannelId == "" ? null: loggingChannelId, guildId], (err) => {
                        if (err) {
                            return reject(`Error updating guild: ${err.message}`);
                        }
                        resolve();
                    });
                }
                if (row && loggingChannelInterval!=null) {
                    db.run(`UPDATE Guilds
                            SET LoggingChannelInterval = ?
                            WHERE Id = ?`, [loggingChannelInterval == "" ? null: loggingChannelInterval, guildId], (err) => {
                        if (err) {
                            return reject(`Error updating guild: ${err.message}`);
                        }
                        resolve();
                    });
                }
                if (!row) {
                    db.run(`INSERT INTO Guilds (Id, DefaultServerURL, AdminId, LoggingChannelId)
                            VALUES (?, ?, ?, ?)`, [guildId, defaultURL, adminId, loggingChannelId], (err) => {
                        if (err) {
                            return reject(`Error adding new guild: ${err.message}`);
                        }
                        resolve();
                    });
                }
            });
        });
    });
}
export async function UpdateOrAddGuildServer(guildId: string, server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT *
                    FROM GuildServer
                    WHERE GuildId = ? AND URL = ?`, [guildId, server.URL], (err, row) => {
                if (err) {
                    return reject(`Error retrieving guildServer: ${err.message}`);
                }

                if (row) {
                    db.run(`UPDATE GuildServer
                            SET Type = ?, Alias = ?
                            WHERE GuildId = ? AND URL = ?`, [server.Type, server.Alias?? null,guildId, server.URL], (err) => {
                        if (err) {
                            return reject(`Error updating guildServer: ${err.message}`);
                        }
                        resolve();
                    });
                } else {
                    db.run(`INSERT INTO GuildServer (GuildId, URL, Type, Alias)
                            VALUES (?, ?, ?, ?)`, [guildId, server.URL, server.Type, server.Alias?? null], (err) => {
                        if (err) {
                            return reject(`Error adding new guildServer: ${err.message}`);
                        }
                        resolve();
                    });
                }
            });
        });
    });
}
export async function GetServers(guildId: string): Promise<Server[]> {
    const servers: Server[] = [];
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(`SELECT *
                FROM GuildServer
                WHERE GuildId = ?`, [guildId], (err, rows) => {
            if (err) {
                return reject(`Error retrieving guildServer: ${err.message}`)
            }
            if (rows) {
                rows.forEach((row) => {
                    const server: Server = {
                        URL: row["URL"],
                        Type: row["Type"],
                        Alias: row["Alias"]?? null
                    };
                    servers.push(server);
                });
            }
            resolve(servers);
            })
        })
    })
}
export async function GetDefaultServer(guildId: string): Promise<Server> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT *
                FROM Guilds
                WHERE Id = ?`, [guildId], (err, row) => {
            if (err) {
                return reject(`Error retrieving guild defaultServer: ${err.message}`);
            }
            if (row) {
                db.get(`SELECT *
                    FROM GuildServer
                    WHERE GuildId = ? AND URL = ?`, [guildId, row["DefaultServerURL"]], (err, serverRow) => {
                if (err) {
                    return reject(`Error getting info for defaultServer: ${err.message}`);
                }
                if (serverRow) {
                    const server: Server = {
                        URL: serverRow["URL"],
                        Type: serverRow["Type"]
                    };
                    resolve(server);
                }
                else {
                    return reject(`Default Server: ${row["DefaultServerURL"]} does not have an entry in GuildServer table`)
                }
                })
            }
            else {
                return reject(`Guild does not exist in Guilds table`)
            }
            })
        })
    })
}
export async function RemoveServer(guildId: string, server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT *
                FROM Guilds
                WHERE Id = ?`, [guildId], (err, row) => {
            if (err) {
                return reject(`Error selecting from Guilds`);
            }
            if (row && row["DefaultServerURL"] == server.URL) {
                db.run(`UPDATE Guilds
                    SET DefaultServerURL = ?
                    WHERE GuildId = ?`, ["", guildId], (err) => {
                if (err) {
                    return reject('Error resetting defaultServer');
                }
                });
            }
            });
            db.run(`DELETE
                FROM GuildServer
                WHERE GuildId = ? AND URL = ?`, [guildId, server.URL], (err) => {
            if (err) {
                return reject(`Error deleting row for guildId: ${guildId}, URL: ${server.URL}`)
            }
            resolve();
            })
        })
    })

}
