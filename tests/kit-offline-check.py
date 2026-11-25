# Kit check, step 0: stacks every layer on the plain fox with no app at all and compares it with its worn preview; builds the six outfits.
# Offline check of the accessory kit: every layer stacked on the plain fox must match its worn preview; and the six test outfits.
import json, os, sys
from PIL import Image, ImageChops, ImageStat
D = '/home/claude/kit_shop/Fab Fox shop accessories/'
m = json.load(open(D + 'manifest.json', encoding='utf-8'))
W, H = m['canvas']['width'], m['canvas']['height']
base = Image.open(D + m['base']).convert('RGBA'); assert base.size == (W, H), base.size
items = {it['id']: it for it in m['items']}
order = m['slots']; print('slots:', order if len(json.dumps(order)) < 400 else len(order))
def stack(ids):
    im = base.copy()
    for it in sorted((items[i] for i in ids), key=lambda it: it['z']): im.alpha_composite(Image.open(D + it['layer']).convert('RGBA'))
    return im
bad = []; sizes = set(); worst = 0
for it in m['items']:
    L = Image.open(D + it['layer']); sizes.add(L.size); ic = Image.open(D + it['icon']); assert ic.size == (512, 512), (it['id'], ic.size)
    pv = Image.open(D + it['preview']).convert('RGBA'); assert pv.size == (W, H), (it['id'], pv.size)
    st = stack([it['id']])
    # compare over a white ground (previews may or may not be transparent)
    def flat(x): bg = Image.new('RGBA', x.size, (255, 255, 255, 255)); bg.alpha_composite(x); return bg.convert('RGB')
    d = ImageChops.difference(flat(st), flat(pv)); mean = sum(ImageStat.Stat(d).mean) / 3; mx = max(e[1] for e in d.getextrema())
    big = sum(1 for px in d.convert('L').point(lambda v: 255 if v > 48 else 0).getdata() if px) / (W * H)
    worst = max(worst, mean)
    if mean > 1.2 or big > .002: bad.append((it['id'], round(mean, 2), mx, round(big * 100, 3)))
print('layer sizes:', sizes, '| worst mean difference:', round(worst, 3), '| items that differ from their preview:', bad)
OUT = {'Explorer': ['stripy-t-shirt', 'wellies', 'neckerchief', 'satchel', 'cowboy-hat'], 'Space fox': ['space-suit', 'rocket-boots', 'space-helmet'],
       'Rock star': ['light-up-jacket', 'trainers', 'sunglasses', 'mohawk'], 'Smart fox': ['smart-suit', 'briefcase', 'moustache', 'trilby'],
       'Party fox': ['star-t-shirt', 'trainers', 'balloon', 'heart-sunglasses', 'party-hat'], 'Wizard': ['superhero-cape', 'star-wand', 'round-glasses', 'wizard-hat']}
for k, ids in OUT.items(): assert all(i in items for i in ids), k
tw = 300; th = round(tw * H / W); sheet = Image.new('RGB', (tw * 6, th), '#FFF6E6')
for i, (k, ids) in enumerate(OUT.items()): sheet.paste(flat(stack(ids)).resize((tw, th), Image.LANCZOS), (i * tw, 0))
sheet.save('/home/claude/work/kit-outfits-mine.png')
sh = Image.open(D + 'sheets/All accessories on the fox.png'); print('sheet size', sh.size)
sh.convert('RGB').resize((1800, round(1800 * sh.size[1] / sh.size[0])), Image.LANCZOS).save('/home/claude/work/kit-sheet-small.png')
json.dump(OUT, open('/home/claude/work/kit-outfits.json', 'w'))
