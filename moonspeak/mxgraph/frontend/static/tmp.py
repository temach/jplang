import re

with open("Graph.js", "r") as f:
    graph = f.readlines()

with open("HoverIcons.js", "r") as f:
    hover = f.readlines()

suspicious = []
for line in hover:
    if "this.graph." in line:
        suspicious.append(line)

suspicious_fields = []
for line in suspicious:
    field_name = re.search("this.graph.([A-Za-z0-9_]+)", line)
    if field_name:
        field_name = field_name.group(1)
        suspicious_fields.append(field_name)
        # print(f"got {field_name} from {line}")

declarations = []
for line in graph:
    if re.search("Graph.prototype.*=", line):
        declarations.append(line)

custom_fields = []
for line in declarations:
    field_name = re.search("Graph.prototype.([A-Za-z0-9_]+)", line)
    if field_name:
        field_name = field_name.group(1)
        custom_fields.append(field_name)
        # print(f"got {field_name} from {line}")
    # else:
    #     print(f"Nothing found in {line}")

result = {}
for field in suspicious_fields:
    if field in custom_fields:
        result[field] = True
        print(f"Custom field {field}")

from pprint import pprint
pprint(result.keys())
