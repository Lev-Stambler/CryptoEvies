import type { EvieCoin, } from "../types";

export enum StudentStatus {
  FullStudent,
  PendingStudent,
  None
}

export interface IAPIStore {
  EvieCoin: EvieCoin,
  address: string
}

export interface IStudentInfo {
  bal: number;
  startTime: Date;
  endTime: Date;
  address: string;
}
