"""Helpers for building Lapin Heist characters in Blender (run in background mode).

Coordinates: Blender meters, Z up, characters face -Y.
Export converts to three.js (Y up, facing +Z): (x, y, z) -> (x, z, -y).
"""
import json
import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

PARTS = []  # dicts: ob, char, key, group, origin, mat, flat, style
K = 1.0     # metaball radius -> surface radius ratio, measured by calibrate()


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    PARTS.clear()


def srgb(hexv):
    c = [((hexv >> s) & 255) / 255 for s in (16, 8, 0)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def material(key, color=0xcccccc):
    m = bpy.data.materials.get(key)
    if not m:
        m = bpy.data.materials.new(key)
        m.diffuse_color = (*srgb(color), 1)
    return m


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def calibrate():
    """Measure how big a radius-1 metaball ball really is at our threshold."""
    global K
    mb = bpy.data.metaballs.new('Probe')
    mb.resolution = 0.05
    mb.threshold = 0.6
    el = mb.elements.new(type='BALL')
    el.radius = 1.0
    ob = link(bpy.data.objects.new('Probe', mb))
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    K = max(v.co.x for v in me.vertices)
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    return K


def mball(name, elems, res=0.025, tris=None):
    """elems: dicts with t (BALL/ELLIPSOID/CAPSULE), co, r (surface radius), size, rot, a/b (capsule ends)."""
    mb = bpy.data.metaballs.new(name)
    mb.resolution = res
    mb.render_resolution = res
    mb.threshold = 0.6
    for e in elems:
        t = e.get('t', 'BALL')
        el = mb.elements.new(type='CAPSULE' if 'a' in e else t)
        el.radius = e['r'] / K
        if 'a' in e:  # capsule between two points
            a, b = Vector(e['a']), Vector(e['b'])
            el.co = (a + b) / 2
            el.size_x = (b - a).length / 2
            el.rotation = Vector((1, 0, 0)).rotation_difference((b - a).normalized())
        else:
            el.co = e['co']
            if 'size' in e:
                el.size_x, el.size_y, el.size_z = e['size']
            if 'rot' in e:
                el.rotation = Euler(e['rot']).to_quaternion()
        if 'stiff' in e:
            el.stiffness = e['stiff']
        if e.get('neg'):
            el.use_negative = True  # carves a dent instead of adding a bump
    ob = link(bpy.data.objects.new(name, mb))
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    mo = link(bpy.data.objects.new(name, me))
    return finish(mo, tris)


def finish(mo, tris):
    n = sum(len(p.vertices) - 2 for p in mo.data.polygons)
    if tris and n > tris:
        mod = mo.modifiers.new('dec', 'DECIMATE')
        mod.ratio = tris / n
        dg = bpy.context.evaluated_depsgraph_get()
        me2 = bpy.data.meshes.new_from_object(mo.evaluated_get(dg))
        mo.modifiers.clear()
        mo.data = me2
    for p in mo.data.polygons:
        p.use_smooth = True
    return mo


def bm_obj(name, build, smooth=True):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    build(bm)
    bm.to_mesh(me)
    bm.free()
    ob = link(bpy.data.objects.new(name, me))
    for p in ob.data.polygons:
        p.use_smooth = smooth
    return ob


def mtx(loc, rot=(0, 0, 0), scale=(1, 1, 1)):
    return Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1))


def sphere(bm, r, loc, scale=(1, 1, 1), seg=14, rings=9, rot=(0, 0, 0)):
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, matrix=mtx(loc, rot, scale))


def cube(bm, size, loc, rot=(0, 0, 0)):
    bmesh.ops.create_cube(bm, size=1.0, matrix=mtx(loc, rot, size))


def cylinder(bm, r1, r2, depth, loc, rot=(0, 0, 0), seg=12):
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=depth, matrix=mtx(loc, rot))


def torus(bm, R, r, loc, rot=(0, 0, 0), scale=(1, 1, 1), seg=28, ring=8):
    M = mtx(loc, rot, scale)
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            p = Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
            row.append(bm.verts.new(M @ p))
        rows.append(row)
    for i in range(seg):
        for j in range(ring):
            n, m = (i + 1) % seg, (j + 1) % ring
            bm.faces.new((rows[i][j], rows[n][j], rows[n][m], rows[i][m]))


def part(ob, char, key, mat, color, group='root', origin=(0, 0, 0), flat=False, style=None):
    ob.data.materials.clear()
    ob.data.materials.append(material(mat, color))
    PARTS.append(dict(ob=ob, char=char, key=key, group=group, origin=Vector(origin), mat=mat, flat=flat, style=style))
    return ob


