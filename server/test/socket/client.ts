import "dotenv/config";
import readline from "readline";
import chalk from "chalk";

import { io } from "socket.io-client";
import logger from "../../src/shared/utils/logger";
import env from "../../src/config/env";

const name = process.argv[2];
const cookie = process.argv[3];
const conversationId = process.argv[4];
let lastMessageId: string | null = null;
let readdebounceTimer: NodeJS.Timeout;
const READ_DEBOUNCE_MS = 500;

interface ReactionsUpdateEvent {
  messageId: string;
  emoji?: string;
  type: string;
  reactions: Record<string, string[]>;
  senderUserName: string;
}

const socket = io(`http://localhost:${env.PORT}`, {
  transportOptions: { polling: { extraHeaders: { Cookie: cookie } } },
});

socket.on("connect_error", (err: any) => {
  logger.error({ message: err.message }, `[${name}] connect error:`);
});

socket.on("ping:new", (data) =>
  logger.debug(
    { data },
    `[${name}] got message: @${data.requester.username} pinged you`,
  ),
);

socket.on("ping:accepted", (data) =>
  logger.debug(
    { data },
    `[${name}] got message: @${data.requester.username} accepted your ping`,
  ),
);

socket.on("ping:declined", (data) =>
  logger.debug(
    { data },
    `[${name}] got message: @${data.requester.username} declined your ping`,
  ),
);

socket.on("message:new", (data) => {
  const {
    replyTo,
    body,
    conversationId: msgConversationId,
    senderUsername,
    mentions,
  } = data;

  if (msgConversationId !== conversationId) {
    process.stdout.write(
      chalk.yellow(
        `\n🔔 New message in another conversation from @${senderUsername} in chat ${msgConversationId.slice(0, 8)}...\n`,
      ),
    );
    return;
  }

  process.stdout.write(`\n${chalk.cyan.bold(`👤 @${senderUsername}`)}\n`);

  if (replyTo) {
    process.stdout.write(`${chalk.dim(`   ↪ ${replyTo.content}`)}\n`);
  }

  if (mentions) {
    process.stdout.write(`   ${chalk.yellow.bold(`@${mentions}`)} ${body}\n`);
  } else {
    process.stdout.write(`   ${chalk.white(body)}\n`);
  }

  lastMessageId = data.id;

  clearTimeout(readdebounceTimer);

  const sender = senderUsername.toLowerCase().includes(name?.toLowerCase());

  readdebounceTimer = setTimeout(() => {
    if (!sender) {
      socket.emit("message:read", {
        conversationId,
        lastMessageId,
      });
    }
  }, READ_DEBOUNCE_MS);
});

socket.on("reactions:update", (data: ReactionsUpdateEvent) => {
  const reactionSummary = Object.entries(data.reactions)
    .map(([emoji, users]) => `${emoji} × ${users.length}`)
    .join(" ");

  const messageId = chalk.dim(`[${data.messageId.slice(0, 8)}...]`);

  if (data.type === "remove") {
    process.stdout.write(
      `\n${chalk.cyan.bold(`👤 @${data.senderUserName}`)}\n` +
        `   ${chalk.red(`➖ Removed ${data.emoji}`)} ${messageId}\n` +
        `   ${chalk.magenta(reactionSummary)}\n`,
    );
    return;
  }

  process.stdout.write(
    `\n${chalk.cyan.bold(`👤 @${data.senderUserName}`)}\n` +
      `   ${chalk.green(`➕ Reacted ${data.emoji}`)} ${messageId}\n` +
      `   ${chalk.magenta(reactionSummary)}\n`,
  );
});

socket.on("read:update", (data) => {
  const { conversationId: msgConversationId } = data;

  if (msgConversationId !== conversationId) return;

  process.stdout.write(`\n ${chalk.green.bold("✓✓")}\n`);
});

socket.on("mention:notify", (data) => {
  process.stdout.write(`\n🔔 You were mentioned by @${data.senderUsername}\n`);
});

