/* Host-configurable row cap for the Gantt view (ADR: gantt-scroll-and-sort,
     decision 2). Default 8, matching the reference implementation's own
     default. Lives on properties, not a tenant-wide setting, a host
     with one huge property and several small ones may want different
     caps per property. */

ALTER TABLE properties ADD COLUMN IF NOT EXISTS gantt_max_visible_rooms INTEGER NOT NULL DEFAULT 8;
