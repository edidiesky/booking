import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "booking:tour:dashboard:v1";

const STEPS = [
  { element: "[data-tour='nav-dashboard']",  popover: { title: "Dashboard",   description: "Overview of bookings, revenue, and occupancy at a glance.",          side: "right" as const } },
  { element: "[data-tour='nav-properties']", popover: { title: "Properties",  description: "Create and manage your properties and room types.",                   side: "right" as const } },
  { element: "[data-tour='nav-bookings']",   popover: { title: "Bookings",    description: "View all reservations. Check guests in and out from here.",           side: "right" as const } },
  { element: "[data-tour='nav-payments']",   popover: { title: "Payments",    description: "Track payment status across all bookings.",                           side: "right" as const } },
  { element: "[data-tour='nav-escrow']",     popover: { title: "Escrow",      description: "Monitor held funds. Released automatically on checkout.",             side: "right" as const } },
  { element: "[data-tour='nav-roles']",      popover: { title: "Roles",       description: "Assign roles to your team. Control access per user.",                 side: "right" as const } },
];

export function useDashboardTour() {
  function startTour(force = false) {
    if (!force && localStorage.getItem(STORAGE_KEY)) return;

    const steps = STEPS.filter((s) => document.querySelector(s.element));
    if (!steps.length) return;

    const d = driver({
      animate:          true,
      showProgress:     true,
      showButtons:      ["next", "previous", "close"],
      nextBtnText:      "Next →",
      prevBtnText:      "← Back",
      doneBtnText:      "Got it!",
      progressText:     "{{current}} / {{total}}",
      overlayOpacity:   0.55,
      stagePadding:     10,
      stageRadius:      6,
      onDestroyStarted: () => { localStorage.setItem(STORAGE_KEY, "1"); d.destroy(); },
      steps,
    });

    d.drive();
  }

  const resetTour = () => localStorage.removeItem(STORAGE_KEY);

  return { startTour, resetTour };
}