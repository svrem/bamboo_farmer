require("dotenv").config();

const mineflayer = require("mineflayer");
const autoeat = require("mineflayer-auto-eat");
const Vec3 = require("vec3");
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const Movements = require("mineflayer-pathfinder").Movements;
const { GoalNear, GoalBreakBlock } = require("mineflayer-pathfinder").goals;
const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
const bot = mineflayer.createBot({
  username: process.env.USERNAME,
  port: process.argv[2],
  host: process.argv[3] || "localhost",
  password: process.env.PASSWORD,
});

bot.loadPlugin(autoeat);
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
  // console.log(blocks.length);
  for (var i = 0; i < blocks.length; i++) {
    // console.log(i);
    const block_pos = blocks[i];
    const block = bot.blockAt(block_pos);
    const block_above = bot.blockAt(block_pos.offset(0, 1, 0));

    // console.log("wow");
    // console.log(block_above.name, done);
    if ((block_above.name === "air" || block_above.name === "grass") && !done) {
      console.log("found a place to place");

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

bot.on("spawn", async () => {
  await bot.waitForChunksToLoad();
  bot.autoEat.options.priority = "foodPoints";
  bot.autoEat.options.bannedFood = [];
  bot.autoEat.options.eatingTimeout = 3;

  mineflayerViewer(bot, { port: 3007, firstPerson: false });

  place_some_bamboo();
});

bot.on("error", (err) => {
  console.log(err);
  process.exit(0);
});

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable();
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable(); // Else enable the plugin again
});
