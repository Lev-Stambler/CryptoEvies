import { writable } from "svelte/store";
import type { IAPIStore, IStudentInfo } from "./interfaces";

const APIWriteable = writable({
  EvieCoin: undefined,
  address: "",
} as IAPIStore);
const StudentInfoWriteable = writable({} as Partial<IStudentInfo>);

export const APIStore = {
  subscribe: APIWriteable.subscribe,
  update: APIWriteable.update,
  set: APIWriteable.set, 
};

export const StudentInfoStore = {
  subscribe: StudentInfoWriteable.subscribe,
  update: StudentInfoWriteable.update,
};