socket.on("group:join", (data) => {
  const { conversationId: msgConversationId, requester } = data;

  if (msgConversationId !== conversationId) return;

  if (requester.joinedBy === "admin") {
    console.log(
      chalk.dim("────────── ") +
        chalk.bgGrey(
          `@${requester.username} added @[${requester.memberId.slice(0, 8)}]`,
        ) +
        chalk.dim(" ──────────"),
    );
    return;
  }

  console.log(
    chalk.dim("────────── ") +
      chalk.greenBright(`@${requester.username} joined`) +
      chalk.dim(" ──────────"),
  );
});

socket.on("group:leave", (data) => {
  const { conversationId: msgConversationId, requester } = data;

  if (msgConversationId !== conversationId) return;

  if (requester.joinedBy === "admin") {
    console.log(" ");
    console.log(
      chalk.dim("────────── ") +
        chalk.bgGrey(
          `@${requester.username} removed @[${requester.memberId.slice(0, 8)}]`,
        ) +
        chalk.dim(" ──────────"),
    );
    return;
  }

  console.log(
    chalk.dim("────────── ") +
      chalk.greenBright(`@${requester.username} left the group`) +
      chalk.dim(" ──────────"),
  );
});

socket.on("group-settings:updated", (payload) => {
  const { conversationId: msgConversationId, updates, updatedBy } = payload;

  if (msgConversationId !== conversationId) return;

  const prefix = chalk.dim("────────── ");
  const suffix = chalk.dim(" ──────────");

  if (updates.name) {
    console.log(
      prefix +
        chalk.cyanBright(
          `@${updatedBy.username} updated the group name to "${updates.name}"`,
        ) +
        suffix,
    );
  }

  if (updates.description) {
    console.log(
      prefix +
        chalk.cyanBright(
          `@${updatedBy.username} updated the group description`,
        ) +
        suffix,
    );
  }

  if (updates.avatarUrl) {
    console.log(
      prefix +
        chalk.cyanBright(
          `@${updatedBy.username} updated the group profile picture`,
        ) +
        suffix,
    );
  }

  if (updates.visibility) {
    console.log(
      prefix +
        chalk.cyanBright(
          `@${updatedBy.username} updated the group to "${updates.visibility}"`,
        ) +
        suffix,
    );
  }
});

socket.on("group:deleted", (payload) => {
  const { conversationId: msgConversationId, deletedBy } = payload;

  if (msgConversationId !== conversationId) return;

  console.log(" ");
  console.log(
    chalk.dim("────────── ") +
      chalk.redBright(
        `This group was deleted by @${deletedBy.username ?? deletedBy.id}`,
      ) +
      chalk.dim(" ──────────"),
  );
});

// this is is a test only do not add to real code
socket.on("test:should-not-arrive", () => {
  console.log(
    chalk.bgRed("❌ EVACUATION FAILED — socket still in deleted room"),
  );
});

socket.on("error", (msg) => {
  logger.debug(`Server error: ${msg}`);
});

socket.on("connect", () => {
  logger.debug(`[${name}] connected`);
  socket.emit("conversation:join", { conversationId }, (response: any) => {
    if (!response.success) {
      logger.error(response.message);
      return;
    }
    logger.info(response);
  });
});

const rl = readline.createInterface({ input: process.stdin });

socket.on("typing:update", ({ username, isTyping }) => {
  if (isTyping) {
    process.stdout.write(`\n[@${username}] is typing..\n`);
  } else {
    process.stdout.write(`\n[@${username}] stopped typing..\n`);
  }
});