def export(path):
    out = {}
    stats = {}
    for P in PARTS:
        bm = bmesh.new()
        bm.from_mesh(P['ob'].data)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.verts.index_update()
        o = P['origin']
        pos = []
        for v in bm.verts:
            d = v.co - o
            pos += [round(d.x * 1000), round(d.z * 1000), round(-d.y * 1000)]
        idx = [v.index for f in bm.faces for v in f.verts]
        bm.free()
        rec = {'k': P['key'], 'g': P['group'], 'o': [round(o.x * 1000), round(o.z * 1000), round(-o.y * 1000)],
               'm': P['mat'], 'p': pos, 'i': idx}
        if P['flat']:
            rec['f'] = 1
        if P['style']:
            rec['s'] = P['style']
        out.setdefault(P['char'], []).append(rec)
        stats[P['char']] = stats.get(P['char'], 0) + len(idx) // 3
    js = '// Generated by blender/characters.py. Do not edit by hand.\n'
    js += 'const CHAR_DATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(js)
    return {'bytes': len(js), 'tris': stats}


# ---------- Objects (furniture, props, loot, yard) ----------
MODELS = {}  # model name -> list of dicts: ob, mat, flat


def rbox(bm, size, loc, bevel=0.02, seg=1, rot=(0, 0, 0)):
    """Box with rounded edges. size = full (x, y, z) dimensions."""
    res = bmesh.ops.create_cube(bm, size=1.0, matrix=mtx(loc, rot, size))
    verts = res['verts']
    edges = list({e for v in verts for e in v.link_edges})
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=verts + edges, offset=min(bevel, min(size) * 0.45), offset_type='OFFSET',
                        segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)


def rcyl(bm, r1, r2, depth, loc, rot=(0, 0, 0), seg=16, bevel=0.012):
    """Cylinder/cone with softened cap rims. r1 = bottom radius, r2 = top radius."""
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=depth, matrix=mtx(loc, rot))
    verts = res['verts']
    if bevel > 0:
        caps = [f for f in {f for v in verts for f in v.link_faces} if len(f.verts) > 4]
        edges = list({e for f in caps for e in f.edges})
        bmesh.ops.bevel(bm, geom=edges, offset=bevel, offset_type='OFFSET', segments=2, profile=0.5,
                        affect='EDGES', clamp_overlap=True)


def lathe(bm, profile, loc=(0, 0, 0), seg=16, rot=(0, 0, 0), scale=(1, 1, 1)):
    """Spin a (radius, z) profile around Z. Closes the bottom; open top if last radius > 0."""
    M = mtx(loc, rot, scale)
    rings = []
    for r, z in profile:
        rings.append([bm.verts.new(M @ Vector((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)))
                      for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rings[0])))


def ico(bm, r, loc, subdiv=1, scale=(1, 1, 1)):
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r, matrix=mtx(loc, (0, 0, 0), scale))


def bar(bm, size, loc, taper=0.75):
    """Gold-bar style box whose top face is smaller."""
    res = bmesh.ops.create_cube(bm, size=1.0, matrix=mtx(loc, (0, 0, 0), size))
    for v in res['verts']:
        if v.co.z > loc[2]:
            v.co.x = loc[0] + (v.co.x - loc[0]) * taper
            v.co.y = loc[1] + (v.co.y - loc[1]) * taper


def add(model, mat, color, build=None, ob=None, flat=True):
    """Add one single-material part to a model. Either a bmesh build function or a ready object."""
    n = len(MODELS.get(model, []))
    if ob is None:
        ob = bm_obj(f'{model}_{mat}_{n}', build, smooth=not flat)
    else:
        ob.name = f'{model}_{mat}_{n}'
    ob.data.materials.clear()
    ob.data.materials.append(material(mat, color))
    MODELS.setdefault(model, []).append(dict(ob=ob, mat=mat, flat=flat, color=color))
    return ob


def export_objects(path):
    out = {}
    tris = 0
    for name, parts in MODELS.items():
        recs = []
        for P in parts:
            bm = bmesh.new()
            bm.from_mesh(P['ob'].data)
            bmesh.ops.triangulate(bm, faces=bm.faces[:])
            bm.verts.index_update()
            pos = []
            for v in bm.verts:
                pos += [round(v.co.x * 1000), round(v.co.z * 1000), round(-v.co.y * 1000)]
            idx = [v.index for f in bm.faces for v in f.verts]
            bm.free()
            tris += len(idx) // 3
            rec = {'m': P['mat'], 'c': P['color'], 'p': pos, 'i': idx}
            if P['flat']:
                rec['f'] = 1
            recs.append(rec)
        out[name] = recs
    js = '// Generated by blender/objects.py. Do not edit by hand.\n'
    js += 'const OBJ_DATA = ' + json.dumps(out, separators=(',', ':')) + ';\n'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(js)
    return {'bytes': len(js), 'models': len(out), 'tris': tris}


def bounds(char):
    zs, xs = [], []
    for P in PARTS:
        if P['char'] != char:
            continue
        for v in P['ob'].data.vertices:
            zs.append(v.co.z)
            xs.append(v.co.x)
    return {'minZ': round(min(zs), 3), 'maxZ': round(max(zs), 3), 'minX': round(min(xs), 3), 'maxX': round(max(xs), 3)}
