"""Disguise props, loot, yard pieces and the thrown slipper. Same conventions as obj_furniture.py."""
import math

from mathutils import Euler, Vector

from lib import add, bar, ico, lathe, mball, rbox, rcyl, sphere, torus

GOLD, DARK, BLACK, WHITE, METAL = 0xffc93c, 0x24242c, 0x15151c, 0xffffff, 0x9aa3ad
HALF = math.pi / 2


# ---------- Disguise props ----------
def props():
    add('prop_box', 'Cardboard', 0xc49a62, lambda bm: (rbox(bm, (0.75, 0.75, 0.6), (0, 0, 0.3), 0.025),
                                                       rbox(bm, (0.37, 0.74, 0.03), (0.19, 0, 0.6), 0.01, rot=(0, -0.06, 0)),
                                                       rbox(bm, (0.37, 0.74, 0.03), (-0.19, 0, 0.6), 0.01, rot=(0, 0.06, 0))))
    add('prop_box', 'Tape', 0xe8d3a8, lambda bm: (rbox(bm, (0.12, 0.77, 0.012), (0, 0, 0.625), 0.0),
                                                  rbox(bm, (0.12, 0.012, 0.18), (0, -0.38, 0.52), 0.0)))
    add('prop_box', 'Label', WHITE, lambda bm: rbox(bm, (0.22, 0.01, 0.15), (0.18, -0.38, 0.32), 0.0))

    add('prop_bin', 'BinGrey', 0x6f7f8c, lambda bm: (rcyl(bm, 0.26, 0.31, 0.8, (0, 0, 0.41), seg=18, bevel=0.015),
                                                     [torus(bm, 0.27 + 0.0125 * k, 0.012, (0, 0, 0.12 + 0.2 * k), seg=18, ring=4) for k in range(3)]))
    add('prop_bin', 'BinLid', 0x56636e, lambda bm: rcyl(bm, 0.335, 0.32, 0.07, (0, 0, 0.84), seg=18, bevel=0.02))
    add('prop_bin', 'Dark', DARK, lambda bm: rbox(bm, (0.22, 0.05, 0.05), (0, 0, 0.9), 0.015))
    add('prop_bin', 'Green', 0x4ea84e, lambda bm: rbox(bm, (0.13, 0.01, 0.13), (0, -0.3, 0.5), 0.0, rot=(0.06, 0, math.pi / 4)))

    add('prop_plant', 'Ceramic', 0xc0643f, lambda bm: (lathe(bm, [(0.19, 0.0), (0.24, 0.34), (0.27, 0.36), (0.27, 0.43), (0.24, 0.43)], seg=16),
                                                       rcyl(bm, 0.24, 0.24, 0.02, (0, 0, 0.41), seg=16, bevel=0)))
    add('prop_plant', 'Leaf', 0x4c9a52, lambda bm: (ico(bm, 0.32, (0, 0, 0.82)), ico(bm, 0.22, (-0.15, 0.08, 1.02)), ico(bm, 0.18, (0.05, 0.1, 1.2))))
    add('prop_plant', 'Leaf2', 0x63b86a, lambda bm: (ico(bm, 0.24, (0.16, -0.06, 1.04)), ico(bm, 0.16, (0.12, -0.14, 0.7))))

    add('prop_lamp', 'Dark', 0x333338, lambda bm: rcyl(bm, 0.2, 0.17, 0.05, (0, 0, 0.025), seg=16, bevel=0.01))
    add('prop_lamp', 'Metal', 0x55575e, lambda bm: rcyl(bm, 0.022, 0.022, 1.42, (0, 0, 0.76), seg=8, bevel=0))
    add('prop_lamp', 'Shade', 0xfff1c4, lambda bm: rcyl(bm, 0.3, 0.16, 0.36, (0, 0, 1.56), seg=16, bevel=0.01))
    add('prop_lamp', 'Brass', 0xd9b44a, lambda bm: sphere(bm, 0.035, (0, 0, 1.77), seg=8, rings=6))

    add('prop_basket', 'Wicker', 0xd9c08a, lambda bm: (rcyl(bm, 0.3, 0.36, 0.46, (0, 0, 0.23), seg=16, bevel=0),
                                                       torus(bm, 0.36, 0.025, (0, 0, 0.46), seg=16, ring=4)))
    add('prop_basket', 'Wicker2', 0xb89a62, lambda bm: [torus(bm, 0.305 + 0.055 * t, 0.012, (0, 0, 0.05 + 0.4 * t), seg=16, ring=3) for t in (0.2, 0.45, 0.7)])
    add('prop_basket', 'Cloth1', 0x6aa0e0, ob=mball('BasketCloth1', [{'co': (-0.1, 0.04, 0.48), 'r': 0.17}, {'co': (0.06, 0.12, 0.5), 'r': 0.13}], res=0.03, tris=120), flat=False)
    add('prop_basket', 'Cloth2', 0xe07a7a, ob=mball('BasketCloth2', [{'co': (0.12, -0.06, 0.5), 'r': 0.15},
                                                                     {'a': (0.25, -0.2, 0.45), 'b': (0.38, -0.3, 0.2), 'r': 0.05}], res=0.025, tris=120), flat=False)
    add('prop_basket', 'White', WHITE, ob=mball('BasketCloth3', [{'co': (0.0, -0.14, 0.52), 'r': 0.12}], res=0.03, tris=70), flat=False)

    bear = [{'t': 'ELLIPSOID', 'co': (0, 0, 0.42), 'r': 0.36, 'size': (1, 0.88, 1.05)}, {'co': (0, -0.02, 0.98), 'r': 0.27},
            {'co': (0.2, 0.0, 1.2), 'r': 0.1}, {'co': (-0.2, 0.0, 1.2), 'r': 0.1}]
    for s in (1, -1):
        bear += [{'t': 'ELLIPSOID', 'co': (s * 0.36, -0.1, 0.56), 'r': 0.12, 'size': (0.9, 1.0, 1.4), 'rot': (0, s * 0.5, 0)},
                 {'t': 'ELLIPSOID', 'co': (s * 0.24, -0.24, 0.14), 'r': 0.14, 'size': (1, 1.3, 0.9)}]
    add('prop_teddy', 'Bear', 0xa8743f, ob=mball('Teddy', bear, res=0.03, tris=600), flat=False)
    add('prop_teddy', 'BearLight', 0xe8c9a0, ob=mball('TeddyLight', [{'co': (0, -0.25, 0.92), 'r': 0.11},
                                                                     {'t': 'ELLIPSOID', 'co': (0, -0.24, 0.4), 'r': 0.2, 'size': (1, 0.5, 1.1)}],
                                                      res=0.02, tris=180), flat=False)
    add('prop_teddy', 'Black', BLACK, lambda bm: (sphere(bm, 0.035, (0.09, -0.25, 1.03), seg=8, rings=6), sphere(bm, 0.035, (-0.09, -0.25, 1.03), seg=8, rings=6),
                                                  sphere(bm, 0.04, (0, -0.355, 0.96), scale=(1.3, 1, 0.9), seg=8, rings=6)), flat=False)
    add('prop_teddy', 'Bow', 0xd9465a, ob=mball('TeddyBow', [{'co': (0.1, -0.24, 0.75), 'r': 0.07}, {'co': (-0.1, -0.24, 0.75), 'r': 0.07},
                                                             {'co': (0, -0.27, 0.75), 'r': 0.04}], res=0.015, tris=200), flat=False)