rl.on("line", (line) => {
  readline.moveCursor(process.stdout, 0, -1);
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  try {
    const content = line.trim();

    if (!content) {
      logger.error("Message can't be empty: try again.");
      return;
    }

    const isReply = content.match(/^\/reply\s+(\S+)\s+(.+)$/);
    const isReaction = content.match(/^\/react\s+(\S+)\s+(.+)$/);
    const unReactMatch = content.match(/^\/unreact\s+(\S+)$/);
    const isMentions = content.match(/^\/mentions\s+(.+?)\s*\|\s*(.+)$/);

    if (line === "/typing") {
      socket.emit("typing:start", { conversationId });
      return;
    }

    if (isReply) {
      const [, replyToMessageId, content] = isReply;

      socket.emit(
        "message:send",
        {
          tempId: crypto.randomUUID(),
          replyToMessageId,
          conversationId,
          content,
        },
        (response: any) => {
          if (!response.success) {
            logger.error(response.message);
            return;
          }

          process.stdout.write(
            `\n${chalk.cyan.bold("👤 You")}\n` +
              `${chalk.dim(`   ↪ Reply to: ${replyToMessageId?.slice(0, 8)}...`)}\n` +
              `   ${chalk.white(content)} ${chalk.green("✓")}\n`,
          );
        },
      );
      return;
    }

    if (isReaction) {
      const [, messageId, emoji] = isReaction;

      socket.emit(
        "reactions:add",
        {
          conversationId,
          messageId,
          emoji,
        },
        (response: any) => {
          if (!response.success) {
            logger.error(response.message);
            return;
          }

          process.stdout.write(
            `\n${chalk.cyan.bold("👤 You")}\n` +
              `   ${chalk.green(`➕ ${emoji}`)} ${chalk.dim(`[${messageId?.slice(0, 8)}...]`)} ${chalk.green("✓")}\n`,
          );
        },
      );
      return;
    }

    if (unReactMatch) {
      const [, messageId] = unReactMatch;

      socket.emit(
        "reactions:remove",
        { conversationId, messageId },
        (response: any) => {
          if (!response.success) {
            logger.error(response.message);
            return;
          }

          process.stdout.write(
            `\n${chalk.cyan.bold("👤 You")}\n` +
              `   ${chalk.red(`➖ Removed ${response.emoji}`)} ${chalk.dim(`[${messageId?.slice(0, 8)}...]`)} ${chalk.green("✓")}\n`,
          );
        },
      );
      return;
    }

    if (isMentions) {
      const [, mentionedUsers, content] = isMentions;
      const mentionUserId = mentionedUsers?.split(/\s+/);
      const uniqueIds = [...new Set(mentionUserId)];

      socket.emit(
        "message:send",
        {
          tempId: crypto.randomUUID(),
          conversationId,
          content,
          mentions: uniqueIds.map((id) => ({
            userId: id,
          })),
        },
        (response: any) => {
          if (!response.success) {
            logger.error(response.message);
            return;
          }

          const mentions = mentionUserId?.length
            ? chalk.yellow(
                `📣 Mentions: ${mentionUserId
                  .map((id) => `[${id.slice(0, 8)}...]`)
                  .join(" ")}`,
              )
            : "";

          process.stdout.write(
            `\n${chalk.cyan.bold("👤 You")}\n` +
              `   ${chalk.white(content)}\n` +
              (mentions ? `   ${mentions}\n` : "") +
              `   ${chalk.green("✓")}\n`,
          );
        },
      );
      return;
    }

    socket.emit(
      "message:send",
      { tempId: crypto.randomUUID(), conversationId, content },
      (response: any) => {
        if (!response.success) {
          logger.error(response.message);
          return;
        }

        process.stdout.write(
          `\n${chalk.cyan.bold("👤 You")}\n` +
            `   ${chalk.white(content)} ${chalk.white.bold("✓")}\n`,
        );
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to send message");
  }
});

// charlie  9feb36db-5ded-46bf-81ae-942aba4d08ae
// Bob  871c9e8a-156f-4887-aeea-64ae72a81ead
// Ethan 87b24ef4-82b5-4a27-8a2f-d55936f9990a
// Diana     510689ac-ed99-48a8-b27d-81775fc9b326


// c75928cb-e24f-4938-8640-bf603c363d18
// new test 2ff38826-cda3-4199-902e-675809bfa6e3

// charlie - bob 11424705-c01d-409a-b24a-d8eb27489a81

// npm run client -- Bob "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NzFjOWU4YS0xNTZmLTQ4ODctYWVlYS02NGFlNzJhODFlYWQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiYm9iX2thZGUiLCJpYXQiOjE3ODU4OTkyMDEsImV4cCI6MTc4NjUwNDAwMX0.rSrX_qWcAskKLYPphHBb8G2h_HQS4nJAKPeVhbLQbao" 11424705-c01d-409a-b24a-d8eb27489a81

// npm run client -- Charlie "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZmViMzZkYi01ZGVkLTQ2YmYtODFhZS05NDJhYmE0ZDA4YWUiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiY2hhcmxpZV9xdSIsImlhdCI6MTc4NTg5OTEyMiwiZXhwIjoxNzg2NTAzOTIyfQ.0p_rmamHvafvmfKjushyr-zsNE4xynO8Ha7BJNcoZA8" 11424705-c01d-409a-b24a-d8eb27489a81

// npm run client -- Ethan "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4N2IyNGVmNC04MmI1LTRhMjctOGEyZi1kNTU5MzZmOTk5MGEiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiZXRoYW5fdmFsZSIsImlhdCI6MTc4NTI4NjAzNCwiZXhwIjoxNzg1ODkwODM0fQ.yanNb4LpFUdsV9Oi4fb6UOLV2fziQKbg40fxP3Cbgzw" c75928cb-e24f-4938-8640-bf603c363d18

// `npm run client -- Diana "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTA2ODlhYy1lZDk5LTQ4YTgtYjI3ZC04MTc3NWZjOWIzMjYiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiZGlhbmFfZnJvc3QiLCJpYXQiOjE3ODUyODYxNTAsImV4cCI6MTc4NTg5MDk1MH0.4rmFvvlFQh2pqd-mzO3BIR3uJds_r8OokRAm5o8xvIc" c75928cb-e24f-4938-8640-bf603c363d18

// npm run client -- Alice "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZTE3MDI5OS02ODk0LTRmNWYtOGUxNS05YWYwNjk2ODMwYzYiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiYWxpY2Vfd3JlbiIsImlhdCI6MTc4NTY0MTU1NywiZXhwIjoxNzg2MjQ2MzU3fQ.oRus9IIONF7kJzSrimhC8BzvKAeyF3O_PXyF7d82kVw" c75928cb-e24f-4938-8640-bf603c363d18

// npm run client -- Fiona "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMzkxZDdhOS02Zjk4LTRlNDUtYjE5Yy0wNDhjOWZjNTE4N2UiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiZmlvbmFfcmV5ZXMiLCJpYXQiOjE3ODU5MDI5NDEsImV4cCI6MTc4NjUwNzc0MX0.YyQwuMmXTKfIb1c3GPeshuz3p3isG85O3Oik8teB8KQ" 2ff38826-cda3-4199-902e-675809bfa6e3

0;

// 107ffc56-c76d-4c4e-8b52-a180cb840c99


//https://www.google.com/search?q=file+chucking+in+js&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRiPAjIHCAMQIRiPAtIBCDg5NjBqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8&fbs=ABfTbFVyMZGZf1hfvX9uKjN_-G8cxpBkeIeqYwoCbfNVc4vKE-Dsslc-KGKq55jF_BVsFlBx_GgM0fzV1XsSsLkzcasTEYACEWIWzF-55pNrwAKUeHOsvxvmV9GK7aWe1Dt1gL64_6AW-QckrVHvnHTPedn5XwOjq987LNieADrcZC5zb9vopqTkIxdxJQBIFSe4oRzEDiT-RTdS-c23O0A2AKDxrz1Jzw&aep=10&ntc=1&sxsrf=APpeQnsvvD1qTxRCZr5F59AJpavL2c7dpQ%3A1788214646714&mstk=AUtExfBAoJsqcfxd5_d-1AxSon4HZ9qSEHAL9A8Ap9PsocsoxXdR-L614o5KJAOLj3QTu-I0frMe6nEwEekf5-De_L6qTIR7J6yopVGPCFn_8oYO0A7Ai_E7F2bSLo929rsEsOVogsDYDC9EptlXd4vx-y-XQODRaogmRiT4MvBtgucHzQN-kk-7uyikkg8Dk-ck5NiTMvNb3T6TcDIOcxeMC3YBRoHXxRKzvxb2_07NCXXjnxDvgtXnzGC0po4mswGP5fshbJRW1lopWYwAYlyh_KwLfB-sOLFXt9wQtwtAIgW_Lo22HF1iFJxVHhkIX-yFGxwEc-MPOeLFZg&aioh=3&csuir=1&cs=1&atvm=2&mtid=wf2Vas6LHb--hbIPh-DoyQs&udm=50