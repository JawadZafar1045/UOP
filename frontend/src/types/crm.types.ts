export interface Lead {
  _id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  assignedTo?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  leadId: string;
  type: "call" | "email" | "note";
  note: string;
  createdBy: string;
  createdAt: string;
}

export type CreateLeadDTO = Pick<Lead, "name" | "email"> & {
  phone?: string;
  source?: string;
};

export type ActivityDTO = Pick<Activity, "type" | "note">;
