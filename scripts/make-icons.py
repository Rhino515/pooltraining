# Pool IQ v12 app icon generator (code-drawn, no image generator).
# Builds self-contained SVG masters in icons/src/ (the POOL IQ wordmark is converted to outlines from the
# bundled Poppins ExtraBold with fontTools), then scripts/render-icons.mjs rasterises them with Chrome.
#   pip install fonttools brotli && python3 scripts/make-icons.py && node scripts/render-icons.mjs
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import math, json
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = TTFont(os.path.join(ROOT, 'fonts', 'poppins-extrabold.woff2'))
GS = FONT.getGlyphSet(); CMAP = FONT.getBestCmap(); HM = FONT['hmtx']; UPM = FONT['head'].unitsPerEm
def text_path(s, x, y, size, anchor='middle', track=0):
    sc = size / UPM
    names = [CMAP[ord(c)] for c in s]
    widths = [HM[n][0] * sc + track for n in names]
    total = sum(widths) - track
    cx = x - total / 2 if anchor == 'middle' else x
    d = ''
    for n, w in zip(names, widths):
        pen = SVGPathPen(GS)
        tp = TransformPen(pen, (sc, 0, 0, -sc, cx, y))
        GS[n].draw(tp)
        d += pen.getCommands()
        cx += w
    return d, total
def f(v): return ('%.2f' % v).rstrip('0').rstrip('.')

def table(x, y, w, h, rail, uid):
    s = ''
    s += f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(rail*1.15)}" fill="url(#wood{uid})" stroke="#1a0c05" stroke-width="{f(rail*0.12)}"/>'
    s += f'<rect x="{f(x+rail*0.16)}" y="{f(y+rail*0.16)}" width="{f(w-rail*0.32)}" height="{f(h-rail*0.32)}" rx="{f(rail*1.0)}" fill="none" stroke="#d99a63" stroke-opacity=".35" stroke-width="{f(rail*0.07)}"/>'
    ci = rail * 0.78  # cushion inset
    s += f'<rect x="{f(x+ci-rail*0.1)}" y="{f(y+ci-rail*0.1)}" width="{f(w-2*ci+rail*0.2)}" height="{f(h-2*ci+rail*0.2)}" rx="{f(rail*0.3)}" fill="#1a0c05"/>'
    s += f'<rect x="{f(x+ci)}" y="{f(y+ci)}" width="{f(w-2*ci)}" height="{f(h-2*ci)}" rx="{f(rail*0.22)}" fill="#045466"/>'
    fi = rail  # felt inset
    fx, fy, fw, fh = x+fi, y+fi, w-2*fi, h-2*fi
    s += f'<rect x="{f(fx)}" y="{f(fy)}" width="{f(fw)}" height="{f(fh)}" fill="url(#felt{uid})"/>'
    # diamonds
    dw, dh = rail*0.2, rail*0.32
    for k in [1,2,3,5,6,7]:
        cx = fx + fw*k/8
        for cy in [y+rail*0.45, y+h-rail*0.45]:
            s += f'<path d="M{f(cx)} {f(cy-dh)} L{f(cx+dw)} {f(cy)} L{f(cx)} {f(cy+dh)} L{f(cx-dw)} {f(cy)}Z" fill="#f4f6fb"/>'
    for k in [1,2,3]:
        cy = fy + fh*k/4
        for cx in [x+rail*0.45, x+w-rail*0.45]:
            s += f'<path d="M{f(cx-dh)} {f(cy)} L{f(cx)} {f(cy-dw)} L{f(cx+dh)} {f(cy)} L{f(cx)} {f(cy+dw)}Z" fill="#f4f6fb"/>'
    pr = rail*0.62
    for (px, py) in [(fx, fy), (fx+fw/2, fy-rail*0.12), (fx+fw, fy), (fx, fy+fh), (fx+fw/2, fy+fh+rail*0.12), (fx+fw, fy+fh)]:
        s += f'<circle cx="{f(px)}" cy="{f(py)}" r="{f(pr+rail*0.12)}" fill="#140a05"/><circle cx="{f(px)}" cy="{f(py)}" r="{f(pr)}" fill="#000"/>'
    return s, (fx, fy, fw, fh)

def ball(cx, cy, r, color, num, uid):
    s = f'<circle cx="{f(cx)}" cy="{f(cy+r*0.18)}" r="{f(r*1.02)}" fill="#000" opacity=".35"/>'
    s += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{color}"/>'
    if num is not None:
        s += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r*0.5)}" fill="#fbfdff"/>'
        d, _ = text_path(str(num), cx, cy + r*0.24, r*0.7)
        s += f'<path d="{d}" fill="#0b0f14"/>'
    s += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="url(#shine{uid})"/>'
    return s

