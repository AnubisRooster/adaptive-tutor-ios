import * as SecureStore from "expo-secure-store";

const KEY = "active_student_id";

export async function getActiveStudentId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setActiveStudentId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, id);
}

export async function clearActiveStudentId(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
