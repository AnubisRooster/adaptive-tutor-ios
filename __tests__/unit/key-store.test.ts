import * as SecureStore from "expo-secure-store";
import { getApiKey, setApiKey, deleteApiKey } from "@/lib/key-store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
  mockDeleteItem.mockReset();
});

describe("getApiKey", () => {
  it("returns null when no key is stored", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(getApiKey("student-1")).resolves.toBeNull();
    expect(mockGetItem).toHaveBeenCalledWith("openrouter_key_student-1");
  });

  it("returns the stored key", async () => {
    mockGetItem.mockResolvedValueOnce("sk-or-test-abc");
    await expect(getApiKey("student-1")).resolves.toBe("sk-or-test-abc");
  });
});

describe("setApiKey", () => {
  it("calls setItemAsync with the prefixed key", async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await setApiKey("student-2", "sk-or-new-key");
    expect(mockSetItem).toHaveBeenCalledWith(
      "openrouter_key_student-2",
      "sk-or-new-key"
    );
  });
});

describe("deleteApiKey", () => {
  it("calls deleteItemAsync with the prefixed key", async () => {
    mockDeleteItem.mockResolvedValueOnce(undefined);
    await deleteApiKey("student-3");
    expect(mockDeleteItem).toHaveBeenCalledWith("openrouter_key_student-3");
  });
});
