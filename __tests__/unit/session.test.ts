import * as SecureStore from "expo-secure-store";
import { getActiveStudentId, setActiveStudentId, clearActiveStudentId } from "@/lib/session";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockSet = SecureStore.setItemAsync as jest.Mock;
const mockDel = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
  mockDel.mockReset();
});

it("getActiveStudentId returns null when nothing stored", async () => {
  mockGet.mockResolvedValueOnce(null);
  await expect(getActiveStudentId()).resolves.toBeNull();
  expect(mockGet).toHaveBeenCalledWith("active_student_id");
});

it("getActiveStudentId returns the stored id", async () => {
  mockGet.mockResolvedValueOnce("stu-abc");
  await expect(getActiveStudentId()).resolves.toBe("stu-abc");
});

it("setActiveStudentId calls setItemAsync with the right key", async () => {
  mockSet.mockResolvedValueOnce(undefined);
  await setActiveStudentId("stu-xyz");
  expect(mockSet).toHaveBeenCalledWith("active_student_id", "stu-xyz");
});

it("clearActiveStudentId calls deleteItemAsync with the right key", async () => {
  mockDel.mockResolvedValueOnce(undefined);
  await clearActiveStudentId();
  expect(mockDel).toHaveBeenCalledWith("active_student_id");
});
