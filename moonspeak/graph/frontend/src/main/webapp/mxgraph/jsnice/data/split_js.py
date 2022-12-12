import argparse

parser = argparse.ArgumentParser()
parser.add_argument('filename')
args = parser.parse_args()
print(args.filename)

CHUNK_SIZE = 100000

cur_chunk_size = 0
cur_chunk_id = 0

start_idx = 0
end_idx = None

with open(args.filename, "r") as f:
    lines = f.readlines()
    for idx in range(len(lines)):
        line = lines[idx]
        cur_chunk_size += len(line)

        write_chunk = False
        try:
            if (cur_chunk_size > CHUNK_SIZE and line == "};\n") or (lines[idx + 1] == "var mxUtils =\n"):
                write_chunk = True
        except IndexError:
            write_chunk = True

        if write_chunk:
            end_idx = idx

            fname = args.filename + "_chunk_" + str(cur_chunk_id) + ".js"
            out_lines = (lines[i] for i in range(start_idx, end_idx + 1))
            with open(fname, "w") as out:
                out.writelines(out_lines)

            start_idx = idx + 1
            cur_chunk_id += 1
            cur_chunk_size = 0
