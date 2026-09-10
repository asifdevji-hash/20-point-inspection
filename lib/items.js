// Master list of the 20 checklist items, grouped by section.
// Reconstructed from "Base [2026] 20-Point Inspection" source PDF.
// Items flagged `notify: true` correspond to the source's "Notify*" rows.

export const SECTIONS = [
  {
    name: "Inverter Maintenance",
    items: [
      { id: 1, label: "Electrical Conditions" },
      { id: 2, label: "Cabinet Enclosure(s)" },
      { id: 3, label: "Fuses" },
      { id: 4, label: "Fault Codes" },
      { id: 5, label: "Clean Intake Air Duct(s)/Verify Fan Operation" },
      { id: 6, label: "Monitoring Equipment" },
    ],
  },
  {
    name: "Module Maintenance",
    items: [
      { id: 7, label: "Micro-Fractures" },
      { id: 8, label: "Electrical Connections" },
      { id: 9, label: "String Wiring" },
      { id: 10, label: "Soiling/Build-Up" },
    ],
  },
  {
    name: "Racking/Structural Integrity",
    items: [
      { id: 11, label: "PV Racking Structure" },
      { id: 12, label: "Inverter & Electrical BOS Mount(s)" },
    ],
  },
  {
    name: "Conduit: Runs, Bodies & Fittings",
    items: [
      { id: 13, label: "Connections & Corrosion" },
      { id: 14, label: "Conduit/Conductor Wear", notify: true },
    ],
  },
  {
    name: "PV System General",
    items: [
      { id: 15, label: "Building Envelope" },
      { id: 16, label: "Component Enclosures", notify: true },
      { id: 17, label: "Shade Obstructions" },
      { id: 18, label: "Monitoring Access" },
      { id: 19, label: "Balance of System" },
      { id: 20, label: "Pest/Critter Intrusion" },
    ],
  },
];

// Flat list, used by the log/detail views.
export const ALL_ITEMS = SECTIONS.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.name }))
);

export const STATUS_OPTIONS = ["Pass", "Flag", "N/A"];
