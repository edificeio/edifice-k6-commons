import { UserInfo } from "./models";

export type LoadManualGroup = {
  name: string;
  users: string[];
  [k: string]: unknown;
}[];
/**
 * List of structures to create
 */
export type LoadStructures = LoadStructure[];

/**
 * Structure
 */
export interface LoadStructure {
  /**
   * Name of the structure
   */
  name: string;
  /**
   * UAI of the structure
   */
  UAI: string;
  /**
   * Name of the structures who are the parents of this structure
   */
  parents: string[];
  users: LoadUser[];
  manual_groups?: LoadManualGroup;
  [k: string]: unknown;
}
/**
 * User
 */
export interface LoadUser {
  lastName: string;
  firstName: string;
  profile: string;
  class: string[];
  preDeleted?: boolean;
  adml?: boolean;
  /**
   * Internal of of this user. It will only be used by the program reading this file, not by the ENT
   */
  id: number;
  birthDate?: string;
  ref?: number;
  [k: string]: unknown;
}

export interface UserSetupData {
  teachers: UserInfo[];
  students: UserInfo[];
  relatives: UserInfo[];
}
