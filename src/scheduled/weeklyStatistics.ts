import { AwaitMessagesOptions, ForumChannel, Guild, GuildForumTag, Message, MessageCollectorOptions, TextChannel } from "discord.js";
import { Client, Tag } from "../types"
import { getDefaultEmbed } from "../utils/embeds.js";

const getTagName = async (guild: Guild, fullTagList: GuildForumTag[], id: string) =>
{
	const forumTag = fullTagList.find(forumTag => forumTag.id == id);

	let emoji = "";

	if(forumTag)
	{
		if(forumTag.emoji)
		{
			if(forumTag.emoji.id)
			{
				const guildEmoji = await guild.emojis.fetch(forumTag.emoji.id)
				emoji = `<:${guildEmoji.name}:${guildEmoji.id}> `;
			}
			else {
				emoji = `${forumTag.emoji.name!} `;
			}
		}

		return `${emoji}${forumTag?.name}`;
	}
}

export default {
	time: "* * * * * *",
	async execute(client: Client) {
		const guild = await client.guilds.fetch(process.env.GUILD_ID!);

		const forum: ForumChannel = await guild.channels.fetch(process.env.SUPPORT_CHANNEL!) as ForumChannel;

		const date = new Date();

		date.setMonth(date.getMonth() - 1);

		const threads = (await forum.threads.fetchActive()).threads.filter(x => x.createdAt! > date);

		const titleEmbed = getDefaultEmbed().setTitle("Weekly support statistics for the last month");

		const redirectsEmbed = getDefaultEmbed().setTitle("Support-ai redirects")
		// Support-ai redirects
		{
			let count = 0;

			for(let i = 0; i < threads.size; i++)
			{
				const thread = threads.at(i)!;
				if(thread.members.me)
				{

					const msgs = await thread.messages.fetch();
					msgs.forEach(message => {
						console.log(message.author.id)
						console.log(client.user!.id)
						console.log(message.author.id == client.user!.id)
						if(message.author.id == client.user!.id)
							count++;
							return;
					})
				}
			}

			redirectsEmbed.setDescription(`I sent <#${process.env.SUPPORT_AI_CHANNEL!}> redirects in ${count}/${threads.size} support threads`);
		}

		const tagEmbed = getDefaultEmbed().setTitle("Tags");

		// Tags
		{
			let tags: any = [];

			threads.forEach(thread => {
				thread.appliedTags.forEach(tag => {
					if(!tags[tag])
					{
						tags[tag] = [];
					}

					thread.appliedTags.forEach(subTag => {
						if(!tags[tag][subTag])
						{
							tags[tag][subTag] = 0;
						}

						tags[tag][subTag]++;
					})
				})
			})

			let description = "";

			for(const tagId in tags)
			{
				description += `${await getTagName(guild, forum.availableTags, tagId)}: ${tags[tagId][tagId]}\n`;

				for(const subTagId in tags[tagId])
				{
					if(subTagId == tagId)
						continue;
					description += `\* ${await getTagName(guild, forum.availableTags, subTagId)}: ${tags[tagId][subTagId]}\n`
				}
			}

			tagEmbed.setDescription(description);
		}

		const channel = await client.channels.fetch(process.env.SUPPORT_SQUAD_CHANNEL!)! as TextChannel;

		channel.send({embeds: [titleEmbed, redirectsEmbed, tagEmbed]});
	}
}