# ---------- Loot ----------
def painting_frame(name, canvas_mat, canvas_col):
    add(name, 'Gold', GOLD, lambda bm: (rbox(bm, (1.1, 0.06, 0.12), (0, 0, 0.365), 0.02), rbox(bm, (1.1, 0.06, 0.12), (0, 0, -0.365), 0.02),
                                        rbox(bm, (0.12, 0.06, 0.85), (0.49, 0, 0), 0.02), rbox(bm, (0.12, 0.06, 0.85), (-0.49, 0, 0), 0.02)))
    add(name, canvas_mat, canvas_col, lambda bm: rbox(bm, (0.9, 0.03, 0.65), (0, -0.005, 0), 0.0))


def art(name, mat, color, shapes):
    """shapes on the canvas face: ('c', x, z, r) disc, ('b', x, z, w, h, angle) block. Canvas face at y = -0.022."""
    def build(bm):
        for s in shapes:
            if s[0] == 'c':
                rcyl(bm, s[3], s[3], 0.01, (s[1], -0.025, s[2]), rot=(HALF, 0, 0), seg=18, bevel=0)
            elif s[0] == 'e':  # ellipse: x, z, half-width, half-height
                sphere(bm, 1.0, (s[1], -0.025, s[2]), scale=(s[3], 0.005, s[4]), seg=20, rings=4)
            else:
                rbox(bm, (s[3], 0.01, s[4]), (s[1], -0.025, s[2]), 0.0, rot=(0, s[5], 0))
    add(name, mat, color, build)


