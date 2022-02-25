import re

def collec_defs(prefix, lines):
    defs = []
    for l in lines:
        match = re.search(f"{prefix}.prototype.([a-zA-Z0-9_]+)", l)
        if match:
            defs.extend(match.groups(1))
    return defs

def main():
    with open("Graph.js", "r") as f:
        graph = f.readlines()
    with open("mxClient.js", "r") as f:
        mxClient = f.readlines()
    with open("HoverIcons.js", "r") as f:
        hover = f.readlines()

    graph_defs = collec_defs("Graph", graph)
    mxgraph_defs = collec_defs("mxGraph", mxClient)
    hover_defs = collec_defs("HoverIcons", hover)

    # these are 100% defined in HoverIcons, but are not defined
    # via HoverIcons.prototype.XXX, so we help the algorithm a bit
    subtle_hover_defs = [
        "bbox",
        "graph",
        "elts",
        "prev",
        "mouseDownPoint",
        "startTime",
        "updateThread",
        "currentEdgeStyle",

        "resetHandler",
        "repaintHandler",

        "arrowUp",
        "arrowDown",
        "arrowLeft",
        "arrowRight",


    ]
    hover_uses = []
    for line in hover:
        uses = re.findall("this.([a-zA-Z0-9_]+)", line)
        if uses:
            hover_uses.extend(uses)

    needed_defs = []
    uniq_hover_uses = list(set(hover_uses))
    for use in uniq_hover_uses:
        # print(f"Looking at {use}")

        if use in hover_defs:
            print(f"{use} is already present in HoverIcons.js")

        # custom Graph overrides some fields from mxGraph, so prefer to take from custom Graph
        elif use in graph_defs and use in mxgraph_defs:
            msg = f">> {use} is found in both mxGraph and is overriden in custom Graph"
            print(msg)
            needed_defs.append(msg)

        elif use in graph_defs and use not in mxgraph_defs:
            msg = f">> {use} copy from custom Graph"
            print(msg)
            needed_defs.append(msg)

        elif use not in graph_defs and use in mxgraph_defs:
            msg = f">> {use} refers to mxGraph"
            print(msg)
            needed_defs.append(msg)

        elif use in subtle_hover_defs:
            print(f"{use} is subtly defined in HoverIcons.js (not via HoverIcons.prototype.XXX)")

        else:
            print(f"Error: could not find definition of {use} in Graph or mxClient or HoverIcons")

    print("\n\n")
    # sorted by last word, which is "Graph" or "mxGraph"
    for definition in sorted(needed_defs, key=lambda x: x.split()[-1]):
        print(definition)


if __name__=="__main__":
    main()
