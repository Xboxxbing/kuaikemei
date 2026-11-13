#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为没有实拍图的产品生成「展陈式」产品卡 SVG（覆盖原有灰色占位图）。
按品类配色，与 quick-mix 橙色产品包装保持一致的品牌调性。
用法：python3 tools/gen-product-cards.py
"""
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'server', 'data', 'seed.json')
OUT = os.path.join(ROOT, 'public', 'assets', 'img', 'product')

PALETTE = {
    'meifeng':  ('#E85D24', '#F7A657', '美缝系统'),
    'dizhuan':  ('#4F6B85', '#8FA9BF', '瓷砖与石材粘贴'),
    'fangshui': ('#237C9B', '#67B6CC', '防水系统'),
    'shajiang': ('#8A7B6B', '#C4B6A6', '砂浆与腻子'),
    'tuliao':   ('#3F8A6B', '#8DC3A5', '涂料系统'),
    'diping':   ('#5F6A78', '#A6B0BC', '地坪系统'),
}

def esc(s):
    return html.escape(str(s or ''))


def card(p):
    cat = p.get('category', 'meifeng')
    c1, c2, catname = PALETTE.get(cat, PALETTE['meifeng'])
    model = esc(p.get('model') or '')
    name = esc(p.get('name') or '')
    spec = esc(p.get('spec') or '')
    series = esc(p.get('series') or '')
    # 包装形态：美缝用双管，粉料用桶，涂料用桶，地坪用袋
    shape = 'tube' if cat in ('meifeng',) else ('bag' if cat in ('diping', 'shajiang') else 'pail')

    pkg = ''
    if shape == 'tube':
        pkg = f'''
  <!-- 双组份胶管 -->
  <g filter="url(#shadow)">
    <rect x="352" y="112" width="86" height="238" rx="10" fill="url(#pkg)"/>
    <rect x="446" y="112" width="86" height="238" rx="10" fill="url(#pkg2)"/>
    <rect x="368" y="96" width="54" height="26" rx="5" fill="#f2f3f5"/>
    <rect x="462" y="96" width="54" height="26" rx="5" fill="#f2f3f5"/>
    <rect x="360" y="150" width="70" height="86" rx="4" fill="#ffffff" opacity=".92"/>
    <rect x="454" y="150" width="70" height="86" rx="4" fill="#ffffff" opacity=".92"/>
  </g>
  <text x="395" y="205" text-anchor="middle" font-size="30" font-weight="800" fill="{c1}">{model[:5]}</text>
  <text x="489" y="205" text-anchor="middle" font-size="11" fill="#6b7076">quick-mix</text>
  <rect x="360" y="258" width="70" height="3" fill="{c1}" opacity=".55"/>
  <rect x="454" y="258" width="70" height="3" fill="{c1}" opacity=".55"/>'''
    elif shape == 'bag':
        pkg = f'''
  <!-- 袋装 -->
  <g filter="url(#shadow)">
    <path d="M362 118 H518 L530 342 Q442 356 350 342 Z" fill="url(#pkg)"/>
    <path d="M362 118 H518 L522 158 H358 Z" fill="#ffffff" opacity=".22"/>
    <rect x="372" y="186" width="136" height="92" rx="4" fill="#ffffff" opacity=".93"/>
  </g>
  <text x="440" y="238" text-anchor="middle" font-size="27" font-weight="800" fill="{c1}">{model[:7]}</text>
  <text x="440" y="262" text-anchor="middle" font-size="11" fill="#6b7076">quick-mix</text>'''
    else:
        pkg = f'''
  <!-- 桶装 -->
  <g filter="url(#shadow)">
    <path d="M366 128 H514 L506 344 Q440 356 374 344 Z" fill="url(#pkg)"/>
    <ellipse cx="440" cy="128" rx="74" ry="16" fill="#f4f5f7"/>
    <ellipse cx="440" cy="122" rx="74" ry="16" fill="url(#lid)"/>
    <rect x="374" y="182" width="132" height="106" rx="4" fill="#ffffff" opacity=".94"/>
  </g>
  <text x="440" y="232" text-anchor="middle" font-size="26" font-weight="800" fill="{c1}">{model[:7]}</text>
  <text x="440" y="258" text-anchor="middle" font-size="11" fill="#6b7076">quick-mix</text>
  <rect x="392" y="272" width="96" height="3" fill="{c1}" opacity=".55"/>'''

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef1f4"/>
    </linearGradient>
    <linearGradient id="pkg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{c1}"/><stop offset=".55" stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/>
    </linearGradient>
    <linearGradient id="pkg2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/>
    </linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9ebee"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe2e6"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="13" flood-color="#1a1d21" flood-opacity=".16"/>
    </filter>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M34 0H0V34" fill="none" stroke="{c1}" stroke-opacity=".05" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="600" height="450" fill="url(#bg)"/>
  <rect width="600" height="450" fill="url(#grid)"/>
  <circle cx="470" cy="212" r="168" fill="{c1}" opacity=".055"/>
  <circle cx="470" cy="212" r="118" fill="none" stroke="{c1}" stroke-opacity=".12" stroke-width="1"/>
  <!-- 底部投影 -->
  <ellipse cx="440" cy="362" rx="118" ry="13" fill="#1a1d21" opacity=".07"/>
{pkg}

  <!-- 左侧信息区 -->
  <rect x="46" y="86" width="4" height="34" fill="{c1}"/>
  <text x="64" y="112" font-size="13" letter-spacing="3" fill="{c1}" font-family="Arial, Helvetica, sans-serif" font-weight="700">QUICK-MIX</text>
  <text x="44" y="182" font-size="44" font-weight="800" fill="#1a1d21" font-family="Arial, Helvetica, sans-serif">{model[:9]}</text>
  <text x="46" y="220" font-size="20" font-weight="600" fill="#3a3f46" font-family="PingFang SC, Microsoft YaHei, sans-serif">{name[:14]}</text>
  <text x="46" y="252" font-size="14" fill="#8a8f96" font-family="PingFang SC, Microsoft YaHei, sans-serif">{catname}</text>
  <line x1="46" y1="278" x2="286" y2="278" stroke="#dfe2e6" stroke-width="1"/>
  <text x="46" y="308" font-size="14" fill="#5b6169" font-family="PingFang SC, Microsoft YaHei, sans-serif">{spec[:18]}</text>
  <text x="46" y="332" font-size="12" fill="#a0a5ab" font-family="PingFang SC, Microsoft YaHei, sans-serif">{series[:18]}</text>

  <!-- 底部品牌条 -->
  <rect x="0" y="424" width="600" height="26" fill="{c1}" opacity=".9"/>
  <text x="24" y="442" font-size="12" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="1">quick-mix</text>
  <text x="576" y="442" text-anchor="end" font-size="11" fill="#ffffff" opacity=".85" font-family="PingFang SC, Microsoft YaHei, sans-serif">SINCE 1919 · GERMANY</text>
</svg>'''


def main():
    with open(SEED, encoding='utf-8') as f:
        seed = json.load(f)
    n = 0
    for p in seed['products']:
        img = p.get('img') or ''
        if not img.endswith('.svg') or 'real' in img:
            continue
        path = os.path.join(OUT, img)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(card(p))
        n += 1
    print(f'已生成 {n} 张展陈式产品卡 SVG')


if __name__ == '__main__':
    main()
