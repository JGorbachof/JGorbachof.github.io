import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const env=Object.fromEntries(
  fs.readFileSync(path.join(ROOT,".env"),"utf8")
    .split(/\r?\n/).filter(Boolean)
    .map(line=>{const i=line.indexOf("="); return [line.slice(0,i),line.slice(i+1)];})
);
const token=env.DISCORD_BOT_TOKEN;
const guildId=env.DISCORD_GUILD_ID;
if(!token||!guildId) throw new Error("Missing local Discord credentials.");

const config=JSON.parse(fs.readFileSync(path.join(ROOT,"server_config.json"),"utf8").replace(/^\uFEFF/,""));
const mods=JSON.parse(fs.readFileSync(path.join(ROOT,"..","data","mods.json"),"utf8").replace(/^\uFEFF/,""));
const headers={Authorization:"Bot "+token,"User-Agent":"GorbachofModdingHubAudit/2.0"};
const api=async endpoint=>{
  const r=await fetch("https://discord.com/api/v10"+endpoint,{headers});
  const t=await r.text(); const d=t?JSON.parse(t):null;
  if(!r.ok) throw new Error(`GET ${endpoint} failed: ${r.status} ${t}`);
  return d;
};

const guild=await api(`/guilds/${guildId}`);
const me=await api("/users/@me");
const roles=await api(`/guilds/${guildId}/roles`);
const channels=await api(`/guilds/${guildId}/channels`);
const automod=await api(`/guilds/${guildId}/auto-moderation/rules`);
const onboarding=await api(`/guilds/${guildId}/onboarding`);
const owner=await api(`/guilds/${guildId}/members/${guild.owner_id}`);

const expectedRoles=config.roles.map(r=>r.name);
const expectedCats=config.categories.map(c=>c.name);
const expectedChannels=config.categories.flatMap(c=>c.channels.map(ch=>ch.name));
const expectedAuto=config.automod.map(r=>r.name);
const actualRoles=roles.filter(r=>!r.managed).map(r=>r.name);
const actualCats=channels.filter(c=>c.type===4).map(c=>c.name);
const actualChannels=channels.filter(c=>c.type!==4).map(c=>c.name);
const actualAuto=automod.map(r=>r.name);
const creatorRole=roles.find(r=>r.name==="Creator");

const legacyNames=new Set([
  "Terra Universalis","Project Lead","Performance Ping","TESTING","DEVELOPMENT",
  "SUPPORT & REPORTS","Text Channels","Voice Channels","installation","known-issues",
  "changelog","questions","dev-chat","mod-updates","help-desk","bug-reports",
  "compatibility-issues","balance-feedback"
]);
const legacyPresent=[...legacyNames].filter(n=>actualRoles.includes(n)||actualCats.includes(n)||actualChannels.includes(n));

const supportChecks=mods.filter(m=>m.discordSupportChannel&&m.discordSupportCategory).map(m=>{
  const cat=channels.find(c=>c.type===4&&c.name===m.discordSupportCategory);
  const ch=channels.find(c=>c.type===0&&c.name===m.discordSupportChannel);
  return {
    game:m.game,
    project:m.title,
    category:m.discordSupportCategory,
    channel:m.discordSupportChannel,
    ok:Boolean(cat&&ch&&ch.parent_id===cat.id)
  };
});

const configuredCategoryOrder=config.categories.map(c=>c.name);
const liveManagedCategoryOrder=channels
  .filter(c=>c.type===4&&configuredCategoryOrder.includes(c.name))
  .sort((a,b)=>a.position-b.position)
  .map(c=>c.name);

const result={
  server_name:guild.name,
  server_name_ok:guild.name===config.server.name,
  bot_username:me.username,
  bot_username_ok:me.username==="Gorbachof Modding Hub",
  community_enabled:(guild.features||[]).includes("COMMUNITY"),
  welcome_enabled:(guild.features||[]).includes("WELCOME_SCREEN_ENABLED"),
  onboarding_enabled:onboarding.enabled,
  expected_role_count:expectedRoles.length,
  expected_category_count:expectedCats.length,
  expected_channel_count:expectedChannels.length,
  forum_count:channels.filter(c=>c.type===15).length,
  automod_count:automod.length,
  missing_roles:expectedRoles.filter(n=>!actualRoles.includes(n)),
  missing_categories:expectedCats.filter(n=>!actualCats.includes(n)),
  missing_channels:expectedChannels.filter(n=>!actualChannels.includes(n)),
  missing_automod:expectedAuto.filter(n=>!actualAuto.includes(n)),
  extra_categories:actualCats.filter(n=>!expectedCats.includes(n)),
  owner_has_creator_role:Boolean(creatorRole&&owner.roles.includes(creatorRole.id)),
  voice_channel_count:channels.filter(c=>c.type===2).length,
  category_order_ok:JSON.stringify(liveManagedCategoryOrder)===JSON.stringify(configuredCategoryOrder),
  support_groupings:supportChecks,
  all_support_groupings_ok:supportChecks.every(x=>x.ok),
  legacy_objects_present:legacyPresent
};
console.log(JSON.stringify(result,null,2));
