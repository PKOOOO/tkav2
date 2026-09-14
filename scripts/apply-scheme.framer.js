// New scheme: id -> { name, light }. Names updated so the Framer style list
// still describes what it holds. Revert data: scripts/color-styles.backup.json
const SCHEME = {
  "3c675309-91c5-4b64-a956-9189118d694b": { name: "Ice Blue",        light: "rgb(238, 244, 250)" },
  "fdb51f6b-45dc-4aed-81bb-6b8f7124dad5": { name: "Ice Blue 20%",    light: "rgba(238, 244, 250, 0.2)" },
  "6305a857-db22-42a8-bc08-cd171ff4e647": { name: "Ice Blue 60%",    light: "rgba(238, 244, 250, 0.6)" },
  "ba50d2e5-600e-4acb-b91c-6cca2f86f1d6": { name: "Dark Blue",       light: "rgb(0, 43, 91)" },
  "dbb48573-48d8-403f-ad86-7009a5265b2f": { name: "Dark Blue 20%",   light: "rgba(0, 43, 91, 0.2)" },
  "d88c44a0-507a-42e1-b318-37f7d04d3c06": { name: "Dark Blue 10%",   light: "rgba(0, 43, 91, 0.1)" },
  "864efae0-958b-4f0c-94c1-0e67aaf77b9c": { name: "Dark Blue 70%",   light: "rgba(0, 43, 91, 0.7)" },
  "a225ace6-638e-469b-9793-3ab54fcf3b3a": { name: "Deepest Blue",    light: "rgb(0, 55, 111)" },
  "e7e6c389-54de-40d3-bd41-8072dc4a41a5": { name: "Muted Navy",      light: "rgb(65, 89, 122)" },
  "1d403a9e-a47a-49fa-b259-3726165583a7": { name: "Brand Blue",      light: "rgb(28, 87, 150)" },
  "e079c459-c6e9-4577-8c52-a24b838cfa37": { name: "Pale Blue",       light: "rgb(223, 234, 246)" },
  // action pair (was the two oranges + terracotta)
  "9be2179a-d4c3-4b1c-a57e-66ad0ebb844d": { name: "Vivid Purple",    light: "rgb(106, 19, 131)" },
  "23b59c71-bcd9-4239-8358-53b6c3cc209e": { name: "Deep Purple",     light: "rgb(93, 44, 110)" },
  "225c056c-536e-4289-9276-3f52376896b4": { name: "Purple Pressed",  light: "rgb(83, 14, 104)" },
  // accent pair 1 — sky
  "78006fc2-4aed-468c-a9d5-0eb0993d6aea": { name: "Soft Sky",        light: "rgb(214, 236, 255)" },
  "d46389a1-c11a-499f-a8d1-1f5543960045": { name: "Light Blue",      light: "rgb(56, 182, 255)" },
  // accent pair 2 — azure
  "e8cec243-b334-4568-a85b-a75cea534593": { name: "Soft Azure",      light: "rgb(198, 220, 240)" },
  "5bafd284-4248-4179-8fdd-7a454d5f3ef0": { name: "Vivid Azure",     light: "rgb(0, 86, 158)" },
  // accent pair 3 — violet
  "d0e4cb96-2373-4292-a52b-0c70e08d9898": { name: "Soft Violet",     light: "rgb(230, 214, 240)" },
  "1155d13b-37e2-47ed-93ce-c08c2cfdd816": { name: "Violet",          light: "rgb(139, 59, 168)" },
  // accent pair 4 — teal (the one extension)
  "9f7780f5-af12-4101-9125-2580d35c4118": { name: "Soft Teal",       light: "rgb(207, 233, 230)" },
  "a059f435-bb0e-48c5-ac68-2aad5474e6d7": { name: "Teal",            light: "rgb(46, 143, 140)" },
  // unchanged: White, Black, Transparent, White 10%, Black 56%
};

const styles = await framer.getColorStyles();
let changed = 0, skipped = 0;
for (const style of styles) {
  const next = SCHEME[style.id];
  if (!next) { skipped++; continue; }
  await style.setAttributes({ name: next.name, light: next.light });
  console.log(`  ${String(style.name).padEnd(24)} -> ${next.name.padEnd(16)} ${next.light}`);
  changed++;
}
console.log(`\nchanged ${changed}, left alone ${skipped}`);
