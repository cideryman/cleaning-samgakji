import fs from "node:fs";
import path from "node:path";
import {
  EXTERNAL_ASSETS,
  SPRITESHEET_ASSETS,
  TILED_MAP,
} from "../src/config/AssetsData.js";

const projectRoot = process.cwd();
const mapPath = path.join(projectRoot, TILED_MAP.path);
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));

const knownTextures = new Set([
  ...EXTERNAL_ASSETS.map((asset) => asset.key),
  ...SPRITESHEET_ASSETS.map((asset) => asset.key),
]);

const errors = [];
const warnings = [];
const progressObjects = [];
const mapObjectKeys = new Set();
const seenProgressKeys = new Set();

function getProps(object) {
  return Object.fromEntries((object.properties || []).map((property) => [property.name, property.value]));
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function addIssue(collection, message) {
  collection.push(message);
}

for (const layer of map.layers || []) {
  if (layer.type !== "objectgroup") continue;
  for (const object of layer.objects || []) {
    const props = getProps(object);
    if (layer.name === "map_objects") {
      mapObjectKeys.add(props.name || object.name);
    }
  }
}

for (const layer of map.layers || []) {
  if (layer.type !== "objectgroup") continue;

  for (const object of layer.objects || []) {
    const props = getProps(object);
    if (!isTruthy(props.progressObject)) continue;

    const label = `${layer.name}/${object.name || "(unnamed)"}`;
    const progressKey = props.progressKey || object.name;
    progressObjects.push(label);

    if (!object.name && !props.progressKey) {
      addIssue(errors, `${label}: progress object needs either an object name or progressKey.`);
    }

    if (progressKey && seenProgressKeys.has(progressKey)) {
      addIssue(errors, `${label}: duplicate progress key "${progressKey}".`);
    }
    if (progressKey) seenProgressKeys.add(progressKey);

    const isPaired = Boolean(props.dirtyTexture || props.recoveredTexture);
    if (isPaired) {
      if (!props.dirtyTexture) addIssue(warnings, `${label}: paired object has recoveredTexture but no dirtyTexture.`);
      if (!props.recoveredTexture) addIssue(warnings, `${label}: paired object has dirtyTexture but no recoveredTexture.`);
      if (props.revealAtLevel === undefined && props.dirtyShowUntilLevel === undefined && props.recoveredShowFromLevel === undefined) {
        addIssue(errors, `${label}: paired object needs revealAtLevel or explicit dirty/recovered level properties.`);
      }
    } else if (!props.texture) {
      addIssue(errors, `${label}: single progress object needs texture, or paired dirtyTexture/recoveredTexture.`);
    }

    ["texture", "dirtyTexture", "recoveredTexture"].forEach((propName) => {
      const texture = props[propName];
      if (typeof texture === "string" && texture && !knownTextures.has(texture)) {
        addIssue(errors, `${label}: unknown texture "${texture}" in ${propName}.`);
      }
    });

    if (props.replacedMapObjectKey && !mapObjectKeys.has(props.replacedMapObjectKey)) {
      addIssue(errors, `${label}: replacedMapObjectKey "${props.replacedMapObjectKey}" does not match a map_objects key.`);
    }

    ["showFromLevel", "showUntilLevel", "dirtyShowFromLevel", "dirtyShowUntilLevel", "recoveredShowFromLevel", "recoveredShowUntilLevel", "revealAtLevel"].forEach((propName) => {
      if (props[propName] === undefined || props[propName] === "") return;
      const value = Number(props[propName]);
      if (!Number.isFinite(value) || value < 1) {
        addIssue(errors, `${label}: ${propName} must be a positive number.`);
      }
    });
  }
}

console.log(`Validated ${progressObjects.length} progress object(s) in ${TILED_MAP.path}.`);

if (warnings.length) {
  console.warn("\nWarnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error("\nErrors:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log("Progress map metadata looks OK.");
}
