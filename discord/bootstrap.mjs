import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const CONFIG_PATH = path.join(ROOT, "server_config.json");
const CATALOG_PATH = path.join(ROOT, "..", "data", "mods.json");
const STATE_PATH = path.join(ROOT, "state.json");
const ENV_PATH = path.join(ROOT, ".env");
const API = "https://discord.com/api/v10";

const P = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  MODERATE_MEMBERS: 1n << 40n
};

const TYPE = { text: 0, voice: 2, category: 4, announcement: 5, forum: 15 };
const BASIC_WRITE = P.VIEW_CHANNEL | P.SEND_MESSAGES | P.SEND_MESSAGES_IN_THREADS |
  P.READ_MESSAGE_HISTORY | P.ADD_REACTIONS | P.EMBED_LINKS | P.ATTACH_FILES |
  P.CREATE_PUBLIC_THREADS;
const BASIC_READ = P.VIEW_CHANNEL | P.READ_MESSAGE_HISTORY;

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const out = {};
  for (const raw of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function applyCatalogSupportLayout(config) {
  if (!fs.existsSync(CATALOG_PATH)) return config;
  const mods = loadJson(CATALOG_PATH);
  const supportMods = mods.filter(m => m.discordSupportCategory && m.discordSupportChannel);
  if (!supportMods.length) return config;

  const categories = config.categories;
  for (const mod of supportMods) {
    let category = categories.find(c => c.name === mod.discordSupportCategory);
    if (!category) {
      category = { name: mod.discordSupportCategory, visibility: "public", channels: [] };
      const requestIndex = categories.findIndex(c => c.name === "REQUESTS & IDEAS");
      categories.splice(requestIndex >= 0 ? requestIndex : categories.length, 0, category);
    }

    if (!category.channels.some(c => c.name === mod.discordSupportChannel)) {
      category.channels.push({
        name: mod.discordSupportChannel,
        type: "text",
        topic: `Support and reports for ${mod.title}. Ask installation questions, report bugs or compatibility problems, and discuss balance/behavior. Start a thread for a distinct issue when practical.`,
        writable_by: ["@everyone"]
      });
    }
  }
  return config;
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function mask(names = []) {
  let value = 0n;
  for (const name of names) {
    if (!(name in P)) throw new Error(`Unknown permission: ${name}`);
    value |= P[name];
  }
  return value.toString();
}

function validate(config) {
  const roleNames = new Set();
  for (const role of config.roles) {
    if (roleNames.has(role.name)) throw new Error(`Duplicate role: ${role.name}`);
    roleNames.add(role.name);
    mask(role.permissions);
  }

  const channelNames = new Set();
  for (const category of config.categories) {
    for (const name of category.visible_to || []) {
      if (!roleNames.has(name)) throw new Error(`Unknown visible_to role ${name} in ${category.name}`);
    }
    for (const channel of category.channels) {
      if (channelNames.has(channel.name)) throw new Error(`Duplicate channel name: ${channel.name}`);
      channelNames.add(channel.name);
      if (!(channel.type in TYPE)) throw new Error(`Unknown channel type ${channel.type} for ${channel.name}`);
      for (const name of channel.writable_by || []) {
        if (name !== "@everyone" && !roleNames.has(name)) {
          throw new Error(`Unknown writable role ${name} in ${channel.name}`);
        }
      }
    }
  }

  for (const channel of Object.keys(config.seed_messages || {})) {
    if (!channelNames.has(channel)) throw new Error(`Seed message target does not exist: ${channel}`);
    for (const message of config.seed_messages[channel]) {
      if (message.length > 2000) throw new Error(`Seed message in #${channel} exceeds 2000 characters`);
    }
  }

  for (const name of config.onboarding?.default_channels || []) {
    if (!channelNames.has(name)) throw new Error(`Unknown onboarding channel: ${name}`);
  }
  console.log(`Config valid: ${config.roles.length} roles, ${config.categories.length} categories, ${channelNames.size} channels.`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function api(token, method, endpoint, body, retry = 0) {
  const headers = {
    Authorization: `Bot ${token}`,
    "User-Agent": "GorbachofModdingHubBootstrap/1.0",
    "Content-Type": "application/json"
  };
  const res = await fetch(API + endpoint, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (res.status === 429 && retry < 8) {
    const data = await res.json().catch(() => ({}));
    const seconds = Number(data.retry_after ?? 1);
    await sleep(Math.ceil(seconds * 1000) + 100);
    return api(token, method, endpoint, body, retry + 1);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error = new Error(`${method} ${endpoint} failed: HTTP ${res.status} ${text}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function indexByName(items) {
  return new Map(items.map(item => [item.name, item]));
}

function resolveOverwrites(guildId, category, channel, rolesByName) {
  const out = [];
  const restricted = category.visibility === "restricted";
  const everyone = { id: guildId, type: 0, allow: "0", deny: "0" };

  if (restricted) {
    everyone.deny = P.VIEW_CHANNEL.toString();
  } else {
    everyone.allow = BASIC_READ.toString();
    if ((channel.writable_by || []).includes("@everyone")) {
      everyone.allow = (BASIC_READ | BASIC_WRITE).toString();
    } else {
      everyone.deny = (P.SEND_MESSAGES | P.SEND_MESSAGES_IN_THREADS).toString();
    }
  }
  out.push(everyone);

  const visible = new Set(category.visible_to || []);
  const writable = new Set((channel.writable_by || []).filter(x => x !== "@everyone"));
  const allNamed = new Set([...visible, ...writable]);

  for (const name of allNamed) {
    const role = rolesByName.get(name);
    if (!role) throw new Error(`Cannot resolve role ${name}`);
    let allow = BASIC_READ;
    if (writable.has(name)) allow |= BASIC_WRITE;
    out.push({ id: role.id, type: 0, allow: allow.toString(), deny: "0" });
  }
  return out;
}

async function ensureRoles(token, guildId, config) {
  let roles = await api(token, "GET", `/guilds/${guildId}/roles`);
  let byName = indexByName(roles.filter(r => !r.managed));

  for (const spec of config.roles) {
    const payload = {
      name: spec.name,
      permissions: mask(spec.permissions),
      hoist: Boolean(spec.hoist),
      mentionable: Boolean(spec.mentionable)
    };
    let role = byName.get(spec.name);
    if (!role) {
      role = await api(token, "POST", `/guilds/${guildId}/roles`, payload);
      console.log(`Created role: ${spec.name}`);
    } else {
      role = await api(token, "PATCH", `/guilds/${guildId}/roles/${role.id}`, payload);
      console.log(`Updated role: ${spec.name}`);
    }
    byName.set(spec.name, role);
  }
  return byName;
}

async function ensureOwnerRole(token, guildId, ownerId, rolesByName) {
  const role = rolesByName.get("Creator");
  if (!role || !ownerId) return;
  await api(token, "PUT", `/guilds/${guildId}/members/${ownerId}/roles/${role.id}`);
  console.log("Ensured Creator role on server owner.");
}

async function ensureCategory(token, guildId, spec, channels) {
  let existing = channels.find(c => c.type === TYPE.category && c.name === spec.name);
  if (!existing) {
    existing = await api(token, "POST", `/guilds/${guildId}/channels`, {
      name: spec.name,
      type: TYPE.category
    });
    console.log(`Created category: ${spec.name}`);
    channels.push(existing);
  }
  return existing;
}

async function ensureCategoryOrder(token, guildId, config, channels) {
  const positions = [];
  for (let i = 0; i < config.categories.length; i++) {
    const category = channels.find(c => c.type === TYPE.category && c.name === config.categories[i].name);
    if (category) positions.push({ id: category.id, position: i });
  }
  if (positions.length) {
    await api(token, "PATCH", `/guilds/${guildId}/channels`, positions);
    console.log("Updated category order.");
  }
}

function forumTags(spec, existing) {
  const current = new Map((existing?.available_tags || []).map(t => [t.name, t]));
  return (spec.tags || []).map(name => {
    const prior = current.get(name);
    return prior ? { id: prior.id, name, moderated: false } : { name, moderated: false };
  });
}

async function ensureChannel(token, guildId, categorySpec, category, spec, channels, rolesByName) {
  const desiredType = TYPE[spec.type];
  let existing = channels.find(c => c.name === spec.name && c.type === desiredType);
  const payload = {
    name: spec.name,
    type: desiredType,
    parent_id: category.id,
    topic: spec.topic || null,
    permission_overwrites: resolveOverwrites(guildId, categorySpec, spec, rolesByName)
  };
  if (spec.type === "forum") {
    payload.available_tags = forumTags(spec, existing);
    payload.default_auto_archive_duration = 10080;
    payload.default_forum_layout = 0;
  }

  if (!existing) {
    existing = await api(token, "POST", `/guilds/${guildId}/channels`, payload);
    console.log(`Created #${spec.name}`);
    channels.push(existing);
  } else {
    const update = { ...payload };
    delete update.type;
    existing = await api(token, "PATCH", `/channels/${existing.id}`, update);
    console.log(`Updated #${spec.name}`);
    const idx = channels.findIndex(c => c.id === existing.id);
    if (idx >= 0) channels[idx] = existing;
  }
  return existing;
}

async function enableCommunity(token, guildId, config, channelsByName) {
  const guild = await api(token, "GET", `/guilds/${guildId}`);
  const rules = channelsByName.get("rules");
  const announcements = channelsByName.get("announcements");
  const modLog = channelsByName.get("mod-log");
  if (!rules || !announcements || !modLog) {
    throw new Error("rules, announcements, and mod-log must exist before Community can be enabled.");
  }

  const payload = {
    name: config.server.name,
    description: config.server.description,
    verification_level: config.server.verification_level,
    default_message_notifications: config.server.default_message_notifications,
    explicit_content_filter: config.server.explicit_content_filter,
    preferred_locale: config.server.preferred_locale,
    rules_channel_id: rules.id,
    public_updates_channel_id: announcements.id,
    safety_alerts_channel_id: modLog.id
  };

  if (!(guild.features || []).includes("COMMUNITY")) {
    payload.features = ["COMMUNITY"];
    console.log("Enabling Discord Community features...");
  }

  const updated = await api(token, "PATCH", `/guilds/${guildId}`, payload);
  console.log("Updated server safety/community settings.");
  return updated;
}

async function ensureWelcomeScreen(token, guildId, spec, channelsByName) {
  const welcome_channels = spec.channels.map(item => ({
    channel_id: channelsByName.get(item.name).id,
    description: item.description,
    emoji_id: null,
    emoji_name: item.emoji_name || null
  }));
  await api(token, "PATCH", `/guilds/${guildId}/welcome-screen`, {
    enabled: true,
    description: spec.description,
    welcome_channels
  });
  console.log("Updated welcome screen.");
}

async function ensureOnboarding(token, guildId, spec, channelsByName, rolesByName) {
  if (!spec?.enabled) return;

  const state = fs.existsSync(STATE_PATH) ? loadJson(STATE_PATH) : { messages: {} };
  state.onboarding ||= {};
  state.onboarding.prompt_ids ||= {};

  const makeSnowflake = (offset = 0n) =>
    (((BigInt(Date.now()) - 1420070400000n) << 22n) + 1000n + offset).toString();

  const prompts = (spec.prompts || []).map((prompt, promptIndex) => {
    let promptId = state.onboarding.prompt_ids[prompt.title];
    if (!promptId) {
      promptId = makeSnowflake(BigInt(promptIndex));
      state.onboarding.prompt_ids[prompt.title] = promptId;
    }

    return {
      id: promptId,
      type: 0,
      title: prompt.title,
      single_select: Boolean(prompt.single_select),
      required: Boolean(prompt.required),
      in_onboarding: true,
      options: prompt.options.map(option => ({
        title: option.title,
        description: option.description || null,
        channel_ids: (option.channels || []).map(name => channelsByName.get(name).id),
        role_ids: (option.roles || []).map(name => rolesByName.get(name).id)
      }))
    };
  });

  saveJson(STATE_PATH, state);

  const body = {
    prompts,
    default_channel_ids: spec.default_channels.map(name => channelsByName.get(name).id),
    enabled: true,
    mode: 0
  };

  try {
    await api(token, "PUT", `/guilds/${guildId}/onboarding`, body);
    console.log("Updated onboarding.");
  } catch (err) {
    console.warn("Onboarding could not be enabled automatically. The rest of the server is unaffected.");
    console.warn(err.message);
  }
}

async function ensureAutomod(token, guildId, rules, rolesByName, channelsByName) {
  const current = await api(token, "GET", `/guilds/${guildId}/auto-moderation/rules`);
  const byName = indexByName(current);

  for (const spec of rules || []) {
    const actions = spec.actions.map(action => {
      if (action.alert_channel) {
        return { type: action.type, metadata: { channel_id: channelsByName.get(action.alert_channel).id } };
      }
      return action;
    });

    const payload = {
      name: spec.name,
      event_type: 1,
      trigger_type: spec.trigger_type,
      actions,
      enabled: Boolean(spec.enabled),
      exempt_roles: (spec.exempt_roles || []).map(name => rolesByName.get(name).id),
      exempt_channels: []
    };
    if (spec.trigger_metadata && Object.keys(spec.trigger_metadata).length) {
      payload.trigger_metadata = spec.trigger_metadata;
    }

    let existing = byName.get(spec.name);
    if (!existing) {
      const sameType = current.filter(rule => rule.trigger_type === spec.trigger_type);
      if (sameType.length === 1) existing = sameType[0];
    }
    if (existing) {
      const update = { ...payload };
      delete update.trigger_type;
      await api(token, "PATCH", `/guilds/${guildId}/auto-moderation/rules/${existing.id}`, update);
      console.log(`Updated AutoMod: ${spec.name}`);
      byName.delete(existing.name);
      byName.set(spec.name, { ...existing, ...update, name: spec.name });
    } else {
      const created = await api(token, "POST", `/guilds/${guildId}/auto-moderation/rules`, payload);
      console.log(`Created AutoMod: ${spec.name}`);
      byName.set(spec.name, created);
    }
  }
}

async function syncSeedMessages(token, config, channelsByName) {
  const state = fs.existsSync(STATE_PATH) ? loadJson(STATE_PATH) : { messages: {} };
  state.messages ||= {};

  for (const [channelName, messages] of Object.entries(config.seed_messages || {})) {
    const channel = channelsByName.get(channelName);
    if (!channel) continue;
    const ids = state.messages[channelName] || [];

    for (let i = 0; i < messages.length; i++) {
      const content = messages[i];
      let id = ids[i];
      if (id) {
        try {
          await api(token, "PATCH", `/channels/${channel.id}/messages/${id}`, { content });
          console.log(`Updated seed message in #${channelName}`);
          continue;
        } catch (err) {
          if (err.status !== 404) throw err;
        }
      }

      const message = await api(token, "POST", `/channels/${channel.id}/messages`, { content });
      ids[i] = message.id;
      console.log(`Posted seed message in #${channelName}`);
    }

    state.messages[channelName] = ids;
  }

  saveJson(STATE_PATH, state);
}

async function sync() {
  const config = applyCatalogSupportLayout(loadJson(CONFIG_PATH));
  validate(config);
  const env = { ...loadEnv(), ...process.env };
  const token = env.DISCORD_BOT_TOKEN;
  const guildId = env.DISCORD_GUILD_ID;
  if (!token || !guildId) {
    throw new Error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Copy .env.example to .env after authorizing the bootstrap bot.");
  }

  const guild = await api(token, "GET", `/guilds/${guildId}`);
  console.log(`Connected to: ${guild.name} (${guild.id})`);

  const rolesByName = await ensureRoles(token, guildId, config);
  await ensureOwnerRole(token, guildId, guild.owner_id, rolesByName);
  let channels = await api(token, "GET", `/guilds/${guildId}/channels`);
  const categoryMap = new Map();

  for (const categorySpec of config.categories) {
    const category = await ensureCategory(token, guildId, categorySpec, channels);
    categoryMap.set(categorySpec.name, category);
  }
  await ensureCategoryOrder(token, guildId, config, channels);

  // Phase 1: ordinary text channels required for Community setup.
  for (const categorySpec of config.categories) {
    const category = categoryMap.get(categorySpec.name);
    for (const spec of categorySpec.channels.filter(c => c.type === "text")) {
      await ensureChannel(token, guildId, categorySpec, category, spec, channels, rolesByName);
    }
  }

  let channelsByName = indexByName(channels);
  await enableCommunity(token, guildId, config, channelsByName);

  // Phase 2: Community-only forum/announcement channels and any voice channels.
  channels = await api(token, "GET", `/guilds/${guildId}/channels`);
  for (const categorySpec of config.categories) {
    const category = channels.find(c => c.type === TYPE.category && c.name === categorySpec.name);
    for (const spec of categorySpec.channels.filter(c => c.type !== "text")) {
      await ensureChannel(token, guildId, categorySpec, category, spec, channels, rolesByName);
    }
  }

  channelsByName = indexByName(await api(token, "GET", `/guilds/${guildId}/channels`));
  await ensureAutomod(token, guildId, config.automod, rolesByName, channelsByName);
  await syncSeedMessages(token, config, channelsByName);
  await ensureWelcomeScreen(token, guildId, config.welcome_screen, channelsByName);
  await ensureOnboarding(token, guildId, config.onboarding, channelsByName, rolesByName);

  console.log("\nGorbachof Modding Hub Discord synchronization complete.");
  console.log("No channels or roles are deleted automatically by this script.");
}

const arg = process.argv[2] || "--validate";
const config = applyCatalogSupportLayout(loadJson(CONFIG_PATH));

if (arg === "--validate") {
  validate(config);
} else if (arg === "--plan") {
  validate(config);
  console.log("\nRoles:");
  for (const r of config.roles) console.log(`  - ${r.name}`);
  console.log("\nChannels:");
  for (const cat of config.categories) {
    console.log(`  [${cat.name}]`);
    for (const ch of cat.channels) console.log(`    - ${ch.name} (${ch.type})`);
  }
} else if (arg === "--sync") {
  await sync();
} else {
  console.error("Usage: node bootstrap.mjs --validate | --plan | --sync");
  process.exitCode = 2;
}
