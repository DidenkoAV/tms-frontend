export type Project = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  archived?: boolean;
  groupId: number;              
  groupName?: string;
  groupPersonal?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectCreateRequest = {
  name: string;
  code: string;
  description?: string;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string | null;
};

export type ProjectListItem = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  archived: boolean;
  groupId: number;
  groupName: string;
  groupPersonal?: boolean;
};
