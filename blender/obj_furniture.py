"""Furniture for Lapin Heist. Blender coords: origin at floor centre, front faces -Y, back (+Y) goes against a wall.
Footprints and tabletop heights match FURN_DIMS in src/js/02c_models_objects.js. Material names are recoloured in-game."""
import math
import random

from lib import add, ico, lathe, rbox, rcyl, sphere  # noqa: F401

WOOD, FABRIC, ACCENT, WHITE, METAL, DARK = 0xa8744a, 0x6a8fd8, 0xe0b65a, 0xf5f1e6, 0x9aa3ad, 0x24242c
BRASS, PORC, APPL = 0xd9b44a, 0xffffff, 0xeef1f4


def legs4(bm, xs, ys, h, r=0.04, taper=0.8):
    for x in xs:
        for y in ys:
            rcyl(bm, r * taper, r, h, (x, y, h / 2), seg=6, bevel=0)


def bed():
    add('bed', 'Wood', WOOD, lambda bm: (rbox(bm, (1.9, 2.3, 0.3), (0, 0, 0.17), 0.03),
                                         rbox(bm, (1.9, 0.12, 0.95), (0, 1.09, 0.5), 0.05),
                                         rbox(bm, (1.9, 0.08, 0.45), (0, -1.11, 0.25), 0.035)))
    add('bed', 'Sheet', WHITE, lambda bm: (rbox(bm, (1.8, 2.15, 0.24), (0, 0.03, 0.44), 0.07, 3),
                                           rbox(bm, (1.86, 0.2, 0.12), (0, 0.3, 0.6), 0.05, 3)), flat=False)
    add('bed', 'Fabric', FABRIC, lambda bm: rbox(bm, (1.86, 1.5, 0.1), (0, -0.4, 0.59), 0.045, 3), flat=False)
    add('bed', 'Pillow', PORC, lambda bm: [rbox(bm, (0.62, 0.36, 0.15), (s * 0.43, 0.82, 0.63), 0.07, 3) for s in (1, -1)], flat=False)


def kidbed():
    add('kidbed', 'Frame', WHITE, lambda bm: (rbox(bm, (1.1, 1.9, 0.28), (0, 0, 0.16), 0.03),
                                              rbox(bm, (1.1, 0.1, 0.72), (0, 0.9, 0.38), 0.05),
                                              rbox(bm, (1.1, 0.08, 0.42), (0, -0.91, 0.23), 0.04)))
    add('kidbed', 'Sheet', WHITE, lambda bm: rbox(bm, (1.04, 1.78, 0.18), (0, 0.02, 0.36), 0.06, 3), flat=False)
    add('kidbed', 'Fabric', FABRIC, lambda bm: rbox(bm, (1.06, 1.2, 0.08), (0, -0.32, 0.46), 0.035, 3), flat=False)
    add('kidbed', 'Pillow', PORC, lambda bm: rbox(bm, (0.6, 0.3, 0.12), (0, 0.66, 0.49), 0.05, 3), flat=False)
    add('kidbed', 'Accent', 0xffd23f, lambda bm: (sphere(bm, 0.1, (0.32, 0.55, 0.56)), sphere(bm, 0.07, (0.32, 0.5, 0.7))), flat=False)


def couch():
    add('couch', 'Fabric', FABRIC, lambda bm: (rbox(bm, (2.2, 0.9, 0.38), (0, 0, 0.26), 0.05),
                                               rbox(bm, (2.0, 0.26, 0.52), (0, 0.32, 0.66), 0.09, 3),
                                               rbox(bm, (0.24, 0.9, 0.62), (0.98, 0, 0.38), 0.09, 3),
                                               rbox(bm, (0.24, 0.9, 0.62), (-0.98, 0, 0.38), 0.09, 3),
                                               rbox(bm, (0.94, 0.64, 0.16), (0.48, -0.08, 0.52), 0.06, 3),
                                               rbox(bm, (0.94, 0.64, 0.16), (-0.48, -0.08, 0.52), 0.06, 3)), flat=False)
    add('couch', 'Accent', ACCENT, lambda bm: rbox(bm, (0.42, 0.14, 0.38), (0.62, 0.16, 0.74), 0.06, 3, rot=(-0.25, 0, 0.2)), flat=False)
    add('couch', 'Dark', DARK, lambda bm: legs4(bm, (-1.0, 1.0), (-0.36, 0.36), 0.08, 0.035))


