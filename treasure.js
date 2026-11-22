/* Fab Fox World treasure: every treasure a child wins (in Learning, in games, or out in the world) has a job.
   Snacks feed Pip. The rest are ingredients: collect the number shown and the thing it makes is unlocked in "My stuff".
   One list, used by the Learning Hub (to explain today's mission) and by Fab Fox World (Treasure book and My stuff). */
const FAB_TREASURE = {
  list: [
    { e:'🍎', n:'Apple', food:1, why:'a crunchy snack for Pip', tip:'Bring snacks home and feed Pip. Fed pups grow big and happy.' },
    { e:'🍓', n:'Strawberry', food:1, why:'a sweet snack for Pip', tip:'Bring snacks home and feed Pip.' },
    { e:'🫐', n:'Blueberries', food:1, why:'a snack Pip loves', tip:'Bring snacks home and feed Pip.' },
    { e:'🍯', n:'Honey drop', food:1, why:'a special treat for Pip', tip:'A treat for Pip. Bring it home.' },
    { e:'🍄', n:'Mushroom', need:3, make:'a Toadstool seat for your garden', tip:'Mushrooms pop up in damp, shady places. Real ones can be unsafe, so we only look and never taste!' },
    { e:'🌰', n:'Acorn', need:3, make:'a Bird table', tip:'Acorns fall from oak trees. Squirrels and jays bury them for winter.' },
    { e:'🍂', n:'Golden leaf', need:3, make:'a Leaf cape for Fab', tip:'Leaves turn gold in autumn before they fall.' },
    { e:'🪶', n:'Feather', need:3, make:'a Feather headband for Fab', tip:'Birds grow feathers to fly and to keep warm.' },
    { e:'🐚', n:'Shell', need:3, make:'a Shell necklace for Fab', tip:'Shells are the homes of sea animals.' },
    { e:'🌸', n:'Blossom', need:3, make:'a Blossom tree', tip:'Blossom is the flower on a tree in spring. It turns into fruit.' },
    { e:'🪨', n:'Shiny pebble', need:3, make:'a Rock garden', tip:'Pebbles are smoothed by water over a very long time.' },
    { e:'🌻', n:'Sunflower', need:3, make:'a Sunflower patch', tip:'Sunflowers turn their faces to follow the sun.' },
    { e:'🦋', n:'Butterfly', need:3, make:'Butterfly wings for Fab', tip:'A butterfly starts as a caterpillar and changes completely.' },
    { e:'🐞', n:'Ladybird', need:3, make:'a Bug hotel', tip:'Ladybirds eat tiny pests, so gardeners love them.' },
    { e:'🌈', n:'Rainbow piece', need:3, make:'a Rainbow scarf for Fab', tip:'A rainbow appears when sun shines through raindrops.' },
    { e:'🪺', n:'Nest', need:3, make:'a cosy bed for Pip, so Pip rests faster', tip:'Birds build nests from twigs, grass and feathers.' },
    { e:'🍯', n:'Honey drop', hide:1 },
    { e:'🌿', n:'Fern', need:3, make:'a Fern corner', tip:'Ferns are very old plants. They grow from spores, not seeds.' },
    { e:'💎', n:'Gem', need:3, make:'a Gem crown for Fab', tip:'Gems form slowly deep in the ground.' },
    { e:'🔔', n:'Bluebell', need:3, make:'Bluebell chimes', tip:'Bluebells carpet woods in spring.' },
    { e:'🌙', n:'Moon shard', need:3, make:'a Moon lantern', tip:'The Moon shines because it reflects the Sun’s light.' },
    { e:'🌼', n:'Daisy', need:3, make:'a Flower crown for Fab', tip:'Daisies close their petals at night.' },
    { e:'🪁', n:'Kite', need:2, make:'a Kite for Fab to hold', tip:'Kites fly because wind pushes up under them.' },
    { e:'✨', n:'Sparkle', need:5, make:'a Sparkle trail behind Fab', tip:'Sparkles are the tiniest treasures.' },
    { e:'🪻', n:'Lavender', need:3, make:'a Lavender patch', tip:'Lavender smells calm and bees love it.' },
    { e:'🌟', n:'Glow star', need:3, make:'a Star lantern', tip:'Stars are far-away suns.' },
    { e:'⭐', n:'Star', spend:1, why:'sparkles to spend in My stuff', tip:'Every right answer and every game earns stars. Spend them in My stuff.' }
  ].filter(t => !t.hide)
};
FAB_TREASURE.by = {}; FAB_TREASURE.list.forEach(t => { FAB_TREASURE.by[t.e] = t; });
/* One short sentence: why this treasure is worth finding (used in the Learning mission). */
FAB_TREASURE.job = function(e){
  const t = FAB_TREASURE.by[e]; if(!t) return '';
  if(t.food) return 'It is ' + t.why + '.';
  if(t.spend) return 'Stars buy things in My stuff.';
  return 'Collect ' + t.need + ' to make ' + t.make + '.';
};
/* const does not create a window property; the world game reads it from its parent window. */
try{ window.FAB_TREASURE = FAB_TREASURE; }catch(e){}
