const Discord = require("discord.js-light");
const CHANNELS = ["index", "data", "files", "settings"]
function atob(str) {
    const buff = Buffer.from(str, 'utf-8');
    return buff.toString('base64');
}
function btoa(str) {
    const buff = Buffer.from(str, 'base64');
    return buff.toString('utf-8');
}
class Disdata {
    constructor(token, dbname) {
        this.token = token,
            this.dbname = dbname || "Disdata"
        Disdata.channels = {}
    }
    login(botToken = token) {
        return new Promise((resolve, reject) => {
            Disdata.DisClient = new Discord.Client({
                cacheGuilds: true,
                cacheChannels: true,
                cacheOverwrites: false,
                cacheRoles: false,
                cacheEmojis: false,
                cachePresences: false
            });

            Disdata.DisClient.login(botToken).then(resolve(true)).catch(err => reject(err));
        })


    }
    async newDB(name) {
        const Guild = await Disdata.DisClient.guilds.create(name, {
            channels: [
                { "name": "index" },
                { "name": "data" },
                { "name": "files" },
                { "name": "settings" },
                { "name": "chat" },
            ]
        });

        const GuildChannel = Guild.channels.cache.find(channel => channel.name == "chat");
        const Invite = await GuildChannel.createInvite({ maxAge: 0, unique: true, reason: "" });

        return {
            id: Guild.id,
            invite: Invite.url
        }
    }
    useDB(name) {
        var found = false
        return new Promise((resolve, reject) => {
            Disdata.DisClient.guilds.fetch().then(guilds => {
                guilds.map(async (guild) => {

                    if (guild.name == name && !found) {
                        found = true
                        Disdata.currentDB = guild.name
                        Disdata.currentDBGuild = guild
                        const channels = await guild.channels.fetch()
                        // console.log(channels)
                        await Promise.all(channels.map(async (c) => {
                            if (CHANNELS.includes(c.name)) {
                                Disdata.channels[c.name] = c
                                // console.log(c.name)
                            }
                            // console.log(c.name)  

                        }))

                        resolve()



                    }
                });

            })

        })






    }
    set(key, data) {
        return new Promise(async (resolve, reject) => {

            if (!data) {
                console.log("Data invalid")
                reject(false)

            }
            if (typeof key != "string" || !key || !key.search(/[^a-zA-Z]+/g)) {
                console.log("Key invalid")
                reject(false)

            }
            let exists = await this.has(key)
            if (exists) {
                console.log("Use edit for alredy stored data, or delete it")
                this.edit(key, data)
                return resolve()
                // reject(false)

            }
            // console.log(Disdata.channels["data"])

            const content = atob(data) + ":" + Date.now().toString()
            console.log(content)
            Disdata.channels["data"].send(content).then(msg => {
                const index = key + ":" + msg.id.toString() + ":" + Date.now().toString()
                Disdata.channels["index"].send(index).then(() => { resolve() }).catch(reject)
            }).catch(reject)
        })
    }
    edit(key, data) {
        return new Promise(async (resolve, reject) => {

            if (!data) {
                console.log("Data invalid")
                reject(false)

            }
            if (typeof key != "string" || !key || !key.search(/[^a-zA-Z]+/g)) {
                console.log("Key invalid")
                reject(false)

            }
            let exists = await this.has(key)

            if (!exists) {
                console.log("data not exist")
                reject(false)

            }
            // console.log(Disdata.channels["data"])

            const content = atob(data) + ":" + Date.now().toString()
            Disdata.channels["index"].messages.fetch({ limit: 100 }).then(messages => {

                //Iterate through the messages here with the variable "messages".
                messages.forEach(message => {
                    if (message.content.split(":")[0] === key) {
                        Disdata.channels["data"].messages.fetch(message.content.split(":")[1]).then(msg => {
                            msg.edit(content)
                            resolve()
                        })
                    }
                })
            })
        })
    }
    get(key) {
        return new Promise((resolve, reject) => {

            if (typeof key != "string" || !key || !key.search(/[^a-zA-Z]+/g)) {
                console.log("Key invalid")
                reject(false)
            }
            // console.log(Disdata.channels["data"])
            Disdata.channels["index"].messages.fetch({ limit: 100 }).then(messages => {
                //Iterate through the messages here with the variable "messages".
                messages.forEach(message => {
                    if (message.content.split(":")[0] === key) {
                        Disdata.channels["data"].messages.fetch(message.content.split(":")[1]).then(msg => {
                            resolve(btoa(msg.content))
                        })
                    }
                })

            })
        })
    }
    has(key) {
        return new Promise((resolve, reject) => {
            if (typeof key != "string" || !key || !key.search(/[^a-zA-Z]+/g)) {
                console.log("Key invalid")
                reject(false)
            }
            // console.log(Disdata.channels["data"])
            Disdata.channels["index"].messages.fetch({ limit: 100 }).then(messages => {
                // console.log(`Received ${messages.size} messages`);
                //Iterate through the messages here with the variable "messages".
                var found = false
                messages.map(message => {
                    if (message.content.split(":")[0] === key) {
                        console.log(message.content.split(":")[0])
                        found = true
                    }
                })
                console.log(found)
                resolve(found)


            })
        })

    }
    delete(key) {
        return new Promise((resolve, reject) => {

            if (typeof key != "string" || !key || !key.search(/[^a-zA-Z]+/g)) {
                console.log("Key invalid")
                reject()
            }
            // console.log(Disdata.channels["data"])
            Disdata.channels["index"].messages.fetch({ limit: 100 }).then(messages => {
                //Iterate through the messages here with the variable "messages".
                messages.map(message => {
                    if (message.content.split(":")[0] === key) {
                        message.delete()
                        setImmediate(() => {
                            Disdata.channels["data"].messages.fetch(message.content.split(":")[1]).then(msg => { msg.delete() })
                            resolve()
                        })

                    }
                })

            })
        })
    }
}
module.exports = Disdata