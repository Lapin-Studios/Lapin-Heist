"""Builds the Lapin Heist bunny and family in Blender, exports them for the game, renders a preview.

Run:  blender --background --factory-startup --python blender/characters.py -- <project folder>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import lib  # noqa: E402
from lib import bm_obj, cube, cylinder, mball, part, sphere, torus  # noqa: E402

ROOT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.dirname(os.path.dirname(__file__))

FUR, PINK, INK, SACK, WHITE = 0xf4f0e8, 0xf2a7b5, 0x22222e, 0x9b7448, 0xffffff


def bunny():
    B = 'bunny'
    part(mball('BunnyBody', [
        {'t': 'ELLIPSOID', 'co': (0, 0.03, 0.29), 'r': 0.27, 'size': (1, 1.18, 1)},      # round tummy
        {'t': 'ELLIPSOID', 'co': (0, -0.17, 0.62), 'r': 0.24, 'size': (1.05, 1, 0.95)},  # big head
        {'co': (0.12, -0.3, 0.55), 'r': 0.11}, {'co': (-0.12, -0.3, 0.55), 'r': 0.11},   # chubby cheeks
        {'t': 'ELLIPSOID', 'co': (0.17, 0.1, 0.16), 'r': 0.15, 'size': (0.8, 1.3, 0.85)},  # haunches
        {'t': 'ELLIPSOID', 'co': (-0.17, 0.1, 0.16), 'r': 0.15, 'size': (0.8, 1.3, 0.85)},
        {'t': 'ELLIPSOID', 'co': (0.17, -0.06, 0.035), 'r': 0.08, 'size': (0.9, 2.0, 0.5)},  # long back feet
        {'t': 'ELLIPSOID', 'co': (-0.17, -0.06, 0.035), 'r': 0.08, 'size': (0.9, 2.0, 0.5)},
        {'t': 'ELLIPSOID', 'co': (0.1, -0.27, 0.06), 'r': 0.07, 'size': (1, 1.4, 0.75)},   # front paws
        {'t': 'ELLIPSOID', 'co': (-0.1, -0.27, 0.06), 'r': 0.07, 'size': (1, 1.4, 0.75)},
    ], res=0.022, tris=1200), B, 'body', 'Fur', FUR, 'body')
    part(mball('BunnyTail', [{'co': (0, 0.34, 0.3), 'r': 0.085}, {'co': (0.05, 0.36, 0.34), 'r': 0.06},
                             {'co': (-0.05, 0.37, 0.33), 'r': 0.06}, {'co': (0, 0.38, 0.37), 'r': 0.055}],
               res=0.015, tris=300), B, 'tail', 'Fur', FUR, 'body')
    for s, side in ((1, 'L'), (-1, 'R')):
        piv = (s * 0.1, -0.12, 0.8)
        part(mball('BunnyEar' + side, [{'t': 'ELLIPSOID', 'co': (piv[0], piv[1], 0.97), 'r': 0.075, 'size': (1, 0.5, 2.7)},
                                       {'co': (piv[0], piv[1], 0.81), 'r': 0.06}], res=0.015, tris=300),
             B, 'ear' + side, 'Fur', FUR, 'ear' + side, piv)
        part(mball('BunnyEarIn' + side, [{'t': 'ELLIPSOID', 'co': (piv[0], piv[1] - 0.026, 0.98), 'r': 0.05, 'size': (1, 0.35, 2.9)}],
                   res=0.012, tris=150), B, 'earIn' + side, 'Pink', PINK, 'ear' + side, piv)
    # burglar mask band, eyes on top of it
    part(bm_obj('BunnyMask', lambda bm: torus(bm, 0.236, 0.045, (0, -0.17, 0.665), scale=(1.06, 1.0, 1.25))),
         B, 'mask', 'Mask', INK, 'body')

    def eyes(bm, r, dist, lift=0.0):
        for s in (1, -1):
            a = s * 0.42
            sphere(bm, r, (math.sin(a) * dist, -0.17 - math.cos(a) * dist, 0.67 + lift), scale=(1, 0.75, 1.1), seg=12, rings=8)

    part(bm_obj('BunnyEyes', lambda bm: (eyes(bm, 0.06, 0.245), eyes(bm, 0.013, 0.31, 0.03))), B, 'eyes', 'EyeWhite', WHITE, 'body')
    part(bm_obj('BunnyPupils', lambda bm: eyes(bm, 0.038, 0.285)), B, 'pupils', 'Pupil', 0x15151c, 'body')
    part(bm_obj('BunnyNose', lambda bm: sphere(bm, 0.036, (0, -0.425, 0.6), scale=(1.3, 0.8, 0.9), seg=10, rings=6)),
         B, 'nose', 'Pink', PINK, 'body')
    part(bm_obj('BunnyTeeth', lambda bm: (cube(bm, (0.03, 0.014, 0.045), (0.017, -0.405, 0.515)),
                                          cube(bm, (0.03, 0.014, 0.045), (-0.017, -0.405, 0.515))), smooth=False),
         B, 'teeth', 'EyeWhite', WHITE, 'body', flat=True)
    part(mball('BunnySack', [{'t': 'ELLIPSOID', 'co': (0, 0.32, 0.5), 'r': 0.2, 'size': (1, 0.85, 1.05)},
                             {'co': (0, 0.3, 0.71), 'r': 0.05}, {'co': (0.03, 0.29, 0.77), 'r': 0.035}],
               res=0.02, tris=500), B, 'sack', 'Sack', SACK, 'body')


def human():
    H = 'human'
    part(mball('HumanHead', [
        {'t': 'ELLIPSOID', 'co': (0, 0, 1.74), 'r': 0.25, 'size': (1, 0.95, 1.05)},
        {'co': (0, -0.06, 1.63), 'r': 0.15},                               # chin
        {'co': (0.245, 0.01, 1.72), 'r': 0.055}, {'co': (-0.245, 0.01, 1.72), 'r': 0.055},  # ears
        {'co': (0, -0.245, 1.7), 'r': 0.048},                             # nose
        {'a': (0, 0, 1.42), 'b': (0, 0, 1.56), 'r': 0.075},               # neck
    ], res=0.022, tris=700), H, 'head', 'Skin', 0xf0c7a0)
    part(bm_obj('HumanEyes', lambda bm: [sphere(bm, 0.032, (s * 0.085, -0.228, 1.77), scale=(1, 0.6, 1.35), seg=10, rings=6) for s in (1, -1)]),
         H, 'eyes', 'Pupil', 0x1a1a22)
    part(mball('HumanBrows', [{'a': (s * 0.05, -0.24, 1.855), 'b': (s * 0.12, -0.225, 1.85), 'r': 0.017} for s in (1, -1)],
               res=0.008, tris=120), H, 'brows', 'Hair', 0x5a3a22)
    part(bm_obj('HumanBlush', lambda bm: [sphere(bm, 0.04, (s * 0.15, -0.2, 1.685), scale=(1, 0.4, 0.7), seg=10, rings=6) for s in (1, -1)]),
         H, 'blush', 'Blush', 0xf2a0a0)
    part(mball('HumanTorso', [
        {'t': 'ELLIPSOID', 'co': (0, 0, 1.23), 'r': 0.28, 'size': (1.1, 0.75, 1.0)},
        {'t': 'ELLIPSOID', 'co': (0, -0.02, 1.03), 'r': 0.27, 'size': (1, 0.82, 0.8)},
        {'co': (0.25, 0, 1.4), 'r': 0.12}, {'co': (-0.25, 0, 1.4), 'r': 0.12},
    ], res=0.025, tris=600), H, 'torso', 'Shirt', 0x4f7cc9)
    part(mball('HumanHips', [{'t': 'ELLIPSOID', 'co': (0, 0, 0.9), 'r': 0.23, 'size': (1, 0.78, 0.55)}], res=0.025, tris=300),
         H, 'hips', 'Pants', 0x2c3e66)
    part(bm_obj('HumanCollar', lambda bm: torus(bm, 0.13, 0.035, (0, -0.01, 1.47), scale=(1.1, 0.9, 1))), H, 'collar', 'White', WHITE)
    part(bm_obj('HumanButtons', lambda bm: [sphere(bm, 0.022, (0, -0.228, z), seg=8, rings=5) for z in (1.33, 1.2, 1.07)]),
         H, 'buttons', 'White', WHITE)
    for s, side in ((1, 'L'), (-1, 'R')):
        hip = (s * 0.12, 0, 0.86)
        part(mball('HumanLeg' + side, [{'a': (s * 0.12, 0, 0.84), 'b': (s * 0.12, 0, 0.15), 'r': 0.085}], res=0.02, tris=220),
             H, 'leg' + side, 'Pants', 0x2c3e66, 'leg' + side, hip)
        part(mball('HumanSlipper' + side, [{'t': 'ELLIPSOID', 'co': (s * 0.12, -0.05, 0.06), 'r': 0.1, 'size': (1, 1.7, 0.6)},
                                            {'co': (s * 0.12, -0.2, 0.11), 'r': 0.04}], res=0.015, tris=260),
             H, 'slipper' + side, 'Slipper', 0xf3e6c8, 'leg' + side, hip)
        sh = (s * 0.33, 0, 1.43)
        part(mball('HumanArm' + side, [{'a': (s * 0.31, 0, 1.4), 'b': (s * 0.36, 0, 0.99), 'r': 0.075}], res=0.02, tris=220),
             H, 'arm' + side, 'Shirt', 0x4f7cc9, 'arm' + side, sh)
        part(mball('HumanHand' + side, [{'co': (s * 0.365, -0.01, 0.92), 'r': 0.075}], res=0.015, tris=160),
             H, 'hand' + side, 'Skin', 0xf0c7a0, 'arm' + side, sh)

    top = {'t': 'ELLIPSOID', 'co': (0, 0.05, 1.84), 'r': 0.255, 'size': (1.04, 1.0, 0.75)}
    part(mball('HairShort', [top, {'co': (0, -0.13, 1.96), 'r': 0.08}, {'co': (0.09, -0.11, 1.95), 'r': 0.07},
                             {'co': (-0.08, -0.12, 1.95), 'r': 0.065}], res=0.02, tris=400), H, 'hairShort', 'Hair', 0x5a3a22, style='short')
    part(mball('HairLong', [top, {'t': 'ELLIPSOID', 'co': (0, 0.12, 1.57), 'r': 0.22, 'size': (1.1, 0.6, 1.4)},
                            {'t': 'ELLIPSOID', 'co': (0.22, -0.03, 1.62), 'r': 0.09, 'size': (0.6, 0.8, 1.8)},
                            {'t': 'ELLIPSOID', 'co': (-0.22, -0.03, 1.62), 'r': 0.09, 'size': (0.6, 0.8, 1.8)}],
               res=0.02, tris=500), H, 'hairLong', 'Hair', 0x2a1a12, style='long')
    part(mball('HairBun', [top, {'co': (0, 0.17, 2.0), 'r': 0.1}], res=0.02, tris=400), H, 'hairBun', 'Hair', 0xe4e4e4, style='bun')
    part(bm_obj('Glasses', lambda bm: ([torus(bm, 0.055, 0.011, (s * 0.085, -0.255, 1.775), rot=(math.pi / 2, 0, 0), seg=18, ring=6) for s in (1, -1)],
                                       cylinder(bm, 0.008, 0.008, 0.06, (0, -0.258, 1.785), rot=(0, math.pi / 2, 0), seg=6))),
         H, 'glasses', 'Glass', 0x333344, style='bun')
    part(mball('Cap', [{'t': 'ELLIPSOID', 'co': (0, 0.03, 1.86), 'r': 0.262, 'size': (1.03, 1.03, 0.62)},
                       {'t': 'ELLIPSOID', 'co': (0, -0.26, 1.86), 'r': 0.15, 'size': (1, 1.05, 0.14)},
                       {'co': (0, 0.03, 2.03), 'r': 0.03}], res=0.015, tris=500), H, 'cap', 'Cap', 0xd94a3a, style='cap')
    part(mball('HairCap', [{'co': (0, 0.2, 1.72), 'r': 0.1}, {'co': (0.12, 0.17, 1.74), 'r': 0.07}, {'co': (-0.12, 0.17, 1.74), 'r': 0.07}],
               res=0.02, tris=200), H, 'hairCap', 'Hair', 0x1c1c1c, style='cap')
    afro = [{'t': 'ELLIPSOID', 'co': (0, 0.1, 2.0), 'r': 0.34, 'size': (1, 1, 0.75)}]
    for i in range(8):
        a = i / 8 * math.pi * 2
        afro.append({'co': (math.cos(a) * 0.27, 0.1 + math.sin(a) * 0.25, 2.0 + (0.08 if i % 2 else -0.02)), 'r': 0.13})
    part(mball('HairAfro', afro, res=0.025, tris=600), H, 'hairAfro', 'Hair', 0x111111, style='afro')
    fringe = [{'co': (math.sin(t) * 0.245, math.cos(t) * 0.245, 1.73), 'r': 0.065} for t in [math.radians(d) for d in range(-110, 111, 22)]]
    fringe += [{'t': 'ELLIPSOID', 'co': (s * 0.05, -0.255, 1.655), 'r': 0.045, 'size': (1.5, 0.6, 0.7)} for s in (1, -1)]  # mustache
    part(mball('HairBald', fringe, res=0.015, tris=500), H, 'hairBald', 'Hair', 0x8a5a2b, style='bald')


PEOPLE = [  # same as the game's PEOPLE list, for the preview render only
    ('Dad', 0x4f7cc9, 0x2c3e66, 0xf0c7a0, 0x5a3a22, 'short'), ('Mom', 0xd96a8a, 0x7a3550, 0xe8b48f, 0x2a1a12, 'long'),
    ('Grandma', 0x9a7fc7, 0x5b4a80, 0xf2d0b5, 0xe4e4e4, 'bun'), ('Teen', 0x58b368, 0x333344, 0xc98e66, 0x1c1c1c, 'cap'),
    ('Uncle Bob', 0xe0a23a, 0x6b4b2a, 0xd9a07a, 0x8a5a2b, 'bald'), ('Aunt Lou', 0x3fb3b0, 0x235e6b, 0x8d5a3c, 0x111111, 'afro'),
]


def preview(path):
    scene = bpy.context.scene
    for P in lib.PARTS:
        P['ob'].hide_render = P['char'] == 'human'
        if P['char'] == 'bunny':
            P['ob'].location.x = -1.1
    for n, (name, shirt, pants, skin, hair, style) in enumerate(PEOPLE):
        cols = {'Shirt': shirt, 'Pants': pants, 'Skin': skin, 'Hair': hair}
        for P in lib.PARTS:
            if P['char'] != 'human' or (P['style'] and P['style'] != style):
                continue
            ob = bpy.data.objects.new(f'{name}_{P["key"]}', P['ob'].data)
            ob.location.x = n * 0.85
            lib.link(ob)
            if P['mat'] in cols:
                ob.material_slots[0].link = 'OBJECT'
                ob.material_slots[0].material = lib.material(f'{name}_{P["mat"]}', cols[P['mat']])
    world = bpy.data.worlds.new('World')
    world.color = (0.05, 0.06, 0.12)
    scene.world = world
    scene.render.engine = 'BLENDER_WORKBENCH'
    sh = scene.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'MATERIAL'
    sh.show_object_outline = True
    sh.show_shadows = True
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
    lib.link(cam)
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1600, 640
    # front lineup, then roughly the game's high camera angle
    for suffix, loc, target, lens in (('', (1.55, -8.4, 2.4), (1.55, 0, 1.1), 35), ('_top', (1.55, -4.6, 7.4), (1.55, 0, 0.6), 35)):
        cam.location = loc
        cam.rotation_euler = (lib.Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        scene.render.filepath = path.replace('.png', suffix + '.png')
        bpy.ops.render.render(write_still=True)


lib.reset_scene()
k = lib.calibrate()
bunny()
human()
info = {'K': round(k, 3), 'bunny': lib.bounds('bunny'), 'human': lib.bounds('human')}
info['export'] = lib.export(os.path.join(ROOT, 'src', 'js', '01b_char_data.js'))
preview(os.path.join(ROOT, 'blender', 'preview.png'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender', 'lapin_characters.blend'))
print('RESULT', info)
