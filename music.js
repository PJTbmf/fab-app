/* Fab Music: a big keyboard with sheet music above it, easy songs to follow, recording (with an optional voice),
   MP3 download, Fab Fox World rewards and a certificate to take home.
   No timers and no wrong notes: a different key just plays that note. Everything stays on this device, kept by pupil code.
   window.FabMusic */
(function(){
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const who = () => { try{ return (typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'device'; }catch(e){ return 'device'; } };
  const reduced = () => { try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- notes ---------- */
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SEMI = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midiOf = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return m ? 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] ? 1 : 0) : NaN; };
  const nameOf = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
  const letterOf = m => NAMES[m % 12][0];
  const sharp = m => NAMES[m % 12].length > 1;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  /* staff step: E4 (bottom line) is 0, each line or space is one step; a sharp sits on its letter */
  const stepOf = m => LETTERS.indexOf(letterOf(m)) + 7 * (Math.floor(m / 12) - 1) - (2 + 7 * 4);
  /* note colours (letters on them pass WCAG AA contrast) */
  const COL = { C:'#C62828', D:'#FB8C00', E:'#FBC02D', F:'#2E7D32', G:'#006D77', A:'#1565C0', B:'#6A1B9A' };
  const COL_INK = { C:'#ffffff', D:'#2b1a12', E:'#2b1a12', F:'#ffffff', G:'#ffffff', A:'#ffffff', B:'#ffffff' };
  const INK = '#2b1a12';

  /* ---------- songs ----------
     All out of copyright (traditional, or very old), all on the white keys. Notes are written pitch + length + :word.
     Lengths: w = 4 beats, h. = 3, h = 2, q. = 1.5, q = 1, e = half a beat. Lines are also the places to stop. */
  const DUR = { w:4, 'h.':3, h:2, 'q.':1.5, q:1, e:.5 };
  const SONGS = [
    { id:'hot-cross-buns', title:'Hot Cross Buns', level:1, time:[4, 4], bpm:100, lines:[2, 2],
      about:'An old street-sellers’ song. Just three notes: E, D and C.', bars:[
      'E4q:Hot D4q:cross C4h:buns,', 'E4q:hot D4q:cross C4h:buns,',
      'C4e:One C4e:a C4e:pen- C4e:ny, D4e:two D4e:a D4e:pen- D4e:ny,', 'E4q:hot D4q:cross C4h:buns.'] },
    { id:'mary-lamb', title:'Mary Had a Little Lamb', level:1, time:[4, 4], bpm:100, lines:[4, 4],
      about:'A nursery rhyme from 1830. Four notes: C, D, E and G.', bars:[
      'E4q:Ma- D4q:ry C4q:had D4q:a', 'E4q:lit- E4q:tle E4h:lamb,', 'D4q:lit- D4q:tle D4h:lamb,', 'E4q:lit- G4q:tle G4h:lamb.',
      'E4q:Ma- D4q:ry C4q:had D4q:a', 'E4q:lit- E4q:tle E4q:lamb, E4q:its', 'D4q:fleece D4q:was E4q:white D4q:as', 'C4w:snow.'] },
    { id:'ode-to-joy', title:'Ode to Joy', level:1, time:[4, 4], bpm:100, lines:[4, 4], noWords:true,
      about:'A famous tune by Ludwig van Beethoven. Five notes next to each other: C, D, E, F and G.', bars:[
      'E4q E4q F4q G4q', 'G4q F4q E4q D4q', 'C4q C4q D4q E4q', 'E4q. D4e D4h',
      'E4q E4q F4q G4q', 'G4q F4q E4q D4q', 'C4q C4q D4q E4q', 'D4q. C4e C4h'] },
    { id:'twinkle', title:'Twinkle Twinkle Little Star', level:2, time:[4, 4], bpm:92, lines:[4, 4, 4],
      about:'Words by Jane Taylor (1806) to an old French tune.', bars:[
      'C4q:Twin- C4q:kle G4q:twin- G4q:kle', 'A4q:lit- A4q:tle G4h:star,', 'F4q:how F4q:I E4q:won- E4q:der', 'D4q:what D4q:you C4h:are.',
      'G4q:Up G4q:a- F4q:bove F4q:the', 'E4q:world E4q:so D4h:high,', 'G4q:like G4q:a F4q:dia- F4q:mond', 'E4q:in E4q:the D4h:sky.',
      'C4q:Twin- C4q:kle G4q:twin- G4q:kle', 'A4q:lit- A4q:tle G4h:star,', 'F4q:how F4q:I E4q:won- E4q:der', 'D4q:what D4q:you C4h:are.'] },
    { id:'jingle-bells', title:'Jingle Bells', level:2, time:[4, 4], bpm:112, lines:[4, 4, 4, 4], christmas:true,
      about:'The chorus of a song by James Lord Pierpont (1857).', bars:[
      'E4q:Jin- E4q:gle E4h:bells,', 'E4q:jin- E4q:gle E4h:bells,', 'E4q:jin- G4q:gle C4q.:all D4e:the', 'E4w:way.',
      'F4q:Oh F4q:what F4q.:fun F4e:it', 'F4q:is E4q:to E4q:ride E4e:in E4e:a', 'E4q:one D4q:horse D4q:o- E4q:pen', 'D4h:sleigh, G4h:hey!',
      'E4q:Jin- E4q:gle E4h:bells,', 'E4q:jin- E4q:gle E4h:bells,', 'E4q:jin- G4q:gle C4q.:all D4e:the', 'E4w:way.',
      'F4q:Oh F4q:what F4q:fun F4q:it', 'F4q:is E4q:to E4q:ride E4e:in E4e:a', 'G4q:one G4q:horse F4q:o- D4q:pen', 'C4w:sleigh!'] },
    { id:'row-your-boat', title:'Row, Row, Row Your Boat', level:2, time:[6, 8], bpm:96, lines:[4, 4],
      about:'A round from the 1850s. It uses the notes from C up to high C.', bars:[
      'C4q.:Row, C4q.:row,', 'C4q:row D4e:your E4q.:boat', 'E4q:gent- D4e:ly E4q:down F4e:the', 'G4h.:stream.',
      'C5e:Mer- C5e:ri- C5e:ly G4e:mer- G4e:ri- G4e:ly', 'E4e:mer- E4e:ri- E4e:ly C4e:mer- C4e:ri- C4e:ly,', 'G4q:life F4e:is E4q:but D4e:a', 'C4h.:dream.'] },
    { id:'london-bridge', title:'London Bridge', level:2, time:[4, 4], bpm:100, lines:[4, 4],
      about:'A very old singing game.', bars:[
      'G4q.:Lon- A4e:don G4q:Bridge F4q:is', 'E4q:fall- F4q:ing G4h:down,', 'D4q:fall- E4q:ing F4h:down,', 'E4q:fall- F4q:ing G4h:down.',
      'G4q.:Lon- A4e:don G4q:Bridge F4q:is', 'E4q:fall- F4q:ing G4h:down,', 'D4h:my G4h:fair', 'E4q:la- C4h.:dy.'] },
    { id:'are-you-sleeping', title:'Are You Sleeping? (Frère Jacques)', level:3, time:[4, 4], bpm:96, lines:[4, 4],
      about:'A French round. It starts on G and goes up to high E.', bars:[
      'G4q:Are A4q:you B4q:sleep- G4q:ing,', 'G4q:are A4q:you B4q:sleep- G4q:ing,', 'B4q:Bro- C5q:ther D5h:John,', 'B4q:Bro- C5q:ther D5h:John?',
      'D5e:Morn- E5e:ing D5e:bells C5e:are B4q:ring- G4q:ing,', 'D5e:morn- E5e:ing D5e:bells C5e:are B4q:ring- G4q:ing,', 'G4q:ding D4q:dang G4h:dong,', 'G4q:ding D4q:dang G4h:dong.'] },
    { id:'old-macdonald', title:'Old MacDonald Had a Farm', level:3, time:[4, 4], bpm:108, lines:[4, 4],
      about:'A traditional farm song.', bars:[
      'G4q:Old G4q:Mac- G4q:Don- D4q:ald', 'E4q:had E4q:a D4h:farm,', 'B4q:E- B4q:I- A4q:E- A4q:I-', 'G4h.:O! D4q:And',
      'G4q:on G4q:that G4q:farm D4q:he', 'E4q:had E4q:a D4h:cow,', 'B4q:E- B4q:I- A4q:E- A4q:I-', 'G4w:O!'] },
    { id:'merry-christmas', title:'We Wish You a Merry Christmas', level:3, time:[3, 4], bpm:116, pickup:1, lines:[5, 4], christmas:true,
      about:'A traditional English carol. It starts with one note before the first bar.', bars:[
      'G4q:We',
      'C5q:wish C5e:you D5e:a C5e:mer- B4e:ry', 'A4q:Christ- A4q:mas, A4q:we', 'D5q:wish D5e:you E5e:a D5e:mer- C5e:ry', 'B4q:Christ- G4q:mas, G4q:we',
      'E5q:wish E5e:you F5e:a E5e:mer- D5e:ry', 'C5q:Christ- A4q:mas G4e:and G4e:a', 'A4q:hap- D5q:py B4q:new', 'C5h.:year!'] }
  ];
  const LEVELS = { 1:'⭐ First songs', 2:'⭐⭐ Next songs', 3:'⭐⭐⭐ Bigger songs' };
  function parseBar(txt){
    return txt.trim().split(/\s+/).map(tok => {
      const m = /^([A-G]#?\d)(w|h\.|h|q\.|q|e)(?::(.+))?$/.exec(tok);
      if(!m) throw new Error('Bad note: ' + tok);
      return { n:m[1], m:midiOf(m[1]), b:DUR[m[2]], d:m[2], w:m[3] || '' };
    });
  }
  function compile(s){
    const notes = [], barBeats = [];
    let beat = 0, li = 0, inLine = 0;
    s.barLen = s.time[0] * 4 / s.time[1];
    s.bars.forEach((txt, bi) => {
      let bb = 0;
      parseBar(txt).forEach(n => { n.bar = bi; n.line = li; n.at = beat; n.i = notes.length; notes.push(n); beat += n.b; bb += n.b; });
      barBeats.push(bb);
      if(++inLine >= s.lines[li]){ li++; inLine = 0; }
    });
    s.notes = notes; s.barBeats = barBeats; s.total = beat;
    s.lo = Math.min(...notes.map(n => n.m)); s.hi = Math.max(...notes.map(n => n.m));
    s.uses = [...new Set(notes.slice().sort((a, b) => a.m - b.m).map(n => n.n.replace(/\d/, '')))];
    return s;
  }
  SONGS.forEach(compile);

  /* ---------- the Music flightpath ----------
     Like the other flightpaths: stages of small steps, each with I do (👂), we do (💡) and you do (⭐).
     It starts with getting to know the keyboard, then builds each song up a part at a time.
     Step kinds: find (find keys), tune (a short practice tune), part (part of a song), song (the whole song). */
  const SETS = {
    low:[60, 61, 62, 63, 64], high:[76, 77, 78, 79, 80, 81, 82, 83, 84],
    two:[49, 51, 61, 63, 73, 75, 85, 87], three:[54, 56, 58, 66, 68, 70, 78, 80, 82, 90, 92, 94]
  };
  const OAK = (unit, title, year, lessons, sec) => ({ url:`https://www.thenational.academy/teachers/curriculum/music-${sec ? 'secondary' : 'primary'}/units/${unit}`, title, year, lessons:(lessons || []).map(([slug, t]) => ({ url:`https://www.thenational.academy/teachers/lessons/${slug}`, t })) });
  const PATH = [
    { id:'keys', title:'Meet the keyboard', icon:'🎹', about:'Low and high, the black keys, and where to find C.',
      oak:OAK('compose-and-create-exploring-pitch-through-call-and-response', 'Compose and create: high and low melodic responses', 'Year 1', [['identifying-high-and-low-notes', 'Identifying high and low notes']]),
      steps:[
        { id:'low-high', kind:'find', name:'Low and high', goal:'I can play a low note and a high note', tell:'Keys on the left sound low, like a bear. Keys on the right sound high, like a bird.', targets:[{ label:'a low note 🐻', set:'low' }, { label:'a high note 🐦', set:'high' }] },
        { id:'twos-threes', kind:'find', name:'Twos and threes', goal:'I can find the black keys in twos and in threes', tell:'The black keys come in little groups: two together, then three together.', targets:[{ label:'a black key in a group of two', set:'two' }, { label:'a black key in a group of three', set:'three' }] },
        { id:'middle-c', kind:'find', name:'Find middle C', goal:'I can find middle C', tell:'Middle C is the white key just to the left of the two black keys in the middle. It has a ★ on it.', targets:[{ label:'middle C ★', m:[60] }], show:['C4'] },
        { id:'all-cs', kind:'find', name:'Every C', goal:'I can find every C', tell:'Every C sits just to the left of a group of two black keys. Find them all, in any order.', targets:'all-c', any:true, show:['C4', 'C5'] }
      ] },
    { id:'cde', title:'C, D and E', icon:'🎵', about:'Three notes side by side, and your first song.',
      oak:OAK('music-and-movement-using-symbols-to-represent-pitch', 'Music and movement: using symbols to represent pitch', 'Year 2', [['notating-high-and-low-notes-on-a-simplified-musical-stave', 'High and low notes on a stave'], ['notating-three-notes-on-a-simplified-musical-stave', 'Three notes on a stave']]),
      steps:[
        { id:'find-de', kind:'find', name:'Find D and E', goal:'I can find D and E', tell:'D is in the middle of the two black keys. E is just to the right of them.', targets:[{ label:'D', m:[62] }, { label:'E', m:[64] }], show:['D4', 'E4'] },
        { id:'tune-cde', kind:'tune', name:'Up and down: C D E', goal:'I can play C D E, and back down', bars:['C4q D4q E4h', 'E4q D4q C4h'], lines:[2] },
        { id:'hcb-1', kind:'part', name:'Hot Cross Buns: part 1', goal:'I can play “Hot cross buns”', song:'hot-cross-buns', bars:[0, 2] },
        { id:'hcb', kind:'song', name:'Hot Cross Buns: the whole song', goal:'I can play Hot Cross Buns', song:'hot-cross-buns' }
      ] },
    { id:'five', title:'Five notes: C to G', icon:'🖐️', about:'One finger for each note, from C up to G.',
      oak:OAK('compose-and-create-composing-a-major-melody-on-a-stave', 'Compose and create: composing a major melody on a stave', 'Year 4', [['major-melodies-and-the-major-pentachord', 'Major melodies and the five-note pentachord'], ['reading-the-five-note-major-pentachord-scale', 'Reading the five-note scale']]),
      steps:[
        { id:'find-fg', kind:'find', name:'Find F and G', goal:'I can find F and G', tell:'F is just to the left of the three black keys. G is next to F.', targets:[{ label:'F', m:[65] }, { label:'G', m:[67] }], show:['F4', 'G4'] },
        { id:'tune-walk', kind:'tune', name:'Walk up and down', goal:'I can walk from C up to G and back', bars:['C4q D4q E4q F4q', 'G4w', 'G4q F4q E4q D4q', 'C4w'], lines:[2, 2] },
        { id:'mary-1', kind:'part', name:'Mary Had a Little Lamb: part 1', goal:'I can play the first part of Mary Had a Little Lamb', song:'mary-lamb', bars:[0, 4] },
        { id:'mary', kind:'song', name:'Mary Had a Little Lamb: the whole song', goal:'I can play Mary Had a Little Lamb', song:'mary-lamb' },
        { id:'ode-1', kind:'part', name:'Ode to Joy: part 1', goal:'I can play the first part of Ode to Joy', song:'ode-to-joy', bars:[0, 4] },
        { id:'ode', kind:'song', name:'Ode to Joy: the whole tune', goal:'I can play Ode to Joy', song:'ode-to-joy',
          oak:OAK('keyboard-fundamentals', 'Keyboard fundamentals', 'Year 7', [['playing-the-melody-ode-to-joy', 'Playing the melody: Ode to Joy']], true) }
      ] },
    { id:'jingle', title:'Jingle Bells', icon:'🎄', about:'The chorus, a part at a time. All five notes from C to G.',
      oak:OAK('compose-and-create-composing-a-major-melody-on-a-stave', 'Compose and create: composing a major melody on a stave', 'Year 4', [['reading-and-playing-major-melodies', 'Reading and playing major melodies']]),
      steps:[
        { id:'jb-1', kind:'part', name:'Jingle Bells: “Jingle bells… all the way”', goal:'I can play the first part of Jingle Bells', song:'jingle-bells', bars:[0, 4] },
        { id:'jb-2', kind:'part', name:'Jingle Bells: “Oh what fun…”', goal:'I can play the second part of Jingle Bells', song:'jingle-bells', bars:[4, 8] },
        { id:'jb', kind:'song', name:'Jingle Bells: the whole chorus', goal:'I can play the Jingle Bells chorus', song:'jingle-bells' }
      ] },
    { id:'twinkle', title:'Twinkle Twinkle', icon:'⭐', about:'A new note, A, and a big jump from C to G.',
      oak:OAK('keyboard-fundamentals', 'Keyboard fundamentals', 'Year 7', [['playing-a-melody-in-the-c-position-on-the-keyboard', 'Playing a melody in the C position']], true),
      steps:[
        { id:'find-a', kind:'find', name:'Find A', goal:'I can find A', tell:'A is inside the group of three black keys, between the second and third black key.', targets:[{ label:'A', m:[69] }], show:['A4'] },
        { id:'tune-jump', kind:'tune', name:'Jump and step', goal:'I can jump from C to G, then step up to A', bars:['C4h G4h', 'C4h G4h', 'G4q A4q G4h'], lines:[3] },
        { id:'tw-1', kind:'part', name:'Twinkle: “Twinkle twinkle little star”', goal:'I can play “Twinkle twinkle little star”', song:'twinkle', bars:[0, 2] },
        { id:'tw-2', kind:'part', name:'Twinkle: “How I wonder what you are”', goal:'I can play “How I wonder what you are”', song:'twinkle', bars:[2, 4] },
        { id:'tw-3', kind:'part', name:'Twinkle: “Up above the world so high…”', goal:'I can play the middle part of Twinkle Twinkle', song:'twinkle', bars:[4, 8] },
        { id:'tw', kind:'song', name:'Twinkle Twinkle: the whole song', goal:'I can play Twinkle Twinkle Little Star', song:'twinkle' }
      ] },
    { id:'higher', title:'Higher notes', icon:'🪜', about:'B and high C, then songs that climb higher.',
      oak:OAK('keyboard-fundamentals', 'Keyboard fundamentals', 'Year 7', [['playing-a-melody-in-the-c-position-on-the-keyboard', 'Playing a melody in the C position']], true),
      steps:[
        { id:'london', kind:'song', name:'London Bridge', goal:'I can play London Bridge', song:'london-bridge' },
        { id:'find-bc', kind:'find', name:'Find B and high C', goal:'I can find B and high C', tell:'B is just to the right of the three black keys. High C is next to B, just to the left of the next two black keys.', targets:[{ label:'B', m:[71] }, { label:'high C', m:[72] }], show:['B4', 'C5'] },
        { id:'row-1', kind:'part', name:'Row Your Boat: part 1', goal:'I can play “Row, row, row your boat, gently down the stream”', song:'row-your-boat', bars:[0, 4] },
        { id:'row', kind:'song', name:'Row, Row, Row Your Boat: the whole song', goal:'I can play Row, Row, Row Your Boat', song:'row-your-boat' },
        { id:'ays-1', kind:'part', name:'Are You Sleeping?: part 1', goal:'I can play “Are you sleeping, Brother John?”', song:'are-you-sleeping', bars:[0, 4] },
        { id:'ays', kind:'song', name:'Are You Sleeping?: the whole song', goal:'I can play Are You Sleeping?', song:'are-you-sleeping' }
      ] },
    { id:'bigger', title:'Bigger songs', icon:'🎉', about:'Old MacDonald, then a Christmas carol that goes up to high F.',
      oak:OAK('compose-and-create-composing-a-major-melody-on-a-stave', 'Compose and create: composing a major melody on a stave', 'Year 4', [['reading-and-performing-major-melodies', 'Reading and performing major melodies']]),
      steps:[
        { id:'oldmac', kind:'song', name:'Old MacDonald Had a Farm', goal:'I can play Old MacDonald', song:'old-macdonald' },
        { id:'find-top', kind:'find', name:'High D, E and F', goal:'I can find high D, E and F', tell:'Go up from high C: D is between the next two black keys, then E, then F just before the next three black keys.', targets:[{ label:'high D', m:[74] }, { label:'high E', m:[76] }, { label:'high F', m:[77] }], show:['D5', 'E5', 'F5'] },
        { id:'ww-1', kind:'part', name:'We Wish You a Merry Christmas: part 1', goal:'I can play the first part of We Wish You a Merry Christmas', song:'merry-christmas', bars:[0, 5] },
        { id:'ww', kind:'song', name:'We Wish You a Merry Christmas: the whole song', goal:'I can play We Wish You a Merry Christmas', song:'merry-christmas' }
      ] }
  ];
  const STEPS = []; PATH.forEach(st => st.steps.forEach(x => { x.stage = st.id; x.n = STEPS.length + 1; STEPS.push(x); }));
  /* a step that plays: a short practice tune, part of a song, or the whole song */
  function stepSong(x){
    if(x.kind === 'song') return SONGS.find(s => s.id === x.song);
    if(x.kind === 'tune') return compile({ id:'step-' + x.id, title:x.name, time:[4, 4], bpm:92, lines:x.lines, bars:x.bars, noWords:true });
    const base = SONGS.find(s => s.id === x.song), [a, b] = x.bars, lines = []; let at = 0;
    base.lines.forEach(n => { const lo = Math.max(at, a), hi = Math.min(at + n, b); if(hi > lo) lines.push(hi - lo); at += n; });
    return compile({ id:'step-' + x.id, title:base.title, time:base.time, bpm:base.bpm, pickup:a === 0 ? base.pickup : 0, lines, bars:base.bars.slice(a, b), noWords:base.noWords, part:true });
  }
  function stepTargets(x){
    if(x.targets === 'all-c') return K.whites.filter(m => m % 12 === 0).map(m => ({ label:{ 48:'low C', 60:'middle C ★', 72:'high C', 84:'top C' }[m] || nameOf(m), m:[m] }));
    return x.targets.map(t => ({ label:t.label, m:t.m || SETS[t.set] }));
  }
  function stepProg(id){ const p = prog(); return (p.steps && p.steps[id]) || {}; }
  function stepStars(id){ const s = stepProg(id); return (s.listen ? 1 : 0) + (s.follow ? 1 : 0) + (s.own ? 1 : 0); }
  function suggested(){ return STEPS.find(x => !stepProg(x.id).own) || STEPS[STEPS.length - 1]; }
  /* used by the tests: every step plays, every part fits its song, find steps only ask for keys on the keyboard */
  function checkPath(){
    const out = [], ids = new Set();
    STEPS.forEach(x => {
      if(ids.has(x.id)) out.push('two steps called ' + x.id); ids.add(x.id);
      if(!x.goal || !/^I can /.test(x.goal)) out.push(x.id + ': goal should start “I can”');
      if(x.kind === 'find'){ if(x.targets !== 'all-c' && !x.targets.every(t => (t.m && t.m.length) || SETS[t.set])) out.push(x.id + ': bad target'); return; }
      const so = stepSong(x); if(!so || !so.notes.length){ out.push(x.id + ': no notes'); return; }
      if(so.lo < 60 || so.hi > 77) out.push(x.id + ': notes outside C4 to F5');
      if(x.kind === 'part'){ const base = SONGS.find(s => s.id === x.song); if(x.bars[1] > base.bars.length) out.push(x.id + ': part goes past the end'); if(so.lines.reduce((p, q) => p + q, 0) !== so.bars.length) out.push(x.id + ': lines do not cover the part'); }
    });
    return out;
  }
  /* used by the tests: every bar adds up, lines cover every bar, the range fits the keyboard and there are no black keys */
  function checkSongs(){
    const out = [];
    SONGS.forEach(s => {
      s.barBeats.forEach((b, i) => {
        const first = i === 0 && s.pickup, last = i === s.barBeats.length - 1;
        const ok = Math.abs(b - s.barLen) < 1e-9 || (first && Math.abs(b - s.pickup) < 1e-9) || (last && s.pickup && Math.abs(b - (s.barLen - s.pickup)) < 1e-9);
        if(!ok) out.push(`${s.id} bar ${i + 1} has ${b} beats, not ${s.barLen}`);
      });
      if(s.lines.reduce((a, b) => a + b, 0) !== s.bars.length) out.push(`${s.id}: lines cover ${s.lines.reduce((a, b) => a + b, 0)} of ${s.bars.length} bars`);
      if(s.lo < midiOf('C4') || s.hi > midiOf('F5')) out.push(`${s.id}: notes go outside C4 to F5`);
      if(s.notes.some(n => sharp(n.m))) out.push(`${s.id}: uses a black key`);
      if(!s.noWords && s.notes.some(n => !n.w)) out.push(`${s.id}: a note has no word`);
    });
    return out;
  }

  /* ---------- sound ---------- */
  const A = { ctx:null, out:null, inst:'piano' };
  const INST = { piano:{ n:'Piano', ic:'🎹' }, box:{ n:'Music box', ic:'🎶' }, organ:{ n:'Organ', ic:'🎵' } };
  function audio(){
    if(!A.ctx){
      const C = window.AudioContext || window.webkitAudioContext; if(!C) return null;
      try{ A.ctx = new C({ latencyHint:'interactive' }); }catch(e){ A.ctx = new C(); }
      A.out = makeOut(A.ctx, A.ctx.destination);
    }
    if(A.ctx.state === 'suspended'){ try{ A.ctx.resume(); }catch(e){} }
    return A.ctx;
  }
  function makeOut(ctx, dest){
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3;
    const g = ctx.createGain(); g.gain.value = .85; g.connect(comp); comp.connect(dest); return g;
  }
  /* One note. Gives back stop(time). With a length it stops by itself. */
  function voice(ctx, dest, m, t, inst, vel, dur){
    const f = hz(m), g = ctx.createGain(), oscs = [];
    let into = dest, release = .25;
    if(inst === 'piano'){
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .4;
      lp.frequency.setValueAtTime(Math.min(9000, f * 10), t); lp.frequency.setTargetAtTime(Math.min(4200, f * 3.2), t, .3);
      lp.connect(dest); into = lp;
    }
    g.connect(into);
    const add = (type, mult, gain, det) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mult; if(det) o.detune.value = det; const og = ctx.createGain(); og.gain.value = gain; o.connect(og); og.connect(g); oscs.push(o); };
    g.gain.setValueAtTime(0, t);
    if(inst === 'box'){
      add('sine', 1, .8); add('sine', 2, .08); add('sine', 4, .12);
      g.gain.linearRampToValueAtTime(.55 * vel, t + .004); g.gain.setTargetAtTime(0, t + .01, .38); release = .3;
    } else if(inst === 'organ'){
      add('sine', 1, .6); add('sine', 2, .3); add('sine', 3, .14); add('sine', 4, .06);
      g.gain.linearRampToValueAtTime(.34 * vel, t + .025); release = .1;
    } else {
      add('triangle', 1, .75); add('sine', 2, .22, 3); add('sine', 3, .07);
      g.gain.linearRampToValueAtTime(.62 * vel, t + .006); g.gain.setTargetAtTime(.24 * vel, t + .012, .16); g.gain.setTargetAtTime(0, t + .45, 1.5);
    }
    const end = t + (dur ? dur + release * 3 : 7);
    oscs.forEach(o => { o.start(t); o.stop(end); });
    let stopAt = Infinity;
    const stop = at => {
      if(at <= t){ stopAt = at; oscs.forEach(o => { try{ o.stop(at); }catch(e){} }); try{ g.gain.cancelScheduledValues(0); g.gain.value = 0; }catch(e){} return; } // never started: stay silent
      const s = Math.max(at, t + .03);
      if(s >= stopAt - 1e-6) return; stopAt = s;
      try{ if(g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(s); else g.gain.cancelScheduledValues(s); g.gain.setTargetAtTime(0, s, release / 3); }catch(e){}
      oscs.forEach(o => { try{ o.stop(s + release * 3); }catch(e){} });
    };
    if(dur) stop(t + dur);
    return stop;
  }

  /* ---------- state ---------- */
  const M = {
    el:null, song:null, step:null, find:null, mode:'free', pos:0, miss:0, helps:0, slow:false, firstOpen:true,
    opt:{ names:true, colours:true, words:true }, oct:0, free:[], listen:null, lastLine:-1,
    rec:null, play:null, panel:null
  };
  const held = new Map(); // midi -> stop
  const P = new Map();    // pointer -> midi
  const K = { start:60, whites:[], keys:[] };

  /* progress per pupil code: stars for listening, following the lights and playing it on your own */
  const PKEY = () => 'fab-music-v1-' + who();
  function prog(){ try{ return JSON.parse(localStorage.getItem(PKEY()) || '{}') || {}; }catch(e){ return {}; } }
  function saveProg(p){ try{ localStorage.setItem(PKEY(), JSON.stringify(p)); }catch(e){} }
  function songProg(id){ const p = prog(); return (p.songs && p.songs[id]) || {}; }
  function starsOf(id){ const s = songProg(id); return (s.listen ? 1 : 0) + (s.follow ? 1 : 0) + (s.own ? 1 : 0); }
  try{ const o = JSON.parse(localStorage.getItem('fab-music-opts') || 'null'); if(o){ Object.assign(M.opt, o.opt || {}); if(INST[o.inst]) A.inst = o.inst; } }catch(e){}
  const saveOpts = () => { try{ localStorage.setItem('fab-music-opts', JSON.stringify({ opt:M.opt, inst:A.inst })); }catch(e){} };

  /* ---------- the screen ---------- */
  const $m = s => M.el && M.el.querySelector(s);
  const isOn = () => { const s = document.getElementById('screen-music'); return !!(s && s.classList.contains('active')); };
  function build(){
    const el = document.getElementById('screen-music'); if(!el || M.el) return;
    M.el = el;
    el.innerHTML = `<div class="mu-top">
        <div class="mu-grp mu-nav">
          <button type="button" class="mu-btn back" id="muBack" aria-label="Back">←<span class="mu-lbl"> Back</span></button>
          <button type="button" class="mu-btn" id="muSongsBtn" aria-label="Music steps">🗺️<span class="mu-lbl"> Steps</span></button>
          <h1 class="mu-title" id="muTitle">Free play</h1>
        </div>
        <i class="mu-break" aria-hidden="true"></i>
        <div class="mu-grp mu-modes" role="group" aria-label="How to play">
          <button type="button" class="mu-btn mode" data-mode="listen" aria-label="Listen" aria-pressed="false">👂<span class="mu-lbl"> Listen</span></button>
          <button type="button" class="mu-btn mode" data-mode="follow" aria-label="Follow the lights" aria-pressed="false">💡<span class="mu-lbl"> Follow<span class="mu-long"> the lights</span></span></button>
          <button type="button" class="mu-btn mode" data-mode="own" aria-label="Your turn" aria-pressed="false">⭐<span class="mu-lbl"> Your turn</span></button>
        </div>
        <p class="mu-msg" id="muToast" aria-live="polite"></p>
        <div class="mu-grp mu-acts">
          <button type="button" class="mu-btn go" id="muPlay" aria-label="Play">▶<span class="mu-lbl"> Play</span></button>
          <button type="button" class="mu-btn" id="muHelp" aria-label="Fab helps: play the next note for me">🤲<span class="mu-lbl"> Fab helps</span></button>
          <button type="button" class="mu-btn" id="muSlow" aria-label="Slow" aria-pressed="false">🐢<span class="mu-lbl mu-long"> Slow</span></button>
          <button type="button" class="mu-btn" id="muAgain" aria-label="Start again">↺<span class="mu-lbl mu-long"> Start again</span></button>
          <button type="button" class="mu-btn" id="muClear" aria-label="Clear my notes">🧹<span class="mu-lbl"> Clear</span></button>
        </div>
        <div class="mu-grp mu-keep">
          <button type="button" class="mu-btn" id="muInst" aria-label="Sound: Piano">🎹<span class="mu-lbl mu-long"> Piano</span></button>
          <button type="button" class="mu-btn rec" id="muRec" aria-label="Record" aria-pressed="false">⏺<span class="mu-lbl"> Record</span></button>
          <button type="button" class="mu-btn" id="muMineBtn" aria-label="My music">💾<span class="mu-lbl"> My music</span></button>
        </div>
      </div>
      <div class="mu-mid">
        <div class="mu-sheet" id="muSheet"></div>
        <div class="mu-show" role="group" aria-label="What the music shows">
          <button type="button" class="mu-tog" data-opt="names" aria-label="Note names" aria-pressed="true"><b aria-hidden="true">ABC</b><span class="mu-lbl"> Names</span></button>
          <button type="button" class="mu-tog" data-opt="colours" aria-label="Colours" aria-pressed="true"><b aria-hidden="true">🌈</b><span class="mu-lbl"> Colours</span></button>
          <button type="button" class="mu-tog" data-opt="words" aria-label="Words" aria-pressed="true"><b aria-hidden="true">📝</b><span class="mu-lbl"> Words</span></button>
        </div>
      </div>
      <div class="mu-kbrow">
        <button type="button" class="mu-oct" id="muOctDown" aria-label="Lower notes">◀</button>
        <div class="mu-kb" id="muKb" role="group" aria-label="Keyboard. Play with the mouse, touch, or the computer keys A to ;"></div>
        <button type="button" class="mu-oct" id="muOctUp" aria-label="Higher notes">▶</button>
      </div>
      <div class="mu-panel" id="muPanel" hidden></div>`;
    $m('#muBack').addEventListener('click', leave);
    $m('#muSongsBtn').addEventListener('click', () => openPanel('path'));
    $m('#muMineBtn').addEventListener('click', () => openPanel('mine'));
    el.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $m('#muPlay').addEventListener('click', () => { if(M.find){ if(M.show){ stopShow(); paintAll(); } else findShow(); return; } if(M.listen) stopListen(true); else listenPlay(); });
    $m('#muHelp').addEventListener('click', fabHelps);
    $m('#muSlow').addEventListener('click', () => { M.slow = !M.slow; paintBar(); if(M.listen){ stopListen(true); listenPlay(); } });
    $m('#muAgain').addEventListener('click', () => { if(M.find){ setMode(M.mode); return; } stopListen(true); M.pos = 0; M.miss = 0; M.helps = 0; M.lastLine = 0; paintAll(); toast(''); });
    $m('#muClear').addEventListener('click', () => { M.free = []; renderSheet(); });
    $m('#muInst').addEventListener('click', () => { const ks = Object.keys(INST); A.inst = ks[(ks.indexOf(A.inst) + 1) % ks.length]; saveOpts(); paintBar(); const c = audio(); if(c) voice(c, A.out, 67, c.currentTime + .01, A.inst, .7, .4); });
    $m('#muRec').addEventListener('click', () => { if(M.rec) stopRec(); else openPanel('record'); });
    el.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { M.opt[b.dataset.opt] = !M.opt[b.dataset.opt]; saveOpts(); paintAll(); }));
    $m('#muOctDown').addEventListener('click', () => { M.oct = Math.max(-2, M.oct - 1); buildKb(); });
    $m('#muOctUp').addEventListener('click', () => { M.oct = Math.min(2, M.oct + 1); buildKb(); });
    const kb = $m('#muKb');
    kb.addEventListener('pointerdown', kbDown);
    kb.addEventListener('pointermove', kbMove);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => kb.addEventListener(t, kbUp));
    kb.addEventListener('click', e => { const k = e.target.closest('[data-m]'); if(k && e.detail === 0){ const m = +k.dataset.m; noteOn(m); setTimeout(() => noteOff(m), 350); } });
    kb.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', () => { if(isOn()){ buildKb(); renderSheet(); } });
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { [...held.keys()].forEach(noteOff); });
    document.addEventListener('visibilitychange', () => { if(document.hidden){ [...held.keys()].forEach(noteOff); stopListen(true); stopPlayback(); } });
    M.el.querySelector('#muPanel').addEventListener('click', panelClick);
  }
  function open(songId, how){
    M.backTo = (how && how.back) || null;
    build();
    if(typeof showScreen === 'function') showScreen('screen-music');
    if(songId) loadSong(songId); else if(!M.song && !M.step) loadSong(null);
    requestAnimationFrame(() => { buildKb(); paintAll(); if(M.firstOpen && !songId){ M.firstOpen = false; openPanel('path'); } });
  }
  function leave(){
    stopListen(true); stopShow(); stopPlayback(); if(M.rec) stopRec();
    [...held.keys()].forEach(noteOff); closePanel();
    if(M.backTo){
      const b = M.backTo; M.backTo = null;
      if(typeof showScreen === 'function') showScreen(b);
      try{ const wf = document.querySelector('iframe[data-game="world"]'); wf && wf.contentWindow && wf.contentWindow.postMessage('fabworld-wake', '*'); }catch(e){}
      return;
    }
    if(typeof showScreen === 'function') showScreen('screen-learn');
    try{ learnRenderList(); }catch(e){}
  }
  function loadStep(id){
    const x = STEPS.find(q => q.id === id); if(!x) return;
    stopListen(true); stopShow(); if(M.panel) closePanel();
    M.step = x; M.oct = 0;
    if(x.kind === 'find'){ M.song = null; M.find = { idx:0, found:[], targets:[] }; }
    else { M.find = null; M.song = stepSong(x); }
    M.mode = 'listen'; M.pos = 0; M.miss = 0; M.helps = 0; M.lastLine = 0; M.clue = null; M.lit = null;
    if(M.el){ buildKb(); }
    if(M.find) M.find.targets = stepTargets(x);
    toast(`${x.goal}. ${x.kind === 'find' ? 'Tap 👂 Show me first.' : 'Tap ▶ Play to hear it first.'}`);
    if(M.el) paintAll();
  }
  function loadSong(id){
    stopListen(true); stopShow(); if(M.panel && M.panel !== 'cele') closePanel();
    M.step = null; M.find = null;
    M.song = id ? SONGS.find(s => s.id === id) || null : null;
    M.mode = M.song ? 'listen' : 'free'; M.pos = 0; M.miss = 0; M.helps = 0; M.lastLine = 0; M.oct = 0;
    if(M.song) toast('Tap ▶ Play to hear it first. Then try 💡 Follow the lights.'); else toast('Free play: play anything you like. Your notes appear on the music.');
    if(M.el){ buildKb(); paintAll(); }
  }
  function setMode(mode){
    if(M.find){
      stopShow(); M.mode = mode; M.find.idx = 0; M.find.found = []; M.miss = 0; M.clue = null; M.lit = null;
      toast(mode === 'listen' ? 'Watch and listen: Fab shows you where the keys are.' : mode === 'follow' ? 'Press the keys that are glowing.' : 'Your turn! Find them yourself. A clue comes if you want one.');
      paintAll(); if(mode === 'listen') findShow(); return;
    }
    if(!M.song) return;
    stopListen(true);
    M.mode = mode; M.pos = 0; M.miss = 0; M.helps = 0; M.lastLine = 0;
    toast(mode === 'listen' ? 'Tap ▶ Play and listen. Watch the notes light up.' : mode === 'follow' ? 'Press the key that is glowing. Take your time.' : 'Your turn! Read the music and play. 🤲 Fab helps if you want a hand.');
    paintAll();
    if(mode === 'listen') listenPlay();
  }
  function paintAll(){ paintBar(); paintKeys(); renderSheet(); }
  function paintBar(){
    if(!M.el) return;
    const song = M.song || (M.find ? { noWords:true, find:true } : null);
    $m('#muTitle').textContent = M.step ? `Step ${M.step.n}: ${M.step.name}` : M.song ? M.song.title : 'Free play';
    M.el.classList.toggle('mu-free', !song);
    const lb = M.el.querySelector('[data-mode="listen"]'); lb.innerHTML = M.find ? '👂<span class="mu-lbl"> Show me</span>' : '👂<span class="mu-lbl"> Listen</span>'; lb.setAttribute('aria-label', M.find ? 'Show me' : 'Listen');
    M.el.querySelectorAll('[data-mode]').forEach(b => { const on = b.dataset.mode === M.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    const play = $m('#muPlay');
    play.hidden = !song || M.mode !== 'listen';
    const busy = M.listen || M.show;
    play.innerHTML = busy ? '⏹<span class="mu-lbl"> Stop</span>' : (M.find ? '▶<span class="mu-lbl"> Show me</span>' : '▶<span class="mu-lbl"> Play</span>'); play.setAttribute('aria-label', busy ? 'Stop' : M.find ? 'Show me' : 'Play');
    $m('#muHelp').hidden = !song || M.mode === 'listen';
    $m('#muSlow').hidden = !M.song || M.mode !== 'listen';
    $m('#muSlow').setAttribute('aria-pressed', M.slow ? 'true' : 'false'); $m('#muSlow').classList.toggle('on', M.slow);
    $m('#muAgain').hidden = !song || M.mode === 'listen';
    $m('#muClear').hidden = !!song;
    const ins = INST[A.inst];
    $m('#muInst').innerHTML = `${ins.ic}<span class="mu-lbl mu-long"> ${ins.n}</span>`; $m('#muInst').setAttribute('aria-label', 'Sound: ' + ins.n);
    M.el.querySelectorAll('[data-opt]').forEach(b => { const on = !!M.opt[b.dataset.opt]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    const w = M.el.querySelector('[data-opt="words"]'); w.hidden = !song || !!song.noWords;
    $m('#muOctDown').hidden = $m('#muOctUp').hidden = !!song;
    const r = $m('#muRec');
    r.classList.toggle('on', !!M.rec); r.setAttribute('aria-pressed', M.rec ? 'true' : 'false');
    if(!M.rec){ r.innerHTML = '⏺<span class="mu-lbl"> Record</span>'; r.setAttribute('aria-label', 'Record'); }
  }
  let toastT = 0;
  function toast(t, keep){ const el = $m('#muToast'); if(!el) return; el.textContent = t || ''; el.classList.toggle('show', !!t); clearTimeout(toastT); if(t && !keep) toastT = setTimeout(() => { el.classList.remove('show'); }, 6500); }

  /* ---------- keyboard ---------- */
  function buildKb(){
    const kb = $m('#muKb'); if(!kb) return;
    const w = kb.clientWidth || 600;
    let n = clamp(Math.floor(w / 56), 8, 15);
    let start = 60 + 12 * M.oct;
    if(M.song || M.find){ start = 60; n = Math.max(n, 11); }
    const whites = []; let m = start;
    while(whites.length < n){ if(!sharp(m)) whites.push(m); m++; }
    const keys = []; const ww = 100 / n, bw = ww * .62;
    whites.forEach((wm, i) => {
      keys.push(`<button type="button" class="mu-key white" data-m="${wm}" style="left:${(i * ww).toFixed(3)}%;width:${ww.toFixed(3)}%" aria-label="${nameOf(wm).replace(/(\d)/, ' $1')}${wm === 60 ? ', middle C' : ''}">${wm === 60 ? '<i class="mu-mid-c" aria-hidden="true">★</i>' : ''}<span class="mu-kn" aria-hidden="true">${letterOf(wm)}</span></button>`);
      if(i < n - 1 && sharp(wm + 1)){
        const bm = wm + 1;
        keys.push(`<button type="button" class="mu-key black" data-m="${bm}" style="left:${((i + 1) * ww).toFixed(3)}%;width:${bw.toFixed(3)}%" aria-label="${NAMES[bm % 12].replace('#', ' sharp')} ${Math.floor(bm / 12) - 1}"></button>`);
      }
    });
    kb.innerHTML = keys.join('');
    K.start = start; K.whites = whites;
    paintKeys();
  }
  function paintKeys(){
    if(!M.el) return;
    const kb = $m('#muKb'); if(!kb) return;
    kb.classList.toggle('names', !!M.opt.names); kb.classList.toggle('colours', !!M.opt.colours);
    kb.querySelectorAll('.mu-key.white').forEach(k => { const L = letterOf(+k.dataset.m); k.style.setProperty('--c', COL[L]); k.style.setProperty('--ci', COL_INK[L]); });
    const next = M.song && M.mode === 'follow' && !M.listen && M.pos < M.song.notes.length ? M.song.notes[M.pos].m : null;
    const clue = M.clue != null ? M.clue : null;
    const glow = new Set(), found = new Set();
    if(M.find){
      M.find.found.forEach(m => found.add(m));
      if(M.mode === 'follow' && !M.show) findLeft().forEach(t => t.m.forEach(m => glow.add(m)));
      if(Array.isArray(clue)) clue.forEach(m => glow.add(m));
    }
    kb.querySelectorAll('.mu-key').forEach(k => { const m = +k.dataset.m; k.classList.toggle('next', m === next || m === clue || glow.has(m)); k.classList.toggle('found', found.has(m)); k.classList.toggle('down', held.has(m) || m === M.lit); });
  }
  function keyEl(m){ return $m(`#muKb [data-m="${m}"]`); }
  function kbDown(e){
    const k = e.target.closest('[data-m]'); if(!k) return;
    e.preventDefault(); audio();
    try{ $m('#muKb').setPointerCapture(e.pointerId); }catch(_){}
    const m = +k.dataset.m; P.set(e.pointerId, m); noteOn(m);
  }
  function kbMove(e){
    if(!P.has(e.pointerId)) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), k = el && el.closest ? el.closest('.mu-kb [data-m]') : null;
    const m = k ? +k.dataset.m : null, cur = P.get(e.pointerId);
    if(m !== cur){ if(cur != null) noteOff(cur); if(m != null) noteOn(m); P.set(e.pointerId, m); }
  }
  function kbUp(e){ if(!P.has(e.pointerId)) return; const cur = P.get(e.pointerId); P.delete(e.pointerId); if(cur != null) noteOff(cur); }
  const KEYMAP = "awsedftgyhujkolp;'";
  const kbKeys = new Map();
  function typing(e){ const t = e.target; return t && (/input|textarea|select/i.test(t.tagName) || t.isContentEditable); }
  function onKey(e){
    if(!isOn() || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === 'Escape' && M.panel){ closePanel(); return; }
    if(M.panel) return;
    const i = KEYMAP.indexOf(e.key.toLowerCase()); if(i < 0) return;
    e.preventDefault(); if(e.repeat || kbKeys.has(e.key.toLowerCase())) return;
    const m = K.start + i; kbKeys.set(e.key.toLowerCase(), m); audio(); noteOn(m);
  }
  function onKeyUp(e){ const k = e.key.toLowerCase(); if(!kbKeys.has(k)) return; const m = kbKeys.get(k); kbKeys.delete(k); noteOff(m); }

  function noteOn(m){
    const ctx = audio(); if(!ctx) return;
    if(held.has(m)) held.get(m)(ctx.currentTime);
    held.set(m, voice(ctx, A.out, m, ctx.currentTime + .005, A.inst, .9));
    const k = keyEl(m); if(k) k.classList.add('down');
    recOn(m);
    played(m);
  }
  function noteOff(m){
    const s = held.get(m); if(s){ s(A.ctx ? A.ctx.currentTime : 0); held.delete(m); }
    const k = keyEl(m); if(k && m !== M.lit) k.classList.remove('down');
    recOff(m);
  }

  /* ---------- following a song ---------- */
  /* find steps: which targets are still to find (in order, or any order) */
  function findLeft(){
    const f = M.find; if(!f) return [];
    if(M.step.any) return f.targets.filter(t => !t.m.some(m => f.found.includes(m)));
    return f.idx < f.targets.length ? [f.targets[f.idx]] : [];
  }
  function findPlayed(m){
    const f = M.find; if(M.mode === 'listen' || M.show) return;
    const left = findLeft(); if(!left.length) return;
    const hit = left.find(t => t.m.includes(m));
    if(hit){
      f.found.push(m); f.idx++; M.miss = 0; M.clue = null;
      const done = !findLeft().length;
      toast(done ? '' : `Yes! That’s ${hit.label}. ${M.step.any ? `${findLeft().length} more to find.` : `Now find ${findLeft()[0].label}.`}`);
      paintKeys(); renderSheet();
      if(done) setTimeout(() => finish(M.mode), 500);
      return;
    }
    M.miss++;
    if(M.mode === 'own' && M.miss >= 3 && M.clue == null){ M.clue = left[0].m.slice(); paintKeys(); toast(`Here’s a clue: ${left[0].label} is glowing.`); }
  }
  /* 👂 Show me: Fab lights each key in turn and plays it */
  function findShow(){
    stopShow();
    const f = M.find; if(!f) return;
    const ctx = audio();
    const list = f.targets.map(t => { const on = t.m.find(m => keyEl(m)); return on != null ? on : t.m[0]; });
    M.show = { timers:[] }; f.found = []; paintBar();
    list.forEach((m, i) => {
      M.show.timers.push(setTimeout(() => {
        if(!M.show) return;
        M.lit = m; f.found.push(m); if(ctx) voice(ctx, A.out, m, ctx.currentTime + .01, A.inst, .85, .6);
        toast(`This is ${f.targets[i].label}.`); paintKeys(); renderSheet();
      }, 500 + i * 1100));
    });
    M.show.timers.push(setTimeout(() => { if(!M.show) return; M.show = null; M.lit = null; f.found = []; paintAll(); finish('listen'); }, 500 + list.length * 1100 + 400));
  }
  function stopShow(){ if(!M.show) return; M.show.timers.forEach(clearTimeout); M.show = null; M.lit = null; if(M.find) M.find.found = []; }
  function played(m){
    if(M.find){ findPlayed(m); return; }
    if(!M.song){ M.free.push(m); if(M.free.length > 24) M.free.shift(); renderSheet(); return; }
    if(M.listen || M.mode === 'listen' || M.pos >= M.song.notes.length) return;
    const want = M.song.notes[M.pos];
    if(m === want.m){ M.clue = null; advance(); return; }
    M.miss++;
    if(M.mode === 'own' && M.miss >= 3 && M.clue == null){ M.clue = want.m; paintKeys(); toast(`Here’s a clue: the next note is ${want.n[0]}.`); }
  }
  function advance(){
    const s = M.song, prev = s.notes[M.pos];
    M.pos++; M.miss = 0; M.clue = null;
    if(M.pos >= s.notes.length){ paintKeys(); renderSheet(); setTimeout(() => finish(M.mode), 450); return; }
    const nx = s.notes[M.pos];
    if(nx.line !== prev.line && nx.line !== M.lastLine){ M.lastLine = nx.line; toast(`Line ${prev.line + 1} done ✓ A good place for a rest, or keep going.`); }
    paintKeys(); renderSheet();
  }
  function fabHelps(){
    if(!M.song || M.mode === 'listen' || M.pos >= M.song.notes.length) return;
    const n = M.song.notes[M.pos]; M.helps++;
    const ctx = audio(); if(!ctx) return;
    voice(ctx, A.out, n.m, ctx.currentTime + .01, A.inst, .85, .45);
    M.lit = n.m; paintKeys(); setTimeout(() => { if(M.lit === n.m){ M.lit = null; paintKeys(); } }, 420);
    recOn(n.m, .45);
    advance();
  }
  function listenPlay(){
    if(!M.song) return;
    stopListen(false);
    const ctx = audio(); if(!ctx) return;
    const s = M.song, spb = 60 / (s.bpm * (M.slow ? .7 : 1)), t0 = ctx.currentTime + .3;
    M.listen = { t0, spb, stops:[], raf:0 };
    s.notes.forEach(n => M.listen.stops.push(voice(ctx, A.out, n.m, t0 + n.at * spb, A.inst, .8, n.b * spb * .9)));
    M.pos = 0; M.lit = null; paintBar();
    const tick = () => {
      if(!M.listen) return;
      const beat = (A.ctx.currentTime - M.listen.t0) / spb;
      const i = s.notes.findIndex(n => beat < n.at + n.b);
      if(i < 0){ M.listen = null; M.lit = null; M.pos = s.notes.length; paintAll(); finish('listen'); return; }
      const on = beat >= s.notes[i].at && beat < s.notes[i].at + s.notes[i].b * .9;
      const lit = beat >= 0 && on ? s.notes[i].m : null;
      if(i !== M.pos || lit !== M.lit){ M.pos = i; M.lit = lit; paintKeys(); renderSheet(); }
      M.listen.raf = requestAnimationFrame(tick);
    };
    M.listen.raf = requestAnimationFrame(tick);
  }
  function stopListen(paint){
    if(!M.listen) return;
    const now = A.ctx ? A.ctx.currentTime : 0;
    M.listen.stops.forEach(s => s(now)); cancelAnimationFrame(M.listen.raf);
    M.listen = null; M.lit = null; M.pos = 0;
    if(paint) paintAll();
  }

  /* ---------- finishing, rewards and certificates ---------- */
  function finish(mode){
    const x = M.step, s = M.song || (x ? { id:'step-' + x.id, title:x.name } : null); if(!s) return;
    const p = prog(); p.songs = p.songs || {}; p.steps = p.steps || {};
    const whole = !x || x.kind === 'song';
    let first = false;
    if(x){ const sp = p.steps[x.id] = p.steps[x.id] || {}; first = !sp[mode]; sp[mode] = (sp[mode] || 0) + 1; }
    if(whole){ const sp = p.songs[s.id] = p.songs[s.id] || {}; if(!x) first = !sp[mode]; else if(!sp[mode]) first = true; sp[mode] = (sp[mode] || 0) + 1; if(mode === 'own') sp.ownDate = new Date().toISOString().slice(0, 10); }
    saveProg(p);
    if(x && !whole) return finishStep(mode, first);
    const gift = [];
    if(mode === 'listen' && first){ award(1); gift.push('✨ 1 sparkle for Fab Fox World'); }
    if(mode === 'follow'){ award(2); gift.push('✨ 2 sparkles for Fab Fox World'); }
    if(mode === 'own'){ award(3); gift.push('✨ 3 sparkles for Fab Fox World'); if(first){ treasure('🔔'); gift.push('🔔 A Bluebell for your Treasure book. Collect 3 to make Bluebell chimes!'); } }
    try{ Sound && Sound.win && Sound.win(); }catch(e){}
    const st = x ? stepStars(x.id) : starsOf(s.id);
    const nx = x ? STEPS[STEPS.indexOf(x) + 1] : null;
    const head = mode === 'listen' ? 'That’s how it goes!' : mode === 'follow' ? 'You followed the lights all the way!' : 'You played it all by yourself!';
    const next = mode === 'listen' ? '<button type="button" class="mu-btn go" data-act="mode:follow">💡 Now follow the lights</button>'
      : mode === 'follow' ? '<button type="button" class="mu-btn go" data-act="mode:own">⭐ Try it on your own</button>'
      : '<button type="button" class="mu-btn go" data-act="cert">🏅 My certificate</button>' + (nx ? `<button type="button" class="mu-btn go" data-act="step:${nx.id}">➡️ Next step: ${esc(nx.name)}</button>` : '');
    showPanel(`<div class="mu-card mu-cele">
        <p class="mu-big" aria-hidden="true">🎉</p>
        <h2>${head}</h2>
        <p class="mu-song">${esc(s.title)}</p>
        <p class="mu-stars" aria-label="${st} of 3 stars for this song">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></p>
        ${gift.map(g => `<p class="mu-gift">${esc(g)}</p>`).join('')}
        <p class="mu-hint">You can stop here, or keep playing.</p>
        <div class="mu-row">${next}<button type="button" class="mu-btn" data-act="again">↺ Play it again</button><button type="button" class="mu-btn" data-act="record">⏺ Record it</button><button type="button" class="mu-btn" data-act="${x ? 'path' : 'songs'}">${x ? '🗺️ All steps' : '🎵 Another song'}</button></div>
      </div>`, 'cele');
  }
  /* a step that isn't a whole song: sparkles, stars and the next step */
  function finishStep(mode, first){
    const x = M.step, gift = [];
    if(mode === 'listen' && first){ award(1); gift.push('✨ 1 sparkle for Fab Fox World'); }
    if(mode === 'follow' && first){ award(1); gift.push('✨ 1 sparkle for Fab Fox World'); }
    if(mode === 'own'){ award(first ? 2 : 1); gift.push(`✨ ${first ? 2 : 1} sparkle${first ? 's' : ''} for Fab Fox World`); }
    try{ Sound && Sound.win && Sound.win(); }catch(e){}
    const st = stepStars(x.id), nx = STEPS[STEPS.indexOf(x) + 1];
    const head = mode === 'listen' ? (x.kind === 'find' ? 'Now you know where they are!' : 'That’s how it goes!') : mode === 'follow' ? 'You followed the lights!' : 'You did it all by yourself!';
    const next = mode === 'listen' ? '<button type="button" class="mu-btn go" data-act="mode:follow">💡 Now follow the lights</button>'
      : mode === 'follow' ? '<button type="button" class="mu-btn go" data-act="mode:own">⭐ Try it on your own</button>'
      : nx ? `<button type="button" class="mu-btn go" data-act="step:${nx.id}">➡️ Next step: ${esc(nx.name)}</button>` : '<button type="button" class="mu-btn go" data-act="path">🗺️ All steps</button>';
    showPanel(`<div class="mu-card mu-cele">
        <p class="mu-big" aria-hidden="true">🎉</p>
        <h2>${head}</h2>
        <p class="mu-song">Step ${x.n}: ${esc(x.name)}</p>
        <p class="mu-goal">✅ ${esc(x.goal)}</p>
        <p class="mu-stars" aria-label="${st} of 3 stars for this step">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></p>
        ${gift.map(g => `<p class="mu-gift">${esc(g)}</p>`).join('')}
        <p class="mu-hint">You can stop here, or keep going.</p>
        <div class="mu-row">${next}<button type="button" class="mu-btn" data-act="again">↺ Again</button><button type="button" class="mu-btn" data-act="path">🗺️ All steps</button></div>
      </div>`, 'cele');
  }
  function award(n){ try{ if(typeof fabWorldAward === 'function') fabWorldAward(n); }catch(e){} }
  function treasure(e){ try{ if(typeof fabWorldTreasure === 'function') fabWorldTreasure(e); }catch(err){} }

  /* ---------- sheet music ---------- */
  const LINE_H = o => 1.9 + 4 + 2.1 + (o.words ? 2.3 : 0) + .5;
  function noteUnits(n, o){
    let u = 2.2 + .7 * Math.min(n.b, 2) + (o.names ? .4 : 0);
    if(o.words && n.w) u = Math.max(u, .54 * 1.25 * n.w.length + .7);
    return u;
  }
  function rowsFor(s, split){
    const rows = []; let b = 0;
    s.lines.forEach((n, li) => {
      if(split && n >= 2){ const h = Math.ceil(n / 2); rows.push({ line:li, b0:b, b1:b + h }); rows.push({ line:li, b0:b + h, b1:b + n }); }
      else rows.push({ line:li, b0:b, b1:b + n });
      b += n;
    });
    return rows;
  }
  function rowUnits(s, r, o){
    let u = 3.6 + (r.b0 === 0 ? 2.6 : 0);
    for(let b = r.b0; b < r.b1; b++){ s.notes.forEach(n => { if(n.bar === b) u += noteUnits(n, o); }); u += 1.1; }
    return u;
  }
  function layout(W, H){
    const s = M.song, o = { names:M.opt.names, colours:M.opt.colours, words:M.opt.words && !s.noWords }, lh = LINE_H(o);
    let best = null;
    [false, true].forEach(split => {
      const rows = rowsFor(s, split), maxU = Math.max(...rows.map(r => rowUnits(s, r, o)));
      [2, 1].forEach(nr => {
        const sz = Math.min(W / maxU, H / (nr * lh), 30);
        const score = Math.min(sz, 26) + (nr === 2 ? 1.5 : 0) - (split ? 3 : 0);
        if(!best || score > best.score) best = { split, rows, nr, s:sz, score, o, lh };
      });
    });
    return best;
  }
  const CLEF = 'M15 33C10 34 7 29 10 25C13 21 20 22 21 28C22 35 14 40 8 37C1 33 2 23 9 17C14 12 20 7 20-2C20-9 15-13 13-8C11-3 11 4 13 14L18 46C19 53 13 56 9 53';
  function renderSheet(){
    const box = $m('#muSheet'); if(!box) return;
    const W = Math.max(200, box.clientWidth - 8), H = Math.max(80, box.clientHeight - 6);
    if(M.find){ box.innerHTML = findSheet(W, H); return; }
    if(!M.song){ box.innerHTML = freeSheet(W, H); return; }
    const L = layout(W, H), s = M.song, o = L.o, S = L.s;
    const curNote = s.notes[Math.min(M.pos, s.notes.length - 1)];
    const ri = Math.max(0, L.rows.findIndex(r => curNote.bar >= r.b0 && curNote.bar < r.b1));
    const page = Math.floor(ri / L.nr), shown = L.rows.slice(page * L.nr, page * L.nr + L.nr);
    const totalH = shown.length * L.lh * S, y0 = Math.max(0, (H - totalH) / 2);
    let out = '';
    shown.forEach((r, k) => { out += staffRow(s, r, o, S, W, y0 + k * L.lh * S); });
    const where = M.pos >= s.notes.length ? 'finished' : `line ${curNote.line + 1}, next note ${curNote.n[0]}`;
    box.innerHTML = `<svg class="mu-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sheet music: ${esc(s.title)}, ${where}">${out}</svg>`;
  }
  function staffRow(s, r, o, S, W, top){
    const sTop = top + 1.9 * S, sBot = sTop + 4 * S;
    const units = rowUnits(s, r, o), stretch = clamp((W / S) / units, 1, 1.5), width = units * S * stretch;
    const left = (W - width) / 2;
    let g = '', x = left + .3 * S;
    g += clef(x, sTop, S);
    x += 3.3 * S;
    if(r.b0 === 0){
      const f = 2.1 * S;
      g += `<text x="${x + S}" y="${sTop + S}" class="mu-ts" font-size="${f}" dominant-baseline="central" text-anchor="middle">${s.time[0]}</text><text x="${x + S}" y="${sTop + 3 * S}" class="mu-ts" font-size="${f}" dominant-baseline="central" text-anchor="middle">${s.time[1]}</text>`;
      x += 2.6 * S;
    }
    const notes = [];
    for(let b = r.b0; b < r.b1; b++){
      s.notes.forEach(n => { if(n.bar !== b) return; const u = noteUnits(n, o) * S * stretch; notes.push({ n, x:x + u / 2, u }); x += u; });
      x += 1.1 * S * stretch * .5;
      g += `<line x1="${x}" y1="${sTop}" x2="${x}" y2="${sBot}" class="mu-bar"/>`;
      if(b === s.bars.length - 1) g += `<rect x="${x + .35 * S}" y="${sTop}" width="${.4 * S}" height="${4 * S}" class="mu-end"/>`;
      x += 1.1 * S * stretch * .5;
    }
    let lines = '';
    for(let i = 0; i < 5; i++) lines += `<line x1="${left}" y1="${sTop + i * S}" x2="${left + width}" y2="${sTop + i * S}" class="mu-line" stroke-width="${Math.max(1, .09 * S)}"/>`;
    /* highlight behind the current note */
    let hl = '';
    const cur = notes.find(p => p.n.i === M.pos);
    if(cur && M.pos < s.notes.length && (M.mode !== 'listen' || M.listen)) hl = `<rect class="mu-hl" x="${cur.x - cur.u / 2 + .15 * S}" y="${sTop - 1.6 * S}" width="${cur.u - .3 * S}" height="${(o.words ? 10 : 7.6) * S}" rx="${.7 * S}"/>`;
    const beams = beamGroups(s, notes);
    let body = '';
    notes.forEach(p => { body += noteSvg(p, sTop, sBot, S, o, beams); });
    beams.forEach(bg => { body += beamSvg(bg, S); });
    if(o.words) notes.forEach(p => { if(!p.n.w) return; body += `<text x="${p.x}" y="${sBot + (o.names ? 3.6 : 3.3) * S}" class="mu-word${p.n.i < M.pos ? ' done' : ''}${p.n.i === M.pos ? ' cur' : ''}" font-size="${1.25 * S}" text-anchor="middle">${esc(p.n.w)}</text>`; });
    return `<g class="mu-row">${hl}${lines}${g}${body}</g>`;
  }
  function clef(x, top, S){
    const k = S / 10;
    return `<g transform="translate(${x} ${top}) scale(${k})" class="mu-clef"><path d="${CLEF}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="50" r="2.8" fill="${INK}"/></g>`;
  }
  /* quavers next to each other inside one beat (or one dotted beat in 6/8) share a beam */
  function beamGroups(s, notes){
    const span = s.time[1] === 8 ? 1.5 : 1, groups = []; let cur = null;
    notes.forEach(p => {
      if(p.n.d === 'e'){
        const slot = Math.floor(p.n.at / span + 1e-9);
        if(cur && cur.slot === slot && cur.list[cur.list.length - 1].n.i === p.n.i - 1) cur.list.push(p);
        else { cur = { slot, list:[p] }; groups.push(cur); }
      } else cur = null;
    });
    return groups.filter(gp => gp.list.length > 1).map(gp => { gp.list.forEach(p => p.beamed = gp); return gp; });
  }
  function noteSvg(p, sTop, sBot, S, o){
    const n = p.n, st = stepOf(n.m), cy = sBot - st * S / 2, cx = p.x, L = letterOf(n.m);
    const hollow = n.b >= 2, done = n.i < M.pos, isCur = n.i === M.pos;
    const big = o.names, rx = (big ? .82 : .66) * S, ry = (big ? .64 : .5) * S;
    const fill = o.colours ? COL[L] : INK;
    let g = '';
    for(let l = -2; l >= st; l -= 2) g += `<line x1="${cx - rx - .4 * S}" x2="${cx + rx + .4 * S}" y1="${sBot - l * S / 2}" y2="${sBot - l * S / 2}" class="mu-line" stroke-width="${Math.max(1, .09 * S)}"/>`;
    for(let l = 10; l <= st; l += 2) g += `<line x1="${cx - rx - .4 * S}" x2="${cx + rx + .4 * S}" y1="${sBot - l * S / 2}" y2="${sBot - l * S / 2}" class="mu-line" stroke-width="${Math.max(1, .09 * S)}"/>`;
    const up = p.beamed ? p.beamed.up : st < 4;
    if(p.beamed && p.beamed.up == null){ const avg = p.beamed.list.reduce((a, q) => a + stepOf(q.n.m), 0) / p.beamed.list.length; p.beamed.up = avg < 4; }
    const upB = p.beamed ? p.beamed.up : up;
    if(n.b < 4){
      const sx = upB ? cx + rx - .06 * S : cx - rx + .06 * S;
      const len = 3.4 * S, sy2 = upB ? cy - len : cy + len;
      p.stem = { x:sx, y1:cy, y2:sy2, up:upB };
      if(!p.beamed){
        g += `<line x1="${sx}" y1="${cy}" x2="${sx}" y2="${sy2}" class="mu-stem" stroke-width="${Math.max(1.4, .13 * S)}"/>`;
        if(n.d === 'e') g += upB ? `<path d="M${sx} ${sy2}c${.2 * S} ${1 * S} ${1.5 * S} ${1.2 * S} ${1.1 * S} ${2.6 * S}" class="mu-flag" stroke-width="${.2 * S}"/>` : `<path d="M${sx} ${sy2}c${.2 * S} ${-1 * S} ${1.5 * S} ${-1.2 * S} ${1.1 * S} ${-2.6 * S}" class="mu-flag" stroke-width="${.2 * S}"/>`;
      }
    }
    const op = done ? ' opacity=".55"' : '';
    g += `<g${op}><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(-18 ${cx} ${cy})" fill="${fill}" stroke="${INK}" stroke-width="${Math.max(1, .1 * S)}"/>`;
    if(hollow) g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * (big ? .74 : .62)}" ry="${ry * (big ? .58 : .42)}" transform="rotate(-18 ${cx} ${cy})" fill="#fff"/>`;
    if(big){ const ink = hollow ? (o.colours ? INK : INK) : (o.colours ? COL_INK[L] : '#fff'); g += `<text x="${cx}" y="${cy}" class="mu-nl" font-size="${(hollow ? .95 : 1.02) * S}" fill="${ink}" text-anchor="middle" dominant-baseline="central">${L}</text>`; }
    if(sharp(n.m)) g += `<text x="${cx - rx - .7 * S}" y="${cy}" font-size="${1.7 * S}" class="mu-acc" text-anchor="middle" dominant-baseline="central">♯</text>`;
    if(n.d === 'q.' || n.d === 'h.'){ const dy = st % 2 === 0 ? -S / 2 : 0; g += `<circle cx="${cx + rx + .45 * S}" cy="${cy + dy}" r="${.18 * S}" fill="${INK}"/>`; }
    g += '</g>';
    if(isCur && M.mode === 'follow' && !M.listen) g += `<text x="${cx}" y="${sTop - .55 * S}" font-size="${1.4 * S}" text-anchor="middle" class="mu-arrow" aria-hidden="true">▼</text>`;
    return `<g class="mu-note${done ? ' done' : ''}${isCur ? ' cur' : ''}" data-i="${n.i}">${g}</g>`;
  }
  function beamSvg(gp, S){
    const list = gp.list, up = gp.up;
    const ys = list.map(p => p.stem.y2), y = up ? Math.min(...ys) : Math.max(...ys);
    let g = '';
    list.forEach(p => { g += `<line x1="${p.stem.x}" y1="${p.stem.y1}" x2="${p.stem.x}" y2="${y}" class="mu-stem" stroke-width="${Math.max(1.4, .13 * S)}"/>`; });
    const x1 = list[0].stem.x, x2 = list[list.length - 1].stem.x, th = .5 * S;
    g += `<rect x="${x1}" y="${up ? y : y - th}" width="${x2 - x1 + Math.max(1.4, .13 * S) / 2}" height="${th}" fill="${INK}"/>`;
    return g;
  }
  function freeSheet(W, H){
    const o = { names:M.opt.names, colours:M.opt.colours, words:false };
    const S = clamp(Math.min(H / LINE_H(o), W / 40), 10, 26);
    const top = Math.max(0, (H - LINE_H(o) * S) / 2), sTop = top + 1.9 * S, sBot = sTop + 4 * S;
    const per = 3.2 * S, cap = Math.max(4, Math.floor((W - 5 * S) / per)), list = M.free.slice(-cap);
    const width = Math.min(W - 2, 4.5 * S + Math.max(cap, 8) * per), left = (W - width) / 2;
    let lines = ''; for(let i = 0; i < 5; i++) lines += `<line x1="${left}" y1="${sTop + i * S}" x2="${left + width}" y2="${sTop + i * S}" class="mu-line" stroke-width="${Math.max(1, .09 * S)}"/>`;
    let body = clef(left + .3 * S, sTop, S);
    const savePos = M.pos; M.pos = -100;
    list.forEach((m, i) => { body += noteSvg({ n:{ m, b:1, d:'q', i:-1 }, x:left + 4.6 * S + i * per + per / 2 }, sTop, sBot, S, o); });
    M.pos = savePos;
    const hint = list.length ? '' : `<text x="${W / 2}" y="${sBot + 2.6 * S}" text-anchor="middle" class="mu-hint-t" font-size="${Math.max(16, 1.1 * S)}">Play any keys. Your notes appear here.</text>`;
    return `<svg class="mu-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="The notes you played: ${list.map(nameOf).join(', ') || 'none yet'}"><g>${lines}${body}${hint}</g></svg>`;
  }

  /* the card for a find step: what to find, a tick for each one found, and the notes on a stave */
  function findSheet(W, H){
    const x = M.step, f = M.find, any = !!x.any;
    const chips = f.targets.map((t, i) => { const got = any ? t.m.some(m => f.found.includes(m)) : i < f.idx || (M.show && f.found.length > i); const cur = !any && i === f.idx && !M.show; return `<span class="mu-chip${got ? ' got' : ''}${cur ? ' cur' : ''}">${got ? '✓' : (i + 1)} ${esc(t.label)}</span>`; }).join('');
    let stave = '';
    if(x.show && x.show.length){
      const o = { names:M.opt.names, colours:M.opt.colours, words:false };
      const S = 16;
      const w = (5 + x.show.length * 3.4) * S, h = LINE_H(o) * S, sTop = 1.9 * S, sBot = sTop + 4 * S;
      let lines = ''; for(let i = 0; i < 5; i++) lines += `<line x1="0" y1="${sTop + i * S}" x2="${w}" y2="${sTop + i * S}" class="mu-line" stroke-width="${Math.max(1, .09 * S)}"/>`;
      const savePos = M.pos; M.pos = -100;
      let body = clef(.3 * S, sTop, S);
      x.show.forEach((n, i) => { body += noteSvg({ n:{ m:midiOf(n), b:4, d:'w', i:-1 }, x:4.6 * S + i * 3.4 * S + 1.7 * S }, sTop, sBot, S, o); });
      M.pos = savePos;
      stave = `<svg class="mu-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="On the music: ${x.show.map(n => n.replace(/(\d)/, ' $1')).join(', ')}"><g>${lines}${body}</g></svg>`;
    }
    return `<div class="mu-find"><div class="mu-find-txt"><p class="mu-find-goal">${esc(x.goal)}</p><p class="mu-find-tell">${esc(x.tell)}</p><div class="mu-chips" aria-label="What to find">${chips}</div></div>${stave}</div>`;
  }

  /* ---------- panels: steps, songs, my music, recording, celebration ---------- */
  function showPanel(html, kind){
    const p = $m('#muPanel'); p.innerHTML = `<div class="mu-panel-in">${html}</div>`; p.hidden = false; M.panel = kind;
    const f = p.querySelector('.mu-btn.go, button'); if(f) try{ f.focus({ preventScroll:true }); }catch(e){}
  }
  function closePanel(){ const p = $m('#muPanel'); if(p){ p.hidden = true; p.innerHTML = ''; } M.panel = null; }
  function openPanel(kind){
    if(kind === 'path'){
      const sug = suggested(), grown = !(new URLSearchParams(location.search).get('learner'));
      const stages = PATH.map(st => {
        const oak = grown && st.oak ? `<p class="mu-oak">For grown-ups, Oak (${esc(st.oak.year)}): <a href="${esc(st.oak.url)}" target="_blank" rel="noopener">${esc(st.oak.title)}</a>${st.oak.lessons.map(l => ` · <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('')}</p>` : '';
        const cards = st.steps.map(x => { const n = stepStars(x.id), me = x === sug; return `<button type="button" class="mu-stepcard${me ? ' next' : ''}${n === 3 ? ' done' : ''}" data-step="${x.id}"><span class="mu-stepn">${x.n}</span><b>${esc(x.name)}</b><span class="mu-uses">${esc(x.goal)}</span><span class="mu-stars" aria-label="${n} of 3 stars">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></span>${me ? '<i class="mu-nexttag">Next</i>' : ''}</button>`; }).join('');
        return `<section class="mu-stage"><h3><span aria-hidden="true">${st.icon}</span> ${esc(st.title)}</h3><p class="mu-hint">${esc(st.about)}</p><div class="mu-steps">${cards}</div>${oak}</section>`;
      }).join('');
      showPanel(`<div class="mu-card mu-wide"><div class="mu-ph"><h2>🗺️ Music steps</h2><button type="button" class="mu-btn" data-act="close" aria-label="Close">✕<span class="mu-lbl"> Close</span></button></div>
        <p class="mu-hint">Start with the keyboard, then build each song a part at a time. Every step has 👂 listen, 💡 follow the lights and ⭐ your turn. Pick any step you like.</p>
        <div class="mu-row wrap"><button type="button" class="mu-btn go" data-step="${sug.id}">➡️ Carry on: Step ${sug.n}</button><button type="button" class="mu-btn" data-song="">🎹 Free play</button><button type="button" class="mu-btn" data-act="songs">🎵 All songs</button></div>
        ${stages}</div>`, 'path');
      const nb = M.el.querySelector('.mu-stepcard.next'); if(nb) try{ nb.scrollIntoView({ block:'center' }); }catch(e){}
      return;
    }
    if(kind === 'songs'){
      const groups = [1, 2, 3].map(lv => `<h3>${LEVELS[lv]}</h3><div class="mu-songs">${SONGS.filter(s => s.level === lv).map(s => {
        const st = starsOf(s.id);
        return `<button type="button" class="mu-songcard" data-song="${s.id}"><b>${esc(s.title)}${s.christmas ? ' <span aria-label="Christmas">🎄</span>' : ''}</b><span class="mu-uses">Notes: ${s.uses.join(' ')}</span><span class="mu-stars" aria-label="${st} of 3 stars">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></span></button>`;
      }).join('')}</div>`).join('');
      showPanel(`<div class="mu-card mu-wide"><div class="mu-ph"><h2>🎵 Choose a song</h2><button type="button" class="mu-btn" data-act="close" aria-label="Close">✕<span class="mu-lbl"> Close</span></button></div>
        <button type="button" class="mu-songcard free" data-song=""><b>🎹 Free play</b><span class="mu-uses">Play anything you like</span></button>
        ${groups}
        <p class="mu-hint">Each song has 3 stars: 👂 listen, 💡 follow the lights and ⭐ play it on your own.</p></div>`, 'songs');
      return;
    }
    if(kind === 'record'){
      const canMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
      showPanel(`<div class="mu-card"><div class="mu-ph"><h2>⏺ Record your music</h2><button type="button" class="mu-btn" data-act="close" aria-label="Close">✕</button></div>
        <p>Recording starts when you choose. Play when you’re ready, then press ⏹ Stop.</p>
        <div class="mu-row"><button type="button" class="mu-btn go" data-act="rec:keys">🎹 Just the keyboard</button>${canMic ? '<button type="button" class="mu-btn go" data-act="rec:voice">🎤 Keyboard and my voice</button>' : ''}</div>
        ${canMic ? '<p class="mu-hint">🎤 Your voice stays on this device. It is never sent anywhere. Headphones stop the keyboard sound being recorded twice.</p>' : '<p class="mu-hint">This device can’t record a voice here, but the keyboard can still be recorded.</p>'}</div>`, 'record');
      return;
    }
    if(kind === 'mine'){ paintMine(); return; }
  }
  async function paintMine(){
    const recs = await DB.all();
    const p = prog(), certs = SONGS.filter(s => p.songs && p.songs[s.id] && p.songs[s.id].own);
    const list = recs.length ? recs.map(r => `<li class="mu-recrow"><div class="mu-rect"><b>${esc(r.title)}</b><span>${fmtDate(r.at)} · ${fmtLen(recLength(r))}${r.voice ? ' · 🎤 with voice' : ''}</span></div>
        <div class="mu-row"><button type="button" class="mu-btn go" data-act="play:${r.id}" aria-label="Listen to ${esc(r.title)}">${M.play && M.play.id === r.id ? '⏹ Stop' : '▶ Listen'}</button>
        <button type="button" class="mu-btn" data-act="mp3:${r.id}" aria-label="Download ${esc(r.title)} as MP3">⬇ MP3</button>
        ${navigator.mediaDevices && window.MediaRecorder ? `<button type="button" class="mu-btn" data-act="sing:${r.id}" aria-label="Sing along to ${esc(r.title)}">🎤 Sing along</button>` : ''}
        <button type="button" class="mu-btn soft" data-act="del:${r.id}" aria-label="Remove ${esc(r.title)}">🗑</button></div></li>`).join('')
      : '<li class="mu-empty">Nothing recorded yet. Press ⏺ Record, play, then ⏹ Stop.</li>';
    const cl = certs.length ? certs.map(s => `<button type="button" class="mu-btn" data-act="cert:${s.id}">🏅 ${esc(s.title)}</button>`).join('') : '<span class="mu-hint">Play a song all by yourself (⭐ Your turn) to earn a certificate.</span>';
    showPanel(`<div class="mu-card mu-wide"><div class="mu-ph"><h2>💾 My music</h2><button type="button" class="mu-btn" data-act="close" aria-label="Close">✕<span class="mu-lbl"> Close</span></button></div>
      <h3>My recordings</h3><ul class="mu-recs">${list}</ul>
      <h3>My certificates</h3><div class="mu-row wrap">${cl}</div>
      <p class="mu-hint mu-about">Your music is kept on this device with your Fab code. MP3 files are made with LAME (<a href="https://lame.sourceforge.net" target="_blank" rel="noopener">lame.sourceforge.net</a>), using lamejs.</p></div>`, 'mine');
  }
  async function panelClick(e){
    const b = e.target.closest('[data-act],[data-song],[data-step]'); if(!b) return;
    if(b.dataset.step && !b.dataset.act){ closePanel(); loadStep(b.dataset.step); return; }
    if(b.dataset.song != null && !b.dataset.act){ closePanel(); loadSong(b.dataset.song || null); return; }
    const [act, arg] = b.dataset.act.split(':');
    if(act === 'close'){ closePanel(); return; }
    if(act === 'mode'){ closePanel(); setMode(arg); return; }
    if(act === 'again'){ closePanel(); setMode(M.mode === 'listen' ? 'listen' : M.mode); return; }
    if(act === 'songs'){ openPanel('songs'); return; }
    if(act === 'path'){ openPanel('path'); return; }
    if(act === 'step'){ closePanel(); loadStep(arg); return; }
    if(act === 'record'){ closePanel(); if(M.song && M.mode === 'listen') setMode('follow'); else { M.pos = 0; paintAll(); } openPanel('record'); return; }
    if(act === 'rec'){ closePanel(); startRec(arg === 'voice'); return; }
    if(act === 'cert'){ const id = arg || (M.song && M.song.id); if(id) certificate(id); return; }
    if(act === 'play'){ const recs = await DB.all(), r = recs.find(x => x.id === arg); if(!r) return; if(M.play && M.play.id === r.id) stopPlayback(); else await playback(r); paintMine(); return; }
    if(act === 'mp3'){ const recs = await DB.all(), r = recs.find(x => x.id === arg); if(r) downloadMp3(r, b); return; }
    if(act === 'sing'){ const recs = await DB.all(), r = recs.find(x => x.id === arg); if(r) singAlong(r); return; }
    if(act === 'del'){ if(!window.confirm('Remove this recording? It can’t be brought back.')) return; await DB.del(arg); paintMine(); return; }
  }
  const fmtDate = t => { try{ return new Date(t).toLocaleDateString('en-GB', { day:'numeric', month:'short' }); }catch(e){ return ''; } };
  const fmtLen = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  /* ---------- recording ---------- */
  const DB = {
    p:null, mem:new Map(),
    open(){ if(this.p) return this.p; this.p = new Promise(res => { try{ const r = indexedDB.open('fab-music', 1); r.onupgradeneeded = () => { r.result.createObjectStore('recs', { keyPath:'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null); }catch(e){ res(null); } }); return this.p; },
    async all(){
      const db = await this.open(), mine = [...this.mem.values()].filter(r => r.who === who());
      if(!db) return mine.sort((a, b) => b.at - a.at);
      return new Promise(res => { const out = mine.slice(); try{ const c = db.transaction('recs').objectStore('recs').openCursor(); c.onsuccess = () => { const cur = c.result; if(cur){ if(cur.value.who === who() && !out.some(r => r.id === cur.value.id)) out.push(cur.value); cur.continue(); } else res(out.sort((a, b) => b.at - a.at)); }; c.onerror = () => res(out); }catch(e){ res(out); } });
    },
    async put(rec){
      const db = await this.open(); if(!db){ this.mem.set(rec.id, rec); return false; }
      return new Promise(res => { try{ const tx = db.transaction('recs', 'readwrite'); tx.objectStore('recs').put(rec); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => { this.mem.set(rec.id, rec); res(false); }; }catch(e){ this.mem.set(rec.id, rec); res(false); } });
    },
    async del(id){
      this.mem.delete(id); const db = await this.open(); if(!db) return;
      return new Promise(res => { try{ const tx = db.transaction('recs', 'readwrite'); tx.objectStore('recs').delete(id); tx.oncomplete = () => res(true); tx.onerror = () => res(false); }catch(e){ res(false); } });
    }
  };
  const MAX_REC = 180;
  async function startRec(withVoice){
    audio();
    const r = { t0:0, ev:[], open:new Map(), song:M.song ? M.song.id : null, inst:A.inst, voice:null, timer:0 };
    if(withVoice){
      toast('Getting the microphone ready…', true);
      const v = await micStart();
      if(v) r.mic = v;
      else toast('The microphone isn’t available here, so just the keyboard is being recorded. (In Pencil Spaces, open the app in its own tab to use the microphone.)', true);
    }
    r.t0 = performance.now(); M.rec = r;
    const btn = $m('#muRec');
    const tick = () => { if(M.rec !== r) return; const s = (performance.now() - r.t0) / 1000; btn.innerHTML = `⏹<span class="mu-lbl"> Stop ${fmtLen(s)}</span>`; btn.setAttribute('aria-label', 'Stop recording'); if(s >= MAX_REC){ stopRec(); toast('That’s 3 minutes, so I’ve saved it for you.'); } };
    r.timer = setInterval(tick, 250); tick(); paintBar();
    btn.innerHTML = '⏹<span class="mu-lbl"> Stop 0:00</span>';
    if(r.mic) r.skip = Math.max(0, (r.t0 - r.mic.at) / 1000);
    toast(r.mic ? 'Recording the keyboard and your voice… press ⏹ Stop when you’ve finished.' : 'Recording… play when you’re ready, then press ⏹ Stop.', true);
  }
  function recOn(m, dur){
    const r = M.rec; if(!r) return;
    const t = (performance.now() - r.t0) / 1000, e = { m, t, d:dur || null };
    r.ev.push(e); if(!dur) r.open.set(m, e);
  }
  function recOff(m){ const r = M.rec; if(!r) return; const e = r.open.get(m); if(e){ e.d = Math.max(.08, (performance.now() - r.t0) / 1000 - e.t); r.open.delete(m); } }
  async function stopRec(){
    const r = M.rec; if(!r) return;
    M.rec = null; clearInterval(r.timer); toast('');
    const end = (performance.now() - r.t0) / 1000;
    r.open.forEach(e => { e.d = Math.max(.08, end - e.t); });
    let voiceBlob = null, mime = '';
    if(r.mic){ const got = await micStop(r.mic); voiceBlob = got.blob; mime = got.type; }
    paintBar();
    if(!r.ev.length && !voiceBlob){ toast('Nothing was played, so nothing was saved.'); return; }
    let ev = r.ev.map(e => ({ m:e.m, t:+e.t.toFixed(3), d:+e.d.toFixed(3) }));
    if(!voiceBlob && ev.length){ const lead = Math.max(0, ev[0].t - .2); ev = ev.map(e => ({ m:e.m, t:+(e.t - lead).toFixed(3), d:e.d })); }
    const all = await DB.all(), n = all.length + 1;
    const song = r.song && SONGS.find(s => s.id === r.song);
    const rec = { id:'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), who:who(), at:Date.now(), title:song ? `${song.title} (my version)` : `My tune ${n}`, inst:r.inst, ev, voice:voiceBlob, voiceType:mime, voiceSkip:voiceBlob ? +(r.skip || 0).toFixed(3) : 0, len:voiceBlob ? end : null };
    await DB.put(rec);
    award(1);
    showPanel(`<div class="mu-card"><h2>💾 Saved in My music</h2><p class="mu-song">${esc(rec.title)}</p><p>${fmtLen(recLength(rec))}${rec.voice ? ' · 🎤 with your voice' : ''}</p>
      <div class="mu-row"><button type="button" class="mu-btn go" data-act="play:${rec.id}">▶ Listen back</button><button type="button" class="mu-btn" data-act="mp3:${rec.id}">⬇ MP3</button><button type="button" class="mu-btn" data-act="close">OK</button></div></div>`, 'saved');
    return rec;
  }
  function recLength(r){ const notes = (r.ev || []).reduce((a, e) => Math.max(a, e.t + e.d), 0); return Math.max(notes, r.len || 0); }
  async function micStart(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true } });
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => { try{ return MediaRecorder.isTypeSupported(t); }catch(e){ return false; } }) || '';
      const mr = new MediaRecorder(stream, type ? { mimeType:type } : undefined), chunks = [];
      mr.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
      mr.start(250);
      return { stream, mr, chunks, type:mr.mimeType || type, at:performance.now() };
    }catch(e){ return null; }
  }
  function micStop(v){
    return new Promise(res => {
      const done = () => { v.stream.getTracks().forEach(t => t.stop()); res({ blob:v.chunks.length ? new Blob(v.chunks, { type:v.type || 'audio/webm' }) : null, type:v.type }); };
      if(v.mr.state === 'inactive'){ done(); return; }
      v.mr.onstop = done; try{ v.mr.stop(); }catch(e){ done(); }
    });
  }
  async function decodeBlob(blob){
    const ab = await blob.arrayBuffer();
    const C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const tmp = new C(1, 1, 44100);
    return new Promise((res, rej) => { const p = tmp.decodeAudioData(ab, res, rej); if(p && p.then) p.then(res, rej); });
  }
  async function playback(r){
    stopPlayback();
    const ctx = audio(); if(!ctx) return;
    const t0 = ctx.currentTime + .2, stops = [], timers = [];
    (r.ev || []).forEach(e => {
      stops.push(voice(ctx, A.out, e.m, t0 + e.t, r.inst || 'piano', .85, e.d));
      timers.push(setTimeout(() => { M.lit = e.m; paintKeys(); }, (e.t + .2) * 1000), setTimeout(() => { if(M.lit === e.m){ M.lit = null; paintKeys(); } }, (e.t + e.d + .2) * 1000));
    });
    let src = null;
    if(r.voice){ try{ const buf = await decodeBlob(r.voice); src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = 1.1; src.connect(g); g.connect(ctx.destination); src.start(Math.max(t0, ctx.currentTime + .02), Math.min(r.voiceSkip || 0, buf.duration)); }catch(e){} }
    const len = recLength(r);
    M.play = { id:r.id, stops, timers, src, end:setTimeout(() => { M.play = null; M.lit = null; paintKeys(); if(M.panel === 'mine') paintMine(); }, (len + .6) * 1000) };
  }
  function stopPlayback(){
    const p = M.play; if(!p) return; M.play = null;
    const now = A.ctx ? A.ctx.currentTime : 0; p.stops.forEach(s => s(now)); p.timers.forEach(clearTimeout); clearTimeout(p.end);
    if(p.src) try{ p.src.stop(); }catch(e){}
    M.lit = null; paintKeys();
  }
  async function singAlong(r){
    if(r.voice && !window.confirm('This recording already has your voice. Record a new voice instead?')) return;
    closePanel();
    const v = await micStart();
    if(!v){ toast('The microphone isn’t available here. (In Pencil Spaces, open the app in its own tab to use the microphone.)'); return; }
    const plain = Object.assign({}, r, { voice:null });
    toast('Sing along! The recording is playing…', true);
    const startAt = performance.now() + 200;
    await playback(plain);
    const len = recLength(plain) + .8;
    await new Promise(res => setTimeout(res, len * 1000));
    const got = await micStop(v);
    stopPlayback();
    if(got.blob){ r.voice = got.blob; r.voiceType = got.type; r.voiceSkip = +Math.max(0, (startAt - v.at) / 1000).toFixed(3); r.len = Math.max(recLength(plain), len); await DB.put(r); toast('Your voice is saved with this recording. 🎤'); }
    paintMine();
  }

  /* ---------- MP3 ---------- */
  function loadScript(src){
    return new Promise((res, rej) => { if(window.lamejs) return res(); const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
  }
  async function renderRec(r, rate){
    rate = rate || 44100;
    const C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    let vb = null; if(r.voice){ try{ vb = await decodeBlob(r.voice); }catch(e){ vb = null; } }
    const total = Math.max(recLength(r) + 1.2, vb ? vb.duration + .3 : 0, .5);
    const oc = new C(1, Math.ceil(total * rate), rate), out = makeOut(oc, oc.destination);
    (r.ev || []).forEach(e => voice(oc, out, e.m, e.t + .05, r.inst || 'piano', .85, Math.max(.08, e.d)));
    if(vb){ const src = oc.createBufferSource(); src.buffer = vb; const g = oc.createGain(); g.gain.value = 1.1; src.connect(g); g.connect(oc.destination); src.start(.05, Math.min(r.voiceSkip || 0, vb.duration)); }
    return oc.startRendering();
  }
  async function toMp3(buf){
    await loadScript('lib/lame.min.js');
    const enc = new window.lamejs.Mp3Encoder(1, buf.sampleRate, 128);
    const f = buf.getChannelData(0), N = f.length, CH = 1152, parts = [];
    for(let i = 0, k = 0; i < N; i += CH, k++){
      const n = Math.min(CH, N - i), blk = new Int16Array(n);
      for(let j = 0; j < n; j++){ const v = clamp(f[i + j], -1, 1); blk[j] = v < 0 ? v * 0x8000 : v * 0x7fff; }
      const o = enc.encodeBuffer(blk); if(o.length) parts.push(new Uint8Array(o.buffer, o.byteOffset, o.length).slice());
      if(k % 150 === 149) await new Promise(r => setTimeout(r, 0));
    }
    const e = enc.flush(); if(e.length) parts.push(new Uint8Array(e.buffer, e.byteOffset, e.length).slice());
    return new Blob(parts, { type:'audio/mpeg' });
  }
  async function makeMp3(r){ return toMp3(await renderRec(r)); }
  function slug(t){ return String(t || 'my-music').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'my-music'; }
  function save(blob, name){
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function downloadMp3(r, btn){
    const was = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled = true; btn.textContent = 'Making MP3…'; }
    try{ const blob = await makeMp3(r); save(blob, `fab-music-${slug(r.title)}.mp3`); toast('Your MP3 is in your downloads. 🎵'); }
    catch(e){ toast('Sorry, the MP3 couldn’t be made on this device.'); }
    if(btn){ btn.disabled = false; btn.innerHTML = was; }
  }

  /* ---------- certificate (PDF, A4 landscape). A line to write the name by hand: no names are kept in the app. ---------- */
  function foxImage(){
    return new Promise(res => {
      try{
        const d = document.createElement('div'); d.className = 'fab-char fab'; d.style.cssText = 'position:absolute;left:-9999px;width:10px;height:10px'; document.body.appendChild(d);
        const bg = getComputedStyle(d).backgroundImage; d.remove();
        const m = /url\(["']?(.*?)["']?\)$/.exec(bg || ''); if(!m) return res(null);
        const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = m[1];
      }catch(e){ res(null); }
    });
  }
  function star(g, cx, cy, r, fill){
    g.beginPath(); for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = fill; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  }
  async function certificateCanvas(songId){
    const s = SONGS.find(x => x.id === songId); if(!s) return null;
    const W = 2000, H = 1414, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const disp = "'BMF Display','Canada Tawa Cute',Aleo,Georgia,serif", body = "Aleo,Georgia,serif";
    try{ await Promise.all([document.fonts.load(`700 120px ${disp}`), document.fonts.load(`400 50px ${body}`)]); }catch(e){}
    g.fillStyle = '#FFF8EC'; g.fillRect(0, 0, W, H);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.lineWidth = 22; g.strokeStyle = '#EF915E'; rr(40, 40, W - 80, H - 80, 60); g.stroke();
    g.lineWidth = 5; g.strokeStyle = INK; rr(70, 70, W - 140, H - 140, 44); g.stroke();
    const flags = ['#FE4D02', '#FFD483', '#4F7A2E', '#3F6A8C', '#EF915E'];
    for(let i = 0; i < 17; i++){ const x = 150 + i * 100; g.fillStyle = flags[i % 5]; g.beginPath(); g.moveTo(x, 92); g.lineTo(x + 84, 92); g.lineTo(x + 42, 170); g.closePath(); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(130, 92); g.quadraticCurveTo(W / 2, 110, W - 130, 92); g.stroke();
    const fox = await foxImage();
    if(fox){ const h = 560, w = h * fox.width / fox.height; g.drawImage(fox, 120, H - 110 - h, w, h); }
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const cx = W / 2 + 150;
    g.fillStyle = '#FE4D02'; g.font = `700 150px ${disp}`; g.fillText('Music Star', cx, 360);
    g.fillStyle = INK; g.font = `700 64px ${disp}`; g.fillText('CERTIFICATE', cx, 450);
    g.font = `400 52px ${body}`; g.fillText('This certificate is for', cx, 570);
    g.setLineDash([4, 14]); g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 480, 690); g.lineTo(cx + 480, 690); g.stroke(); g.setLineDash([]);
    g.font = `400 52px ${body}`; g.fillText('for playing', cx, 790);
    g.fillStyle = '#4F7A2E'; let fs = 84; g.font = `700 ${fs}px ${disp}`; while(g.measureText(s.title).width > 1250 && fs > 40){ fs -= 4; g.font = `700 ${fs}px ${disp}`; } g.fillText(s.title, cx, 900);
    g.fillStyle = INK; g.font = `400 52px ${body}`; g.fillText('on the keyboard, all by themselves.', cx, 990);
    const st = starsOf(songId) || 3; [0, 1, 2].forEach(i => star(g, cx - 130 + i * 130, 1090, 50, i < st ? '#FFD483' : '#fff'));
    const sp = songProg(songId), when = sp.ownDate ? new Date(sp.ownDate + 'T12:00:00') : new Date();
    g.fillStyle = INK; g.textAlign = 'center';
    g.font = `400 44px ${body}`; g.fillText(when.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }), cx, 1205);
    g.font = `700 42px ${disp}`; g.fillStyle = '#3F6A8C'; g.fillText('With love from everyone at BeMoreFab  #bemorefab', cx, H - 140);
    return c;
  }
  function pdfFromJpeg(jpg, wPx, hPx){
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    const PW = 842, PH = 595, content = `q ${PW} 0 0 ${PH} 0 0 cm /Im1 Do Q`;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`));
    obj(4, () => { push(`<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
    obj(5, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    const xref = len;
    push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type:'application/pdf' });
  }
  async function certificatePdf(songId){
    const c = await certificateCanvas(songId); if(!c) return null;
    const url = c.toDataURL('image/jpeg', .9), bin = atob(url.split(',')[1]), jpg = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) jpg[i] = bin.charCodeAt(i);
    return pdfFromJpeg(jpg, c.width, c.height);
  }
  async function certificate(songId){
    toast('Making your certificate…', true);
    try{ const pdf = await certificatePdf(songId); const s = SONGS.find(x => x.id === songId); save(pdf, `fab-music-certificate-${slug(s.title)}.pdf`); toast('Your certificate is in your downloads. Print it, write your name on it and take it home! 🏅'); }
    catch(e){ toast('Sorry, the certificate couldn’t be made on this device.'); }
  }

  /* ---------- open from the Learning Hub ---------- */
  document.addEventListener('click', e => { const b = e.target.closest('[data-music-open]'); if(b){ e.preventDefault(); open(b.dataset.musicOpen || null); } });

  window.FabMusic = {
    open, leave, songs:SONGS, checkSongs, path:PATH, steps:STEPS, checkPath, loadStep, stepSong, suggested, state:() => M, keys:() => K,
    noteOn, noteOff, setMode, loadSong, fabHelps, listenPlay, stopListen, startRec, stopRec,
    db:DB, recLength, renderRec, makeMp3, certificatePdf, certificateCanvas, COL, COL_INK, midiOf, nameOf, stepOf
  };
})();
