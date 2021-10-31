const mineflayer = require("mineflayer");
const Vec3 = require("vec3");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;
const { GoalNear, GoalBreakBlock } = require("mineflayer-pathfinder").goals;
const blockFinderPlugin = require("mineflayer-blockfinder")(mineflayer);
const bot = mineflayer.createBot({
  username: "zPrutsor",
  port: 62974,
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
    maxDistance: 128,
    count: 100000,
  });
  if (!blocks.length) {
    cant_find = true;
    // get_me_some_bamboo();
  } else {
    cant_find = false;
  }
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
        console.log("Collected");
        place_some_bamboo();
        return;
      });
    }
  });
};

const place_some_bamboo = async () => {
  console.log("Placing some bamboo");
  let mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);

  console.log("finding blocks");
  const blocks = bot.findBlocks({
    matching: mcData.blocksByName.grass_block.id,
    maxDistance: 64,
    count: 1000,
  });
  console.log("found blocks");

  let done = false;
  for (var i = 0; i < blocks.length; i++) {
    // console.log(i);
    const block_pos = blocks[i];
    const block = bot.blockAt(block_pos);
    const block_above = bot.blockAt(block_pos.offset(0, 1, 0));

    // console.log("wow");
    if (block_above.name === "air" && !done) {
      done = true;
      const bamboo = bot.inventory.findInventoryItem("bamboo", null);

      if (bamboo) {
        await bot.equip(bamboo);
        await bot.pathfinder.setMovements(defaultMove);
        console.log("moving");
        await bot.pathfinder.setGoal(
          new GoalNear(
            block_above.position.x,
            block_above.position.y,
            block_above.position.z,
            3
          )
        );
        await bot.lookAt(block_pos);
        console.log("arrived");

        console.log("placing");
        await bot.placeBlock(block, new Vec3(0, 1, 0), () => {
          console.log("yes");
        });
        console.log("placed");
        place_some_bamboo();
        console.log("done");
      } else {
        console.log("No bambooooo");
        done = true;
        get_me_some_bamboo();
        // bot.say("Give me some bamboo you fucking twat");
      }
    }
  }
  // console.log("done");
};

bot.on("physicTick", () => {
  let mcData = require("minecraft-data")(bot.version);

  if (cant_find) {
    console.log("wow");
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
