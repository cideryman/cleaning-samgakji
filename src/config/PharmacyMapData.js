export const PHARMACY_MAP_SOURCE = {
  width: 640,
  height: 384,
};

export const PHARMACY_MAP_OBJECTS = [
  { key: "pharmacy_poster", x: 84, y: 98, width: 54, height: 54, originY: 0.5, depthOffset: 0.04 },
  { key: "pharmacy_shelf_general", x: 222, y: 160, width: 82, height: 82, depthOffset: 0.05 },
  { key: "pharmacy_shelf_cold", x: 304, y: 160, width: 82, height: 82, depthOffset: 0.05 },
  { key: "pharmacy_shelf_care", x: 386, y: 160, width: 82, height: 82, depthOffset: 0.05 },
  { key: "pharmacy_shelf_health", x: 468, y: 160, width: 82, height: 82, depthOffset: 0.05 },
  { key: "pharmacy_prescription_drop", x: 270, y: 236, width: 54, height: 54, depthOffset: 0.14 },
  { key: "pharmacy_counter", x: 366, y: 282, width: 220, height: 118, depthOffset: 0.18 },
  { key: "pharmacy_plant", x: 570, y: 270, width: 52, height: 82, depthOffset: 0.12 },
  { key: "pharmacy_waiting_chair", x: 165, y: 318, width: 104, height: 72, depthOffset: 0.16 },
  { key: "pharmacy_medicine_bag_display", x: 486, y: 318, width: 48, height: 48, depthOffset: 0.14 },
];

export const PHARMACY_MAP_NPCS = [
  {
    key: "pharmacist_sprite",
    x: 366,
    y: 270,
    width: 64,
    height: 96,
    frame: 0,
    depthOffset: 0.28,
  },
];