def armchair():
    add('armchair', 'Fabric', FABRIC, lambda bm: (rbox(bm, (0.95, 0.85, 0.36), (0, 0, 0.25), 0.05),
                                                  rbox(bm, (0.8, 0.22, 0.52), (0, 0.31, 0.66), 0.08, 3),
                                                  rbox(bm, (0.18, 0.85, 0.56), (0.385, 0, 0.36), 0.07, 3),
                                                  rbox(bm, (0.18, 0.85, 0.56), (-0.385, 0, 0.36), 0.07, 3),
                                                  rbox(bm, (0.6, 0.6, 0.14), (0, -0.06, 0.5), 0.05, 3)), flat=False)
    add('armchair', 'Dark', DARK, lambda bm: legs4(bm, (-0.4, 0.4), (-0.34, 0.34), 0.08, 0.03))


def table_like(name, w, d, h, extra=None):
    def wood(bm):
        rbox(bm, (w, d, 0.07), (0, 0, h - 0.035), 0.02)
        legs4(bm, (-(w / 2 - 0.1), w / 2 - 0.1), (-(d / 2 - 0.1), d / 2 - 0.1), h - 0.07, 0.04)
        if extra:
            extra(bm)
    add(name, 'Wood', WOOD, wood)


def table():
    table_like('table', 1.6, 1.0, 0.78)


def coffeeTable():
    add('coffeeTable', 'Wood', WOOD, lambda bm: (rbox(bm, (1.2, 0.6, 0.06), (0, 0, 0.39), 0.02),
                                                 rbox(bm, (1.04, 0.46, 0.03), (0, 0, 0.12), 0.01),
                                                 [rbox(bm, (0.06, 0.06, 0.36), (x, y, 0.18), 0.01) for x in (-0.54, 0.54) for y in (-0.24, 0.24)]))


def diningTable():
    def chairs(bm):
        for x in (-0.6, 0.6):
            for s in (-1, 1):
                rbox(bm, (0.44, 0.42, 0.05), (x, s * 0.82, 0.45), 0.015)
                rbox(bm, (0.44, 0.05, 0.5), (x, s * 1.04, 0.72), 0.02)
                legs4(bm, (x - 0.18, x + 0.18), (s * 0.66, s * 0.98), 0.43, 0.022)
    table_like('diningTable', 2.2, 1.1, 0.78, chairs)


def desk():
    table_like('desk', 1.4, 0.7, 0.78, lambda bm: rbox(bm, (0.45, 0.6, 0.7), (0.42, 0, 0.36), 0.02))
    add('desk', 'Brass', BRASS, lambda bm: [rbox(bm, (0.16, 0.03, 0.03), (0.42, -0.31, z), 0.008) for z in (0.2, 0.42, 0.62)])


def nightstand():
    add('nightstand', 'Wood', WOOD, lambda bm: (rbox(bm, (0.5, 0.45, 0.53), (0, 0, 0.285), 0.025),
                                                rbox(bm, (0.42, 0.03, 0.18), (0, -0.23, 0.38), 0.012)))
    add('nightstand', 'Brass', BRASS, lambda bm: sphere(bm, 0.025, (0, -0.255, 0.38), seg=8, rings=6))


def dresser():
    add('dresser', 'Wood', WOOD, lambda bm: (rbox(bm, (1.3, 0.5, 0.96), (0, 0, 0.51), 0.025),
                                             [rbox(bm, (1.2, 0.03, 0.27), (0, -0.25, z), 0.012) for z in (0.22, 0.52, 0.82)]))
    add('dresser', 'Brass', BRASS, lambda bm: [sphere(bm, 0.025, (x, -0.275, z), seg=8, rings=6) for x in (-0.3, 0.3) for z in (0.22, 0.52, 0.82)])


def wardrobe():
    add('wardrobe', 'Wood', WOOD, lambda bm: (rbox(bm, (1.4, 0.6, 2.02), (0, 0, 1.03), 0.03),
                                              rbox(bm, (0.67, 0.03, 1.86), (0.345, -0.3, 1.05), 0.015),
                                              rbox(bm, (0.67, 0.03, 1.86), (-0.345, -0.3, 1.05), 0.015),
                                              rbox(bm, (1.48, 0.66, 0.07), (0, 0, 2.065), 0.02)))
    add('wardrobe', 'Brass', BRASS, lambda bm: [rbox(bm, (0.03, 0.03, 0.22), (s * 0.05, -0.33, 1.1), 0.01) for s in (1, -1)])


