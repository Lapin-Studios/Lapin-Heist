"""Builds every Lapin Heist object model in Blender, exports them for the game and renders previews.

Run:  blender --background --factory-startup --python blender/objects.py -- <project folder>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import lib  # noqa: E402
import obj_furniture  # noqa: E402
import obj_items  # noqa: E402

ROOT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.dirname(os.path.dirname(__file__))

lib.reset_scene()
lib.MODELS.clear()
lib.calibrate()
obj_furniture.build()
obj_items.build()
info = lib.export_objects(os.path.join(ROOT, 'src', 'js', '01c_object_data.js'))


def layout(names, cols, spacing, scale=1.0):
    for n, name in enumerate(names):
        x, y = (n % cols) * spacing, (n // cols) * spacing
        for P in lib.MODELS[name]:
            P['ob'].location = (x, y, 0)
            P['ob'].scale = (scale, scale, scale)
            P['ob'].hide_render = False
    rows = (len(names) + cols - 1) // cols
    return ((cols - 1) * spacing / 2, (rows - 1) * spacing / 2, max(cols * spacing / 0.9, rows * spacing / 0.5) * 1.1)


def render(names, cols, spacing, scale, path):
    for parts in lib.MODELS.values():
        for P in parts:
            P['ob'].hide_render = True
    cx, cy, dist = layout(names, cols, spacing, scale)
    cam = bpy.context.scene.camera
    cam.location = (cx, cy - dist * 0.64, dist * 0.77)
    cam.rotation_euler = (lib.Vector((cx, cy, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


scene = bpy.context.scene
world = bpy.data.worlds.new('World')
world.color = (0.05, 0.06, 0.12)
scene.world = world
scene.render.engine = 'BLENDER_WORKBENCH'
sh = scene.display.shading
sh.light, sh.color_type, sh.show_object_outline, sh.show_shadows = 'STUDIO', 'MATERIAL', True, True
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
lib.link(cam)
cam.data.lens = 40
scene.camera = cam
scene.render.resolution_x, scene.render.resolution_y = 1800, 1100

furniture = [f.__name__ for f in obj_furniture.ALL]
items = [n for n in lib.MODELS if n.startswith('prop_')] + ['tree', 'bush', 'burrow', 'slipper']
loot = [n for n in lib.MODELS if n.startswith('loot_')]
render(furniture, 6, 3.0, 1.0, os.path.join(ROOT, 'blender', 'preview_furniture.png'))
render(items, 5, 3.6, 1.0, os.path.join(ROOT, 'blender', 'preview_props.png'))
render(loot, 7, 1.6, 1.0, os.path.join(ROOT, 'blender', 'preview_loot.png'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender', 'lapin_objects.blend'))
print('RESULT', info, math.pi > 3)
