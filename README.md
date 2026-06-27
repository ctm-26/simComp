# CyberSim

A **sandboxed, block-based cyber-defense simulator** for learning how malware
spreads and how defenses stop it — without writing, running, or producing any
real malicious code.

> ⚠️ **This is a simulation, not a tool.** Every "node", "file", and "packet"
> is a plain in-memory object. No block performs real I/O. The most "dangerous"
> thing the engine can do is flip a boolean on a fake object. It cannot infect,
> encrypt, or contact anything outside the page.

## What it teaches

- **Propagation** — how an infection chains from machine to machine across a
  network, and why patched/segmented machines stop it.
- **Defense** — quarantine a node and watch the spread get blocked.
- **Botnet & ransomware concepts** — at an abstract level: a fake C2 "check-in"
  counter and a simulated "encrypt" that just renames fake files.
- **Terminal/security vocabulary** — `SCAN`, `SPREAD`, `HOP`, `ENCRYPT`,
  `PHONE_HOME` map to real concepts you'll meet in security courses and CTFs.

## How it works

You assemble a program from blocks (the "instruction set") and run it against a
fake LAN of `pc-0 … pc-5`. `pc-0` is patient zero. Some nodes are "patched" and
resist infection; the defender can "quarantine" a node to block it entirely.

| Block | Meaning (all simulated) |
|-------|-------------------------|
| `SCAN` | List reachable neighbours of the current node (recon). |
| `SPREAD` | Try to infect each neighbour; patched/quarantined resist. |
| `HOP` | Move to an infected neighbour to reach deeper into the network. |
| `ENCRYPT` | "Ransomware" — rename the current node's fake files to `*.locked`. |
| `PHONE_HOME` | Count how many bots would check in to a fake C2. |

## Run it

It's a static web app — no build step, no dependencies.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or run the engine headless to see the model:

```bash
node -e "const C=require('./engine.js');
console.log(C.runProgram(['SCAN','SPREAD','HOP','SPREAD','ENCRYPT','PHONE_HOME']).log.join('\n'))"
```

## Files

- `engine.js` — the simulation core (fake network, block instruction set, runner). No I/O.
- `ui.js` — DOM glue: palette, program builder, network view, run log.
- `index.html` — the page.

## Safety boundaries (by design)

- ✅ Self-contained: the whole "world" is in-memory objects.
- ✅ No real payloads, no real networking, no real cryptography, no real file access.
- ✅ Teaches concepts **and** defense, the way CTFs and security classes do.
- ❌ Does not generate runnable malware, real exploits, or real C2 traffic.

## Roadmap (MVP → next)

- A fake terminal panel teaching real commands (`ls`, `ps`, `netstat`, `kill`)
  against the simulated OS.
- A blue-team scripting side (write detection/quarantine rules).
- Drag-and-drop block ordering and shareable lesson scenarios.