def defs(uid):
    return f'''<defs>
<linearGradient id="bg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10233b"/><stop offset=".55" stop-color="#07111e"/><stop offset="1" stop-color="#040a12"/></linearGradient>
<radialGradient id="glow{uid}" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#1a6fd6" stop-opacity=".35"/><stop offset="1" stop-color="#1a6fd6" stop-opacity="0"/></radialGradient>
<linearGradient id="wood{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c4727"/><stop offset=".18" stop-color="#5e341c"/><stop offset=".82" stop-color="#4b2916"/><stop offset="1" stop-color="#6a3b20"/></linearGradient>
<radialGradient id="felt{uid}" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#0c8aa5"/><stop offset=".6" stop-color="#066b83"/><stop offset="1" stop-color="#034556"/></radialGradient>
<radialGradient id="shine{uid}" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".22" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
<linearGradient id="blue{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ab8ff"/><stop offset="1" stop-color="#0a86ff"/></linearGradient>
</defs>'''

def mark(uid, detail=True):
    """content on a 512 canvas: wordmark + table with a bank shot"""
    s = ''
    d1, w1 = text_path('POOL', 0, 0, 118)
    d2, w2 = text_path('IQ', 0, 0, 118)
    gap = 26
    tot = w1 + gap + w2
    x0 = 256 - tot/2
    p1, _ = text_path('POOL', x0, 196, 118, anchor='start')
    p2, _ = text_path('IQ', x0 + w1 + gap, 196, 118, anchor='start')
    s += f'<path d="{p1}" fill="#ffffff"/><path d="{p2}" fill="url(#blue{uid})"/>'
    t, (fx, fy, fw, fh) = table(54, 236, 404, 226, 30, uid)
    s += t
    # a correct cut shot: object ball straight into the top-right corner pocket; cue ball aimed at the ghost-ball spot
    R_OB = 21
    cue = (fx + fw*0.2, fy + fh*0.74); ob = (fx + fw*0.64, fy + fh*0.44)
    pk = (fx + fw - 4, fy + 4)
    dx, dy = pk[0]-ob[0], pk[1]-ob[1]; L = math.hypot(dx, dy); ux, uy = dx/L, dy/L
    gh = (ob[0] - ux*2*R_OB, ob[1] - uy*2*R_OB)
    cdx, cdy = gh[0]-cue[0], gh[1]-cue[1]; cl = math.hypot(cdx, cdy)
    s += f'<path d="M{f(cue[0]+cdx/cl*22)} {f(cue[1]+cdy/cl*22)} L{f(gh[0]-cdx/cl*R_OB)} {f(gh[1]-cdy/cl*R_OB)}" stroke="#eef6ff" stroke-width="5" stroke-dasharray="11 9" stroke-linecap="round" opacity=".9"/>'
    s += f'<circle cx="{f(gh[0])}" cy="{f(gh[1])}" r="{R_OB}" fill="#ffffff22" stroke="#eef6ff" stroke-width="3" stroke-dasharray="6 5"/>'
    s += f'<path d="M{f(ob[0]+ux*(R_OB+6))} {f(ob[1]+uy*(R_OB+6))} L{f(pk[0]-ux*26)} {f(pk[1]-uy*26)}" stroke="#ffd34d" stroke-width="5" stroke-dasharray="11 9" stroke-linecap="round"/>'
    s += ball(cue[0], cue[1], 19, '#f5f7fa', None, uid)
    s += ball(ob[0], ob[1], R_OB, '#f5c518', 1, uid)
    return s

def svg(kind, size=512):
    uid = kind
    out = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">' + defs(uid)
    if kind == 'any':
        out += f'<rect width="512" height="512" rx="112" fill="url(#bg{uid})"/><rect width="512" height="512" rx="112" fill="url(#glow{uid})"/>'
        out += f'<rect x="3" y="3" width="506" height="506" rx="109" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="6"/>'
        out += mark(uid)
    elif kind in ('maskable', 'apple'):
        out += f'<rect width="512" height="512" fill="url(#bg{uid})"/><rect width="512" height="512" fill="url(#glow{uid})"/>'
        sc = 0.78 if kind == 'maskable' else 0.9
        out += f'<g transform="translate({f(256-256*sc)} {f(256-256*sc+ (6 if kind=="maskable" else 4))}) scale({sc})">' + mark(uid) + '</g>'
    elif kind == 'favicon':
        # simplified for 16-48 px: wood-framed teal cloth tile, bold IQ, one yellow ball
        out += f'<rect x="8" y="8" width="496" height="496" rx="110" fill="url(#wood{uid})" stroke="#1a0c05" stroke-width="12"/>'
        out += f'<rect x="64" y="64" width="384" height="384" rx="40" fill="#1a0c05"/>'
        out += f'<rect x="74" y="74" width="364" height="364" rx="32" fill="url(#felt{uid})"/>'
        for (px, py) in [(74, 74), (438, 74), (74, 438), (438, 438)]:
            out += f'<circle cx="{px}" cy="{py}" r="40" fill="#000"/>'
        d, _ = text_path('IQ', 256, 330, 250)
        out += f'<path d="{d}" fill="#fff" stroke="#03303b" stroke-width="10" paint-order="stroke"/>'
    out += '</svg>'
    return out

for k in ['any', 'maskable', 'apple', 'favicon']:
    open(os.path.join(ROOT, 'icons', 'src', f'{k}.svg'), 'w').write(svg(k))
open(os.path.join(ROOT, 'icons', 'favicon.svg'), 'w').write(svg('favicon'))
print('ok')
