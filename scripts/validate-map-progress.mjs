import fs from "node:fs";
import path from "node:path";
import {
  EXTERNAL_ASSETS,
  SPRITESHEET_ASSETS,
  TILED_MAP,
} from "../src/config/AssetsData.js";
import { GAME_CONFIG } from "../src/config/GameConstants.js";

const projectRoot = process.cwd();
const mapPath = path.join(projectRoot, TILED_MAP.path);
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const mapPixelWidth = (map.width || 0) * (map.tilewidth || 0);
const mapPixelHeight = (map.height || 0) * (map.tileheight || 0);

const knownTextures = new Set([
  ...EXTERNAL_ASSETS.map((asset) => asset.key),
  ...SPRITESHEET_ASSETS.map((asset) => asset.key),
]);

const errors = [];
const warnings = [];
const progressObjects = [];
const mapObjectKeys = new Set();
const mapObjectCenters = new Map();
const mapObjectNameCounts = new Map();
const seenProgressKeys = new Set();

if (mapPixelWidth > 0 && mapPixelWidth !== GAME_CONFIG.worldWidth) {
  addIssue(warnings, `Tiled map width is ${mapPixelWidth}px, but GAME_CONFIG.worldWidth is ${GAME_CONFIG.worldWidth}px.`);
}

if (mapPixelHeight > 0 && mapPixelHeight !== GAME_CONFIG.worldHeight) {
  addIssue(warnings, `Tiled map height is ${mapPixelHeight}px, but GAME_CONFIG.worldHeight is ${GAME_CONFIG.worldHeight}px.`);
}

function getProps(object) {
  return Object.fromEntries((object.properties || []).map((property) => [property.name, property.value]));
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function addIssue(collection, message) {
  collection.push(message);
}

function numberProp(props, propName) {
  if (props[propName] === undefined || props[propName] === null || props[propName] === "") return null;
  const value = Number(props[propName]);
  return Number.isFinite(value) ? value : null;
}

function estimateProgressDisplaySize(object, props) {
  const widthCandidates = [
    numberProp(props, "width"),
    numberProp(props, "displayWidth"),
    numberProp(props, "dirtyWidth"),
    numberProp(props, "recoveredWidth"),
    Number(object.width) || null,
  ].filter((value) => Number.isFinite(value) && value > 0);
  const heightCandidates = [
    numberProp(props, "height"),
    numberProp(props, "displayHeight"),
    numberProp(props, "dirtyHeight"),
    numberProp(props, "recoveredHeight"),
    Number(object.height) || null,
  ].filter((value) => Number.isFinite(value) && value > 0);

  return {
    width: widthCandidates.length ? Math.max(...widthCandidates) : 96,
    height: heightCandidates.length ? Math.max(...heightCandidates) : 96,
  };
}

for (const layer of map.layers || []) {
  if (layer.type !== "objectgroup") continue;
  for (const object of layer.objects || []) {
    const props = getProps(object);
    if (layer.name === "map_objects") {
      const objectKey = props.name || object.name;
      mapObjectKeys.add(objectKey);
      if (objectKey) {
        mapObjectNameCounts.set(objectKey, (mapObjectNameCounts.get(objectKey) || 0) + 1);
      }
      if (objectKey) {
        const originX = Number(props.originX ?? 0.5);
        const originY = Number(props.originY ?? 1);
        const displayWidth = numberProp(props, "displayWidth") ?? (Number(object.width) || 96);
        const displayHeight = numberProp(props, "displayHeight") ?? (Number(object.height) || 96);
        mapObjectCenters.set(objectKey, {
          x: object.x + (Number(object.width) || displayWidth) * originX,
          y: object.y + (Number(object.height) || displayHeight) * originY,
        });
      }
    }
  }
}

for (const [objectKey, count] of mapObjectNameCounts.entries()) {
  if (count > 1) {
    addIssue(warnings, `map_objects contains ${count} objects named "${objectKey}". Use unique names so scene.mapObjects does not overwrite references.`);
  }
}

for (const layer of map.layers || []) {
  if (layer.type !== "objectgroup") continue;

  for (const object of layer.objects || []) {
    const props = getProps(object);
    if (!isTruthy(props.progressObject)) continue;

    const label = `${layer.name}/${object.name || "(unnamed)"}`;
    const progressKey = props.progressKey || object.name;
    const displaySize = estimateProgressDisplaySize(object, props);
    progressObjects.push({
      label,
      key: progressKey || "",
      x: Math.round(object.x),
      y: Math.round(object.y),
      width: Math.round(displaySize.width),
      height: Math.round(displaySize.height),
      mode: props.dirtyTexture || props.recoveredTexture ? "paired" : "single",
      dirtyTexture: props.dirtyTexture || "",
      recoveredTexture: props.recoveredTexture || "",
      texture: props.texture || "",
      revealAtLevel: props.revealAtLevel || "",
      showUntilLevel: props.showUntilLevel || "",
      blocksMovement: isTruthy(props.blocksMovement) || isTruthy(props.dirtyBlocksMovement),
      replacedMapObjectKey: props.replacedMapObjectKey || "",
    });

    const left = object.x - displaySize.width / 2;
    const right = object.x + displaySize.width / 2;
    const top = object.y - displaySize.height;
    const bottom = object.y;
    if (mapPixelWidth > 0 && (left < 0 || right > mapPixelWidth || top < 0 || bottom > mapPixelHeight)) {
      addIssue(warnings, `${label}: estimated display footprint extends outside the map (${Math.round(left)}, ${Math.round(top)}) - (${Math.round(right)}, ${Math.round(bottom)}).`);
    }

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

    if (props.replacedMapObjectKey && mapObjectCenters.has(props.replacedMapObjectKey)) {
      const target = mapObjectCenters.get(props.replacedMapObjectKey);
      const dx = Math.abs(object.x - target.x);
      const dy = Math.abs(object.y - target.y);
      if (dx > 2 || dy > 2) {
        addIssue(warnings, `${label}: progress point is not aligned with replaced map object "${props.replacedMapObjectKey}" (dx=${Math.round(dx)}, dy=${Math.round(dy)}).`);
      }
    }

    ["showFromLevel", "showUntilLevel", "dirtyShowFromLevel", "dirtyShowUntilLevel", "recoveredShowFromLevel", "recoveredShowUntilLevel", "revealAtLevel"].forEach((propName) => {
      if (props[propName] === undefined || props[propName] === "") return;
      const value = numberProp(props, propName);
      if (!Number.isFinite(value) || value < 1) {
        addIssue(errors, `${label}: ${propName} must be a positive number.`);
      }
    });
  }
}

console.log(`Validated ${progressObjects.length} progress object(s) in ${TILED_MAP.path}.`);

if (progressObjects.length) {
  console.log("\nProgress object summary:");
  console.table(progressObjects.map((entry) => ({
    key: entry.key,
    x: entry.x,
    y: entry.y,
    size: `${entry.width}x${entry.height}`,
    mode: entry.mode,
    texture: entry.texture || `${entry.dirtyTexture} -> ${entry.recoveredTexture}`,
    reveal: entry.revealAtLevel || entry.showUntilLevel || "",
    blocks: entry.blocksMovement ? "yes" : "no",
    replaces: entry.replacedMapObjectKey,
  })));
}

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