def bookshelf():
    add('bookshelf', 'Wood', WOOD, lambda bm: (rbox(bm, (0.05, 0.4, 2.0), (0.675, 0, 1.0), 0.01),
                                               rbox(bm, (0.05, 0.4, 2.0), (-0.675, 0, 1.0), 0.01),
                                               rbox(bm, (1.32, 0.02, 1.96), (0, 0.19, 1.0), 0.0),
                                               [rbox(bm, (1.32, 0.38, 0.04), (0, 0, z), 0.008) for z in (0.03, 0.5, 1.0, 1.5, 1.98)]))
    rnd = random.Random(7)
    books = {k: [] for k in range(4)}
    for z0 in (0.05, 0.52, 1.02, 1.52):
        x = -0.63
        while x < 0.55:
            w, h = rnd.uniform(0.05, 0.1), rnd.uniform(0.24, 0.4)
            if rnd.random() < 0.85:
                tilt = 0.2 if rnd.random() < 0.08 else 0
                books[rnd.randrange(4)].append(((w, 0.27, h), (x + w / 2, -0.02, z0 + h / 2), (0, tilt, 0)))
            x += w + 0.008
    for k, cols in enumerate((0xd96a6a, 0x5a8ae0, 0x7ac29a, 0xe0b65a)):
        add('bookshelf', f'Book{k + 1}', cols, lambda bm, L=books[k]: [rbox(bm, s, l, 0.0, rot=r) for s, l, r in L])


def tvStand():
    add('tvStand', 'Wood', WOOD, lambda bm: (rbox(bm, (1.7, 0.5, 0.46), (0, 0, 0.27), 0.025),
                                             rbox(bm, (0.5, 0.03, 0.34), (-0.55, -0.25, 0.27), 0.012),
                                             rbox(bm, (0.5, 0.03, 0.34), (0.55, -0.25, 0.27), 0.012)))
    add('tvStand', 'Dark', DARK, lambda bm: (rbox(bm, (0.52, 0.02, 0.34), (0, -0.245, 0.27), 0.0), legs4(bm, (-0.78, 0.78), (-0.2, 0.2), 0.05, 0.025)))


def counter():
    add('counter', 'Cabinet', 0xe8e2d4, lambda bm: (rbox(bm, (2.2, 0.64, 0.82), (0, 0.03, 0.49), 0.015),
                                                    [rbox(bm, (0.7, 0.03, 0.74), (x, -0.3, 0.5), 0.012) for x in (-0.73, 0, 0.73)]))
    add('counter', 'Countertop', 0x5b6470, lambda bm: rbox(bm, (2.26, 0.74, 0.06), (0, 0, 0.93), 0.015))
    add('counter', 'Metal', METAL, lambda bm: [rbox(bm, (0.22, 0.025, 0.025), (x, -0.33, 0.78), 0.008) for x in (-0.73, 0, 0.73)])
    add('counter', 'Dark', DARK, lambda bm: rbox(bm, (2.16, 0.05, 0.08), (0, -0.27, 0.04), 0.0))


def stove():
    add('stove', 'Appliance', APPL, lambda bm: rbox(bm, (0.9, 0.7, 0.88), (0, 0, 0.44), 0.03))
    add('stove', 'Black', 0x1c1c22, lambda bm: (rbox(bm, (0.7, 0.02, 0.38), (0, -0.35, 0.42), 0.02),
                                                rbox(bm, (0.9, 0.7, 0.03), (0, 0, 0.895), 0.01)))
    add('stove', 'Dark', 0x3a3a44, lambda bm: [rcyl(bm, 0.11, 0.11, 0.02, (x, y, 0.92), seg=10, bevel=0) for x in (-0.2, 0.2) for y in (-0.15, 0.15)])
    add('stove', 'Metal', METAL, lambda bm: (rbox(bm, (0.6, 0.03, 0.03), (0, -0.37, 0.67), 0.01),
                                             [rcyl(bm, 0.03, 0.03, 0.03, (x, -0.36, 0.8), rot=(math.pi / 2, 0, 0), seg=6, bevel=0) for x in (-0.3, -0.1, 0.1, 0.3)]))


