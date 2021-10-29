const mineflayer = require("mineflayer");
const Vec3 = require("vec3");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;
const { GoalNear, GoalBreakBlock } = require("mineflayer-pathfinder").goals;
const blockFinderPlugin = require("mineflayer-blockfinder")(mineflayer);
const bot = mineflayer.createBot({
  username: "zPrutsor",
  port: 52153,
  host: "localhost",
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

bot.loadPlugin(require("mineflayer-collectblock").plugin);
bot.loadPlugin(pathfinder);

let cant_find = false;

const get_me_some_bamboo = () => {
  let mcData = require("minecraft-data")(bot.version);

  const blocks = bot.findBlocks({
    matching: mcData.blocksByName.bamboo.id,
    maxDistance: 256,
    count: 100000,
  });
  if (!blocks.length) {
    cant_find = true;
    // get_me_some_bamboo();
  } else {
    cant_find = false;
  }
  console.log(!blocks.length);
  let done = false;
  blocks.forEach(async (block_pos) => {
    const block = bot.blockAt(block_pos);
    const block_under = bot.blockAt(block_pos.offset(0, -1, 0));
    const two_blocks_under = bot.blockAt(block_pos.offset(0, -2, 0));

    if (
      block_under.name === "bamboo" &&
      two_blocks_under.name !== "bamboo" &&
      !done
    ) {
      done = true;
      // await bot.pathfinder.setMovements(new Movements(bot, mcData));
      // await bot.pathfinder.setGoal(
      //   new GoalBreakBlock(
      //     block.position.x,
      //     block.position.y,
      //     block.position.z,
      //     bot
      //   )
      // );
      // try {
      //   await bot.lookAt(block_pos);
      //   await delay(200);
      //   await bot.dig(block);
      // } catch (err) {
      //   console.log(err);
      // }
      bot.collectBlock.collect(block_under, (err) => {
        console.log(err);
        place_some_bamboo();
        return;
      });
    }
  });
};

const place_some_bamboo = () => {
  let mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);

  const blocks = bot.findBlocks({
    matching: mcData.blocksByName.grass_block.id,
    maxDistance: 64,
    count: 10000000,
  });

  let done = false;
  blocks.forEach(async (block_pos) => {
    const block = bot.blockAt(block_pos);
    const block_above = bot.blockAt(block_pos.offset(0, 1, 0));

    if (block_above.name === "air" && !done) {
      done = true;
      const bamboo = bot.inventory.findInventoryItem("bamboo", null);

      if (bamboo) {
        await bot.equip(bamboo);
        await bot.pathfinder.setMovements(defaultMove);
        await bot.pathfinder.setGoal(
          new GoalNear(
            block_above.position.x,
            block_above.position.y,
            block_above.position.z,
            3
          )
        );
        try {
          await bot.lookAt(block_pos);
          await bot.placeBlock(block, new Vec3(0, 1, 0));
        } catch (err) {
          done = false;
        }

        place_some_bamboo();
      } else {
        console.log("No bambooooo");
        get_me_some_bamboo();
        // bot.say("Give me some bamboo you fucking twat");
      }
    }
  });
};

bot.on("physicTick", () => {
  let mcData = require("minecraft-data")(bot.version);

  if (cant_find) {
    const blocks = bot.findBlocks({
      matching: mcData.blocksByName.bamboo.id,
      maxDistance: 64,
      count: 100,
    });

    if (blocks.length) {
      cant_find = false;
      get_me_some_bamboo();
    }
  }
});

bot.on("spawn", () => {
  // get_me_some_bamboo();
  place_some_bamboo();
});