def loot():
    add('loot_watch', 'Gold', GOLD, lambda bm: (torus(bm, 0.1, 0.028, (0, 0, 0.03), seg=20, ring=6), torus(bm, 0.072, 0.012, (0, 0, 0.07), seg=16, ring=4)))
    add('loot_watch', 'White', WHITE, lambda bm: rcyl(bm, 0.07, 0.07, 0.04, (0, 0, 0.05), seg=16, bevel=0.005))
    add('loot_watch', 'Dark', DARK, lambda bm: (rbox(bm, (0.008, 0.05, 0.006), (0, -0.02, 0.073), 0), rbox(bm, (0.035, 0.008, 0.006), (0.015, 0, 0.073), 0)))

    add('loot_ring', 'Gold', GOLD, lambda bm: torus(bm, 0.07, 0.022, (0, 0, 0.092), rot=(HALF, 0, 0), seg=20, ring=6))
    add('loot_ring', 'Gem', 0x9fe8ff, lambda bm: (rcyl(bm, 0.055, 0.0, 0.05, (0, 0, 0.195), seg=8, bevel=0), rcyl(bm, 0.0, 0.055, 0.04, (0, 0, 0.15), seg=8, bevel=0)))

    add('loot_cash', 'Green', 0x5cb85c, lambda bm: [rbox(bm, (0.32, 0.16, 0.022), (0.004 * k, 0.003 * k, 0.012 + 0.024 * k), 0.003) for k in range(4)])
    add('loot_cash', 'Band', 0xf5f1e6, lambda bm: rbox(bm, (0.06, 0.17, 0.104), (0, 0, 0.05), 0.004))

    add('loot_phone', 'Dark', 0x222228, lambda bm: rbox(bm, (0.16, 0.3, 0.025), (0, 0, 0.0125), 0.012))
    add('loot_phone', 'ScreenLit', 0x4aa3ff, lambda bm: rbox(bm, (0.13, 0.25, 0.004), (0, 0, 0.026), 0))

    add('loot_carrot', 'GoldGlow', GOLD, lambda bm: rcyl(bm, 0.09, 0.006, 0.45, (0.03, 0, 0.09), rot=(0, HALF, 0), seg=10, bevel=0.01))
    add('loot_carrot', 'CarrotTop', 0x4ea84e, lambda bm: [rcyl(bm, 0.035, 0.0, 0.22, (-0.28, 0, 0.1 + a * 0.05), rot=(0, -HALF + a * 0.4, a), seg=5, bevel=0) for a in (-1, 0, 1)])

    add('loot_duck', 'Yellow', 0xffd23f, ob=mball('Duck', [{'t': 'ELLIPSOID', 'co': (0, 0.02, 0.1), 'r': 0.12, 'size': (1, 1.3, 0.8)},
                                                           {'co': (0, -0.08, 0.24), 'r': 0.085}, {'co': (0, 0.16, 0.16), 'r': 0.045}],
                                               res=0.012, tris=400), flat=False)
    add('loot_duck', 'Orange', 0xff8c42, lambda bm: sphere(bm, 0.05, (0, -0.17, 0.23), scale=(1, 1.2, 0.45), seg=10, rings=6), flat=False)
    add('loot_duck', 'Black', BLACK, lambda bm: [sphere(bm, 0.016, (s * 0.05, -0.14, 0.27), seg=6, rings=4) for s in (1, -1)], flat=False)

    add('loot_sock', 'Red', 0xe05a5a, ob=mball('Sock', [{'a': (0, 0.16, 0.05), 'b': (0, -0.04, 0.05), 'r': 0.055},
                                                        {'a': (0, -0.04, 0.05), 'b': (0.14, -0.09, 0.045), 'r': 0.055}], res=0.012, tris=300), flat=False)
    add('loot_sock', 'White', WHITE, lambda bm: [torus(bm, 0.058, 0.012, (0, y, 0.05), rot=(HALF, 0, 0), seg=14, ring=4) for y in (0.06, 0.12)], flat=False)

    gum = [{'co': (math.sin(a) * 0.1, -math.cos(a) * 0.1 + 0.05, 0.035), 'r': 0.04} for a in [math.radians(d) for d in range(-70, 71, 20)]]
    add('loot_teeth', 'Gum', 0xf08aa0, ob=mball('Gums', gum, res=0.012, tris=300), flat=False)
    add('loot_teeth', 'White', WHITE, lambda bm: [rbox(bm, (0.032, 0.03, 0.04), (math.sin(a) * 0.1, -math.cos(a) * 0.1 + 0.05, 0.075), 0.008, rot=(0, 0, a))
                                                  for a in [math.radians(d) for d in range(-60, 61, 17)]])

    tilt = Euler((-0.26, 0, 0)).to_matrix()
    hinge = Vector((0, 0.18, 0.03))
    lid, scr = hinge + tilt @ Vector((0, 0, 0.17)), hinge + tilt @ Vector((0, -0.012, 0.17))
    add('loot_laptop', 'Metal', 0xb6bec7, lambda bm: (rbox(bm, (0.5, 0.36, 0.03), (0, 0, 0.015), 0.01), rbox(bm, (0.5, 0.02, 0.34), tuple(lid), 0.01, rot=(-0.26, 0, 0))))
    add('loot_laptop', 'Dark', 0x2a2d33, lambda bm: rbox(bm, (0.44, 0.17, 0.006), (0, -0.03, 0.032), 0))
    add('loot_laptop', 'ScreenLit', 0x4aa3ff, lambda bm: rbox(bm, (0.44, 0.006, 0.28), tuple(scr), 0, rot=(-0.26, 0, 0)))

    add('loot_vase', 'Blue', 0x3d6fd1, lambda bm: lathe(bm, [(0.12, 0.0), (0.2, 0.15), (0.18, 0.33), (0.08, 0.47), (0.08, 0.5), (0.11, 0.56)], seg=18), flat=False)
    add('loot_vase', 'White', WHITE, lambda bm: torus(bm, 0.2, 0.014, (0, 0, 0.15), seg=18, ring=4), flat=False)
    add('loot_vase', 'Gold', GOLD, lambda bm: torus(bm, 0.11, 0.012, (0, 0, 0.56), seg=16, ring=4), flat=False)

    add('loot_console', 'Black', 0x1c1c22, lambda bm: (rbox(bm, (0.36, 0.26, 0.08), (0, 0, 0.04), 0.015),
                                                       rbox(bm, (0.18, 0.1, 0.04), (0.28, -0.14, 0.02), 0.02),
                                                       sphere(bm, 0.035, (0.21, -0.16, 0.025), seg=8, rings=6), sphere(bm, 0.035, (0.35, -0.16, 0.025), seg=8, rings=6)))
    add('loot_console', 'ScreenLit', 0x4aa3ff, lambda bm: rbox(bm, (0.3, 0.006, 0.012), (0, -0.131, 0.05), 0))
    add('loot_console', 'Red', 0xe05a5a, lambda bm: (sphere(bm, 0.012, (0.31, -0.15, 0.045), seg=6, rings=4), sphere(bm, 0.012, (0.25, -0.15, 0.045), seg=6, rings=4)))

    add('loot_trophy', 'Wood', 0x6e4a32, lambda bm: rbox(bm, (0.2, 0.2, 0.08), (0, 0, 0.04), 0.012))
    add('loot_trophy', 'Gold', GOLD, lambda bm: (rcyl(bm, 0.025, 0.025, 0.12, (0, 0, 0.14), seg=8, bevel=0),
                                                 lathe(bm, [(0.03, 0.2), (0.1, 0.24), (0.13, 0.36), (0.12, 0.36)], seg=16),
                                                 [torus(bm, 0.045, 0.01, (s * 0.13, 0, 0.3), rot=(HALF, 0, 0), seg=10, ring=4) for s in (1, -1)],
                                                 rbox(bm, (0.12, 0.01, 0.04), (0, -0.101, 0.04), 0)))
    add('loot_trophy', 'Ball', 0x2a2a55, lambda bm: sphere(bm, 0.085, (0, 0, 0.43), seg=14, rings=10), flat=False)

    add('loot_clock', 'Wood', 0x8a5a3c, lambda bm: rbox(bm, (0.3, 0.14, 0.34), (0, 0, 0.17), 0.01))
    add('loot_clock', 'Roof', 0x5a3a24, lambda bm: (rbox(bm, (0.22, 0.2, 0.03), (0.08, 0, 0.385), 0.006, rot=(0, 0.6, 0)), rbox(bm, (0.22, 0.2, 0.03), (-0.08, 0, 0.385), 0.006, rot=(0, -0.6, 0))))
    add('loot_clock', 'White', WHITE, lambda bm: rcyl(bm, 0.075, 0.075, 0.02, (0, -0.075, 0.17), rot=(HALF, 0, 0), seg=16, bevel=0.004))
    add('loot_clock', 'Yellow', 0xffd23f, lambda bm: sphere(bm, 0.03, (0, -0.08, 0.3), seg=8, rings=6), flat=False)

    add('loot_goldbar', 'GoldGlow', GOLD, lambda bm: (bar(bm, (0.3, 0.14, 0.1), (-0.08, -0.05, 0.05)), bar(bm, (0.3, 0.14, 0.1), (0.08, -0.12, 0.05)),
                                                      bar(bm, (0.3, 0.14, 0.1), (0, -0.08, 0.15))))

    add('loot_cake', 'Pink', 0xf2a7c3, lambda bm: rcyl(bm, 0.24, 0.24, 0.18, (0, 0, 0.09), seg=20, bevel=0.01))
    add('loot_cake', 'Cream', 0xfffaf0, lambda bm: (rcyl(bm, 0.25, 0.25, 0.045, (0, 0, 0.2), seg=20, bevel=0.015),
                                                    [sphere(bm, 0.03, (math.cos(a) * 0.245, math.sin(a) * 0.245, 0.17), scale=(1, 1, 1.6), seg=5, rings=3) for a in [k * math.pi / 4 for k in range(8)]]), flat=False)
    add('loot_cake', 'Red', 0xe03a4a, lambda bm: [sphere(bm, 0.03, (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.245), seg=6, rings=4) for a in [k * math.pi / 3 for k in range(6)]], flat=False)
    add('loot_cake', 'Blue', 0x6ab0ff, lambda bm: rcyl(bm, 0.015, 0.015, 0.12, (0, 0, 0.28), seg=6, bevel=0))
    add('loot_cake', 'Flame', 0xffb347, lambda bm: sphere(bm, 0.022, (0, 0, 0.36), scale=(1, 1, 1.6), seg=8, rings=6), flat=False)

    painting_frame('loot_painting', 'Sky', 0xbfe3f5)
    art('loot_painting', 'Green', 0x5aa85a, [('e', -0.2, -0.28, 0.32, 0.13), ('e', 0.24, -0.3, 0.3, 0.1)])
    art('loot_painting', 'Yellow', 0xffd23f, [('c', 0.28, 0.17, 0.09)])
    painting_frame('loot_painting2', 'Cream', 0xf6ecd2)
    art('loot_painting2', 'Orange', 0xff8c42, [('b', 0.02, -0.04, 0.12, 0.42, 0.25), ('b', 0.0, -0.22, 0.06, 0.12, 0.25)])
    art('loot_painting2', 'Green', 0x4ea84e, [('b', -0.04, 0.22, 0.04, 0.14, -0.2), ('b', 0.04, 0.22, 0.04, 0.14, 0.4), ('b', 0.0, 0.24, 0.04, 0.16, 0.1)])
    painting_frame('loot_painting3', 'Canvas', 0x2d3a5a)
    art('loot_painting3', 'Red', 0xe05a5a, [('b', -0.2, 0.1, 0.28, 0.28, 0.0), ('c', 0.22, -0.14, 0.14)])
    art('loot_painting3', 'Yellow', 0xffd23f, [('b', 0.15, 0.17, 0.2, 0.08, 0.3), ('c', -0.18, -0.18, 0.08)])

    add('loot_tv', 'Black', 0x18181c, lambda bm: (rbox(bm, (1.25, 0.08, 0.72), (0, 0, 0.45), 0.02), rbox(bm, (0.08, 0.05, 0.12), (0, 0.01, 0.06), 0.01),
                                                  rbox(bm, (0.42, 0.22, 0.03), (0, 0.01, 0.015), 0.01)))
    add('loot_tv', 'Screen', 0x24345a, lambda bm: rbox(bm, (1.15, 0.01, 0.62), (0, -0.041, 0.45), 0))
    add('loot_tv', 'Red', 0xe05a5a, lambda bm: sphere(bm, 0.01, (0.55, -0.045, 0.12), seg=6, rings=4))

    lean = Euler((-0.2, 0, 0)).to_matrix()
    P = lambda x, y, z: tuple(lean @ Vector((x, y, z)))  # noqa: E731
    add('loot_guitar', 'Red', 0xd9363e, ob=mball('Guitar', [{'t': 'ELLIPSOID', 'co': P(0, 0, 0.36), 'r': 0.2, 'size': (1, 0.3, 1), 'rot': (-0.2, 0, 0)},
                                                            {'t': 'ELLIPSOID', 'co': P(0, 0, 0.62), 'r': 0.15, 'size': (1, 0.3, 1), 'rot': (-0.2, 0, 0)}],
                                                res=0.02, tris=400), flat=False)
    add('loot_guitar', 'Wood', 0x6e4a32, lambda bm: rbox(bm, (0.07, 0.04, 0.6), P(0, -0.01, 1.0), 0.01, rot=(-0.2, 0, 0)))
    add('loot_guitar', 'Dark', 0x1c1c1c, lambda bm: (rbox(bm, (0.11, 0.045, 0.16), P(0, -0.01, 1.37), 0.015, rot=(-0.2, 0, 0)),
                                                     rbox(bm, (0.14, 0.02, 0.035), P(0, -0.065, 0.42), 0.005, rot=(-0.2, 0, 0)),
                                                     rbox(bm, (0.14, 0.02, 0.035), P(0, -0.065, 0.52), 0.005, rot=(-0.2, 0, 0)),
                                                     rbox(bm, (0.34, 0.24, 0.03), (0, 0.04, 0.015), 0.01),
                                                     rbox(bm, (0.26, 0.08, 0.05), P(0, 0.0, 0.14), 0.01, rot=(-0.2, 0, 0))))
    add('loot_guitar', 'White', WHITE, lambda bm: sphere(bm, 1.0, P(0.07, -0.065, 0.33), scale=(0.08, 0.008, 0.09), rot=(-0.2, 0, 0), seg=12, rings=4), flat=False)


