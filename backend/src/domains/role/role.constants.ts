import { SeedRole, SeedPermission, SeedRolePermission, RESOURCE, ACTION } from "../../types";

export const RESOURCE_CATEGORY_LABEL: Record<string, string> = {
  [RESOURCE.BOOKING]:    "Booking Management",
  [RESOURCE.PROPERTY]:   "Property Management",
  [RESOURCE.ROOM_TYPE]:  "Room Type Management",
  [RESOURCE.PAYMENT]:    "Payment Management",
  [RESOURCE.ESCROW]:     "Escrow Management",
  [RESOURCE.TENANT]:     "Tenant Settings",
  [RESOURCE.USER]:       "User Management",
  [RESOURCE.PERMISSION]: "Permission Management",
  [RESOURCE.ROLE]:       "Role Management",
  [RESOURCE.REPORT]:     "Reporting",
};

export const ROLE_SEED: SeedRole[] = [
  {
    name:        "Platform Admin",
    slug:        "platform:admin",
    description: "Unrestricted access to all platform resources",
    is_system:   true,
  },
  {
    name:        "Host Admin",
    slug:        "host:admin",
    description: "Full control over property, rooms, bookings and tenant settings",
    is_system:   true,
  },
  {
    name:        "Host Staff",
    slug:        "host:staff",
    description: "Can manage day-to-day bookings and check-ins",
    is_system:   true,
  },
  {
    name:        "Host Inspector",
    slug:        "host:inspector",
    description: "Read-only access to bookings and property data for auditing",
    is_system:   true,
  },
  {
    name:        "Guest",
    slug:        "guest",
    description: "Can create and manage their own bookings",
    is_system:   true,
  },
];

export const PERMISSION_SEED: SeedPermission[] = [
  // booking
  { resource: RESOURCE.BOOKING, action: ACTION.CREATE,  description: "Create a booking" },
  { resource: RESOURCE.BOOKING, action: ACTION.READ,    description: "Read booking details" },
  { resource: RESOURCE.BOOKING, action: ACTION.UPDATE,  description: "Update booking status (check-in/out)" },
  { resource: RESOURCE.BOOKING, action: ACTION.DELETE,  description: "Cancel/delete a booking" },
  { resource: RESOURCE.BOOKING, action: ACTION.APPROVE, description: "Confirm a booking after payment" },
  { resource: RESOURCE.BOOKING, action: ACTION.EXPORT,  description: "Export booking reports" },
  // property
  { resource: RESOURCE.PROPERTY, action: ACTION.CREATE, description: "Create a property" },
  { resource: RESOURCE.PROPERTY, action: ACTION.READ,   description: "Read property details" },
  { resource: RESOURCE.PROPERTY, action: ACTION.UPDATE, description: "Update a property" },
  { resource: RESOURCE.PROPERTY, action: ACTION.DELETE, description: "Archive/delete a property" },
  // room_type
  { resource: RESOURCE.ROOM_TYPE, action: ACTION.CREATE, description: "Create room types" },
  { resource: RESOURCE.ROOM_TYPE, action: ACTION.READ,   description: "Read room types" },
  { resource: RESOURCE.ROOM_TYPE, action: ACTION.UPDATE, description: "Update room types" },
  { resource: RESOURCE.ROOM_TYPE, action: ACTION.DELETE, description: "Delete room types" },
  // payment
  { resource: RESOURCE.PAYMENT, action: ACTION.READ,   description: "Read payment records" },
  { resource: RESOURCE.PAYMENT, action: ACTION.REVOKE, description: "Initiate a refund" },
  // escrow
  { resource: RESOURCE.ESCROW, action: ACTION.READ,   description: "View escrow ledger" },
  { resource: RESOURCE.ESCROW, action: ACTION.UPDATE, description: "Release or refund escrow" },
  // tenant
  { resource: RESOURCE.TENANT, action: ACTION.READ,   description: "Read tenant profile" },
  { resource: RESOURCE.TENANT, action: ACTION.UPDATE, description: "Update tenant settings" },
  { resource: RESOURCE.TENANT, action: ACTION.DELETE, description: "Suspend/delete tenant" },
  // user
  { resource: RESOURCE.USER, action: ACTION.READ,   description: "Read user profiles" },
  { resource: RESOURCE.USER, action: ACTION.UPDATE, description: "Update user accounts" },
  { resource: RESOURCE.USER, action: ACTION.DELETE, description: "Deactivate users" },
  // permission
  { resource: RESOURCE.PERMISSION, action: ACTION.READ,   description: "View permission records" },
  { resource: RESOURCE.PERMISSION, action: ACTION.ASSIGN, description: "Assign permissions to roles" },
  { resource: RESOURCE.PERMISSION, action: ACTION.REVOKE, description: "Revoke permissions from roles" },
  // role
  { resource: RESOURCE.ROLE, action: ACTION.READ,   description: "List roles" },
  { resource: RESOURCE.ROLE, action: ACTION.ASSIGN, description: "Assign roles to users" },
  { resource: RESOURCE.ROLE, action: ACTION.REVOKE, description: "Revoke user roles" },
  // report
  { resource: RESOURCE.REPORT, action: ACTION.READ,   description: "View reports" },
  { resource: RESOURCE.REPORT, action: ACTION.EXPORT, description: "Export reports" },
];

