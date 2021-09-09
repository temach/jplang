import os
from lxml import etree

svg_dir = "../resources/kanji-svg/"
out_dir = "../resources/kanji-svg-minimised/"

files = [f for f in os.listdir(svg_dir)]

for f in files:
    in_path = os.path.join(svg_dir, f) 
    svg = etree.parse(in_path)
    root = svg.getroot()
    bad_child = None
    for child in root:
        if "Numbers" in child.get("id"):
            bad_child = child
            break
    root.remove(bad_child)

    # print(etree.tostring(root, pretty_print=True).decode("utf-8"))

    out_path = os.path.join(out_dir, f)
    text = etree.tostring(root
            , xml_declaration=False
            , pretty_print=False
    ).decode("utf-8")
    text = text.replace("\n", "").replace("\t", "")
    with open(out_path, "w") as out_f:
        out_f.write(text)