# ---------- Yard ----------
def yard():
    add('tree', 'Bark', 0x5b3b25, lambda bm: (rcyl(bm, 0.3, 0.16, 1.9, (0, 0, 0.95), seg=8, bevel=0.02),
                                              rcyl(bm, 0.09, 0.05, 0.7, (0.25, 0, 1.45), rot=(0, 0.8, 0), seg=6, bevel=0)))
    add('tree', 'Foliage', 0x3c7d46, lambda bm: (ico(bm, 1.05, (0, 0, 2.35)), ico(bm, 0.75, (0.65, 0.15, 2.0)), ico(bm, 0.7, (-0.6, -0.2, 2.1)),
                                                 ico(bm, 0.62, (0.1, -0.1, 2.95))))
    add('bush', 'Foliage', 0x3a7a44, lambda bm: (ico(bm, 0.55, (0, 0, 0.42), scale=(1, 1, 0.8)), ico(bm, 0.42, (0.42, 0.1, 0.32)), ico(bm, 0.4, (-0.4, -0.12, 0.3))))
    add('bush', 'Flower', 0xf2a7c3, lambda bm: [sphere(bm, 0.05, p, seg=6, rings=4) for p in ((0.2, -0.45, 0.55), (-0.3, -0.42, 0.45), (0.5, -0.25, 0.5), (0.0, -0.3, 0.8))])

    add('burrow', 'Dirt', 0x6b4a2e, ob=mball('Mound', [{'t': 'ELLIPSOID', 'co': (0, 0.15, -0.05), 'r': 0.95, 'size': (1.35, 1.1, 0.45)},
                                                       {'co': (0.5, -0.5, 0.05), 'r': 0.3}, {'co': (-0.5, -0.5, 0.05), 'r': 0.3},
                                                       {'co': (0, -0.6, 0.32), 'r': 0.36, 'neg': True}],  # the pit
                                       res=0.05, tris=700), flat=False)
    add('burrow', 'Hole', 0x120c08, lambda bm: sphere(bm, 1.0, (0, -0.5, 0.06), scale=(0.34, 0.3, 0.16), seg=16, rings=6), flat=False)
    add('burrow', 'Carrot', 0xff8c42, lambda bm: [rcyl(bm, 0.07, 0.0, 0.32, (math.cos(a) * 1.55, math.sin(a) * 1.35 + 0.1, 0.06), rot=(math.pi, 0, 0), seg=7, bevel=0)
                                                  for a in [-0.2 - k * 0.55 for k in range(6)]])
    add('burrow', 'CarrotTop', 0x4ea84e, lambda bm: [rcyl(bm, 0.07, 0.0, 0.24, (math.cos(a) * 1.55, math.sin(a) * 1.35 + 0.1, 0.32), seg=5, bevel=0)
                                                     for a in [-0.2 - k * 0.55 for k in range(6)]])
    add('burrow', 'Post', 0x8a6a48, lambda bm: rcyl(bm, 0.045, 0.04, 1.25, (-1.25, 0.55, 0.62), seg=6, bevel=0.01))
    add('burrow', 'Plank', 0xd8b98a, lambda bm: rbox(bm, (0.8, 0.05, 0.32), (-1.25, 0.5, 1.12), 0.02, rot=(0, 0.06, 0.15)))

    add('slipper', 'Slipper', 0xf3e6c8, ob=mball('SlipperBody', [{'t': 'ELLIPSOID', 'co': (0, 0, 0.04), 'r': 0.1, 'size': (0.9, 1.6, 0.45)}], res=0.015, tris=200), flat=False)
    add('slipper', 'Pompom', 0xf2a7b5, ob=mball('SlipperPom', [{'co': (0, -0.12, 0.08), 'r': 0.045}], res=0.012, tris=80), flat=False)


def build():
    props()
    loot()
    yard()