export const ROLE_PERMISSION_SEED: SeedRolePermission[] = [
  // platform:admin — everything
  ...Object.values(RESOURCE).flatMap((resource) =>
    Object.values(ACTION).map((action) => ({ role_slug: "platform:admin", resource, action }))
  ),

  // host:admin — full tenant control
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.CREATE  },
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.DELETE  },
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.APPROVE },
  { role_slug: "host:admin", resource: RESOURCE.BOOKING,    action: ACTION.EXPORT  },
  { role_slug: "host:admin", resource: RESOURCE.PROPERTY,   action: ACTION.CREATE  },
  { role_slug: "host:admin", resource: RESOURCE.PROPERTY,   action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.PROPERTY,   action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.PROPERTY,   action: ACTION.DELETE  },
  { role_slug: "host:admin", resource: RESOURCE.ROOM_TYPE,  action: ACTION.CREATE  },
  { role_slug: "host:admin", resource: RESOURCE.ROOM_TYPE,  action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.ROOM_TYPE,  action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.ROOM_TYPE,  action: ACTION.DELETE  },
  { role_slug: "host:admin", resource: RESOURCE.PAYMENT,    action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.PAYMENT,    action: ACTION.REVOKE  },
  { role_slug: "host:admin", resource: RESOURCE.ESCROW,     action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.ESCROW,     action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.TENANT,     action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.TENANT,     action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.USER,       action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.USER,       action: ACTION.UPDATE  },
  { role_slug: "host:admin", resource: RESOURCE.USER,       action: ACTION.DELETE  },
  { role_slug: "host:admin", resource: RESOURCE.ROLE,       action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.ROLE,       action: ACTION.ASSIGN  },
  { role_slug: "host:admin", resource: RESOURCE.ROLE,       action: ACTION.REVOKE  },
  { role_slug: "host:admin", resource: RESOURCE.PERMISSION, action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.REPORT,     action: ACTION.READ    },
  { role_slug: "host:admin", resource: RESOURCE.REPORT,     action: ACTION.EXPORT  },

  // host:staff — day-to-day ops, no admin actions
  { role_slug: "host:staff", resource: RESOURCE.BOOKING,   action: ACTION.READ    },
  { role_slug: "host:staff", resource: RESOURCE.BOOKING,   action: ACTION.UPDATE  },
  { role_slug: "host:staff", resource: RESOURCE.BOOKING,   action: ACTION.APPROVE },
  { role_slug: "host:staff", resource: RESOURCE.PROPERTY,  action: ACTION.READ    },
  { role_slug: "host:staff", resource: RESOURCE.ROOM_TYPE, action: ACTION.READ    },
  { role_slug: "host:staff", resource: RESOURCE.PAYMENT,   action: ACTION.READ    },
  { role_slug: "host:staff", resource: RESOURCE.ESCROW,    action: ACTION.READ    },
  { role_slug: "host:staff", resource: RESOURCE.USER,      action: ACTION.READ    },

  // host:inspector — read-only audit view
  { role_slug: "host:inspector", resource: RESOURCE.BOOKING,    action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.BOOKING,    action: ACTION.EXPORT  },
  { role_slug: "host:inspector", resource: RESOURCE.PROPERTY,   action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.ROOM_TYPE,  action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.PAYMENT,    action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.ESCROW,     action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.PERMISSION, action: ACTION.READ    },
  { role_slug: "host:inspector", resource: RESOURCE.REPORT,     action: ACTION.READ    },

  // guest — only their own bookings
  { role_slug: "guest", resource: RESOURCE.BOOKING,  action: ACTION.CREATE },
  { role_slug: "guest", resource: RESOURCE.BOOKING,  action: ACTION.READ   },
  { role_slug: "guest", resource: RESOURCE.BOOKING,  action: ACTION.DELETE },
  { role_slug: "guest", resource: RESOURCE.PAYMENT,  action: ACTION.READ   },
  { role_slug: "guest", resource: RESOURCE.PROPERTY, action: ACTION.READ   },
];