def fridge():
    add('fridge', 'Appliance', 0xdfe7ee, lambda bm: rbox(bm, (0.9, 0.75, 2.0), (0, 0, 1.0), 0.05))
    add('fridge', 'Dark', 0x8a96a2, lambda bm: rbox(bm, (0.86, 0.01, 0.015), (0, -0.376, 1.4), 0.0))
    add('fridge', 'Metal', METAL, lambda bm: (rbox(bm, (0.04, 0.05, 0.35), (0.34, -0.4, 1.65), 0.012),
                                              rbox(bm, (0.04, 0.05, 0.5), (0.34, -0.4, 1.0), 0.012)))
    add('fridge', 'Magnets', 0xe05a5a, lambda bm: (rbox(bm, (0.08, 0.015, 0.08), (-0.2, -0.38, 1.6), 0.005),
                                                   rbox(bm, (0.06, 0.015, 0.06), (0.05, -0.38, 1.75), 0.005)))
    add('fridge', 'Paper', PORC, lambda bm: rbox(bm, (0.22, 0.008, 0.28), (-0.1, -0.378, 1.15), 0.0, rot=(0, 0.08, 0)))


def bathtub():
    add('bathtub', 'Porcelain', PORC, lambda bm: lathe(bm, [(0.01, 0.08), (0.42, 0.08), (0.46, 0.4), (0.47, 0.6), (0.4, 0.6), (0.38, 0.3), (0.01, 0.3)],
                                                       seg=28, scale=(1.9, 0.95, 1)))
    add('bathtub', 'Water', 0x9fd3f0, lambda bm: sphere(bm, 1.0, (0, 0, 0.52), scale=(0.74, 0.37, 0.012), seg=24, rings=4), flat=False)
    add('bathtub', 'Gold', 0xffc93c, lambda bm: [sphere(bm, 0.05, (x, y, 0.05), seg=8, rings=6) for x in (-0.7, 0.7) for y in (-0.3, 0.3)])
    add('bathtub', 'Metal', METAL, lambda bm: (rcyl(bm, 0.025, 0.025, 0.2, (0.86, 0, 0.68), seg=8), rcyl(bm, 0.02, 0.02, 0.14, (0.8, 0, 0.78), rot=(0, math.pi / 2, 0), seg=8)))


def toilet():
    add('toilet', 'Porcelain', PORC, lambda bm: (rbox(bm, (0.45, 0.22, 0.42), (0, 0.23, 0.59), 0.04),
                                                 rcyl(bm, 0.15, 0.2, 0.38, (0, -0.06, 0.19), seg=18, bevel=0.02),
                                                 rcyl(bm, 0.22, 0.22, 0.04, (0, -0.07, 0.4), seg=18, bevel=0.015)))
    add('toilet', 'Seat', 0xe8e2d4, lambda bm: rcyl(bm, 0.21, 0.21, 0.025, (0, -0.07, 0.435), seg=18, bevel=0.008))
    add('toilet', 'Metal', METAL, lambda bm: rbox(bm, (0.08, 0.03, 0.02), (0.15, 0.11, 0.74), 0.006))


def sink():
    add('sink', 'Cabinet', 0xe8e2d4, lambda bm: (rbox(bm, (0.7, 0.48, 0.8), (0, 0.01, 0.42), 0.02),
                                                 rbox(bm, (0.3, 0.03, 0.6), (0.165, -0.24, 0.42), 0.01),
                                                 rbox(bm, (0.3, 0.03, 0.6), (-0.165, -0.24, 0.42), 0.01)))
    add('sink', 'Porcelain', PORC, lambda bm: rbox(bm, (0.72, 0.5, 0.06), (0, 0, 0.85), 0.02))
    add('sink', 'Water', 0xbfe0f0, lambda bm: rcyl(bm, 0.18, 0.18, 0.012, (0, -0.02, 0.882), seg=18, bevel=0))
    add('sink', 'Metal', METAL, lambda bm: (rcyl(bm, 0.02, 0.02, 0.18, (0, 0.19, 0.97), seg=8), rcyl(bm, 0.016, 0.016, 0.12, (0, 0.13, 1.05), rot=(math.pi / 2, 0, 0), seg=8)))
    add('sink', 'Frame', 0xd8d0c0, lambda bm: rbox(bm, (0.66, 0.025, 0.76), (0, 0.235, 1.55), 0.02))
    add('sink', 'Mirror', 0xcfe8f5, lambda bm: rbox(bm, (0.58, 0.01, 0.68), (0, 0.22, 1.55), 0.0))


