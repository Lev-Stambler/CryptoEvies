import type { EvieCoin, } from "../types";

export enum StudentStatus {
  FullStudent,
  PendingStudent,
  None
}

export interface IAPIStore {
  EvieCoin: EvieCoin,
  address: string,
  reloadPage: boolean
}

export interface IStudentInfo {
  approvedToks: number;
  pendingToks: number;
  startTime: Date;
  endTime: Date;
  address: string;
}
