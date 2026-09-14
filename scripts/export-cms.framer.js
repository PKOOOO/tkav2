const colorStyles = await framer.getColorStyles();
const colorByName = Object.fromEntries(colorStyles.map(c => [c.name, c.light]));
const cols = await framer.getCollections();
const raw = {};
for (const c of cols) {
  const fields = await c.getFields();
  raw[c.name] = { fields, bySlug: {}, items: await c.getItems() };
  for (const it of raw[c.name].items) raw[c.name].bySlug[it.slug] = it;
}
// A formattedText cell whose content is a component embed (a Framer "Subject
// Card", "General Accordion", ...) reports `value: ""` through the CMS plugin
// API -- the HTML serialisation has no representation for an embed. The real
// content only shows up on the collection *item node*, as
// `$control__<field>: [{ type: "TextComponentInstance", attributes: {...} }]`.
// Read those separately, or every embed-backed field exports as empty and the
// design hides the block via isSet().
const embedsByItem = {};
for (const c of cols) {
  if (!raw[c.name].fields.some(f => f.type === "formattedText")) continue;
  for (const it of raw[c.name].items) {
    const node = await framer.agent.serialize({ id: it.id, depth: 2 });
    embedsByItem[it.id] = node.attributes ?? {};
  }
}
// Control keys are the field name normalised (e.g. "Syllabus Part 01" ->
// "$control__syllabus_part_01"), so compare on alphanumerics only.
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const embedsFor = (item, field) => {
  if (field.type !== "formattedText") return null;
  const attrs = embedsByItem[item.id];
  if (!attrs) return null;
  const key = Object.keys(attrs).find(
    k => k.startsWith("$control__") && norm(k.slice(10)) === norm(field.name)
  );
  const value = key && attrs[key];
  if (!Array.isArray(value)) return null;
  const embeds = [];
  for (const node of value) {
    // Blocks other than embeds (empty paragraphs, stray line breaks) carry no
    // content here; the HTML `value` already covers real text.
    if (node?.type !== "TextComponentInstance") continue;
    const a = node.attributes ?? {};
    const props = {};
    for (const [k, v] of Object.entries(a)) {
      if (!k.startsWith("$control__")) continue;
      // Keep empty strings. The generated components resolve a control as
      // `listItem05 ?? props.C8oax9OnP ?? "Word problems"` and then hide the
      // row with isSet(), so "" means "hidden" while dropping the prop falls
      // back to the component's design-time placeholder.
      if (v === null || v === undefined) continue;
      props[k.slice(10)] = v;
    }
    embeds.push({ component: a.component, width: a.width, props });
  }
  return embeds.length ? embeds : null;
};
const flatten = (cell) => {
  let v = cell.value;
  if (cell.type === "image" && v) return v.url;
  if (cell.type === "color" && v) return colorByName[v.name] ?? v.name;
  return v;
};
const byIdFor = (colName, item) => {
  const { fields } = raw[colName];
  const byId = {};
  for (const f of fields) {
    if (!f.name || f.type === "divider") continue;
    const cell = item.fieldData[f.id];
    if (!cell) continue;
    byId[f.id] = embedsFor(item, f) ?? flatten(cell);
    if (f.type === "collectionReference" && typeof cell.value === "string") {
      for (const other of cols) {
        const target = raw[other.name].bySlug[cell.value];
        if (!target) continue;
        for (const tf of raw[other.name].fields) {
          if (!tf.name || tf.type === "divider") continue;
          const tc = target.fieldData[tf.id];
          if (tc) byId[`${f.id}_${tf.id}`] = embedsFor(target, tf) ?? flatten(tc);
        }
        break;
      }
    }
  }
  return byId;
};
const out = {};
for (const c of cols) {
  out[c.name] = raw[c.name].items.map(it => {
    const rec = { id: it.id, slug: it.slug, byId: byIdFor(c.name, it) };
    for (const f of raw[c.name].fields) {
      if (!f.name || f.type === "divider") continue;
      const cell = it.fieldData[f.id];
      if (!cell) continue;
      let v = embedsFor(it, f);
      if (!v) {
        v = cell.value;
        if (cell.type === "image" && v) v = { url: v.url, alt: v.altText || "" };
        else if (cell.type === "color" && v) v = colorByName[v.name] ?? v.name;
      }
      if (v !== "" && v !== null && v !== undefined) rec[f.name] = v;
    }
    return rec;
  });
}
console.log(JSON.stringify(out, null, 2));