def toyChest():
    add('toyChest', 'Red', 0xe05a5a, lambda bm: rbox(bm, (1.0, 0.55, 0.54), (0, 0, 0.28), 0.04))
    add('toyChest', 'Yellow', 0xffd23f, lambda bm: (rbox(bm, (1.04, 0.6, 0.08), (0, 0, 0.59), 0.03),
                                                    rbox(bm, (0.2, 0.02, 0.2), (0, -0.28, 0.3), 0.02, rot=(0, math.pi / 4, 0))))


def pedestal():
    add('pedestal', 'Marble', 0xf0ece4, lambda bm: (rbox(bm, (0.7, 0.7, 0.08), (0, 0, 0.04), 0.015),
                                                    rbox(bm, (0.52, 0.52, 0.9), (0, 0, 0.53), 0.02),
                                                    rbox(bm, (0.7, 0.7, 0.06), (0, 0, 1.0), 0.015)))
    add('pedestal', 'Gold', 0xffc93c, lambda bm: rbox(bm, (0.54, 0.54, 0.03), (0, 0, 0.94), 0.005))


def sideboard():
    add('sideboard', 'Wood', WOOD, lambda bm: (rbox(bm, (1.8, 0.5, 0.74), (0, 0, 0.48), 0.025),
                                               [rbox(bm, (0.56, 0.03, 0.62), (x, -0.25, 0.48), 0.012) for x in (-0.58, 0, 0.58)]))
    add('sideboard', 'Dark', DARK, lambda bm: legs4(bm, (-0.82, 0.82), (-0.2, 0.2), 0.11, 0.03))
    add('sideboard', 'Brass', BRASS, lambda bm: [sphere(bm, 0.022, (x + 0.2, -0.275, 0.55), seg=8, rings=6) for x in (-0.58, 0, 0.58)])


def piano():
    add('piano', 'Piano', 0x1c1c22, lambda bm: (rbox(bm, (1.5, 0.6, 1.2), (0, 0.12, 0.62), 0.03),
                                                rbox(bm, (1.5, 0.32, 0.1), (0, -0.3, 0.74), 0.02),
                                                rbox(bm, (1.54, 0.64, 0.05), (0, 0.12, 1.245), 0.015),
                                                [rbox(bm, (0.08, 0.3, 0.7), (s * 0.71, -0.3, 0.35), 0.02) for s in (1, -1)]))
    add('piano', 'Keys', PORC, lambda bm: rbox(bm, (1.32, 0.18, 0.03), (0, -0.36, 0.8), 0.005))
    add('piano', 'Black', 0x050508, lambda bm: [rbox(bm, (0.035, 0.1, 0.03), (-0.6 + i * 0.13, -0.32, 0.82), 0.004) for i in range(10) if i % 7 not in (2, 6)])
    add('piano', 'Paper', PORC, lambda bm: rbox(bm, (0.5, 0.02, 0.3), (0, -0.16, 1.0), 0.0, rot=(-0.25, 0, 0)))


def workbench():
    table_like('workbench', 2.0, 0.8, 0.9, lambda bm: rbox(bm, (1.8, 0.6, 0.04), (0, 0, 0.25), 0.01))
    add('workbench', 'Pegboard', 0x8f8f7a, lambda bm: rbox(bm, (1.8, 0.04, 0.7), (0, 0.38, 1.4), 0.01))
    add('workbench', 'Metal', METAL, lambda bm: (rbox(bm, (0.16, 0.04, 0.06), (-0.5, 0.34, 1.55), 0.01),
                                                 rbox(bm, (0.04, 0.03, 0.3), (0.2, 0.35, 1.4), 0.01, rot=(0, 0.4, 0)),
                                                 rbox(bm, (0.3, 0.03, 0.05), (0.55, 0.35, 1.5), 0.01)))
    add('workbench', 'Red', 0xd94a3a, lambda bm: rbox(bm, (0.04, 0.03, 0.28), (-0.5, 0.35, 1.4), 0.01))


ALL = [bed, kidbed, couch, armchair, table, coffeeTable, diningTable, desk, nightstand, dresser, wardrobe, bookshelf,
       tvStand, counter, stove, fridge, bathtub, toilet, sink, toyChest, pedestal, sideboard, piano, workbench]


def build():
    for f in ALL:
        f()
