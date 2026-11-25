# Kit check, step 2: compares the shop's try-on pictures (from kit-check.cjs) with the kit's worn-previews, and the six outfits with layers stacked offline.
# Passed on 25 Nov 2026: 46 of 46 items, worst mean difference 0.78 out of 255 (the previews' own compression).
import json, sys
from PIL import Image, ImageChops, ImageStat
D = '/home/claude/kit_shop/Fab Fox shop accessories/'; S = '/home/claude/work/kitshots/'
m = json.load(open(D + 'manifest.json', encoding='utf-8')); log = json.load(open(S + 'log.json'))
def flat(x):
    x = x.convert('RGBA'); bg = Image.new('RGBA', x.size, (255, 255, 255, 255)); bg.alpha_composite(x); return bg.convert('RGB')
bad = []; worst = 0
for it in m['items']:
    a = Image.open(S + it['id'] + '.png'); pv = Image.open(D + it['preview'])
    if a.size != pv.size: bad.append((it['id'], 'size', a.size)); continue
    d = ImageChops.difference(flat(a), flat(pv)); mean = sum(ImageStat.Stat(d).mean) / 3
    big = sum(d.convert('L').point(lambda v: 1 if v > 48 else 0).histogram()[1:2]) / (a.size[0] * a.size[1])
    worst = max(worst, mean)
    if mean > 1.5 or big > .003: bad.append((it['id'], round(mean, 2), round(big * 100, 3)))
    exp = ['base/plain-fox.png', it['layer']]; got = next(x for x in log if x.get('id') == it['id'])['layers']
    if got != exp: bad.append((it['id'], 'layers', got))
print('46 items through the shop: worst mean difference from the worn preview', round(worst, 3), '| problems:', bad)
by = {it['id']: it for it in m['items']}; outs = json.load(open('/home/claude/work/kit-outfits.json'))
for x in log:
    if 'outfit' in x:
        exp = ['base/plain-fox.png'] + [it['layer'] for it in sorted((by[i] for i in outs[x['outfit']]), key=lambda it: it['z'])]
        print(x['outfit'], 'z order right:', x['layers'] == exp)
tw = 300; th = round(tw * 1470 / 1006); sheet = Image.new('RGB', (tw * 6, th), 'white')
for i, name in enumerate(outs): sheet.paste(flat(Image.open(S + 'outfit-' + name.replace(' ', '-') + '.png')).resize((tw, th), Image.LANCZOS), (i * tw, 0))
mine = Image.open('/home/claude/work/kit-outfits-mine.png'); d = ImageChops.difference(sheet, mine.convert('RGB'))
print('six outfits in the app vs stacked offline: mean difference', round(sum(ImageStat.Stat(d).mean) / 3, 3)); sheet.save('/home/claude/work/kit-outfits-app.png')
