import * as SecureStore from "expo-secure-store";
import {
  needsSetup,
  markSetupDone,
  hasCloudConsent,
  grantCloudConsent,
} from "@/lib/setup";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
});

describe("needsSetup", () => {
  it("returns true when the flag is missing", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(needsSetup("stu-1")).resolves.toBe(true);
    expect(mockGetItem).toHaveBeenCalledWith("setup_done_stu-1");
  });

  it("returns false once setup is marked done", async () => {
    mockGetItem.mockResolvedValueOnce("true");
    await expect(needsSetup("stu-1")).resolves.toBe(false);
  });

  it("returns true when the flag has been written but is not exactly 'true'", async () => {
    mockGetItem.mockResolvedValueOnce("1");
    await expect(needsSetup("stu-1")).resolves.toBe(true);
  });
});

describe("markSetupDone", () => {
  it("persists the setup flag per student", async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await markSetupDone("stu-2");
    expect(mockSetItem).toHaveBeenCalledWith("setup_done_stu-2", "true");
  });
});

describe("cloud consent", () => {
  it("is not granted by default", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    await expect(hasCloudConsent("stu-1")).resolves.toBe(false);
    expect(mockGetItem).toHaveBeenCalledWith("cloud_consent_stu-1");
  });

  it("returns true after grant", async () => {
    mockGetItem.mockResolvedValueOnce("true");
    await expect(hasCloudConsent("stu-1")).resolves.toBe(true);
  });

  it("persists the consent flag for the student", async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await grantCloudConsent("stu-3");
    expect(mockSetItem).toHaveBeenCalledWith("cloud_consent_stu-3", "true");
  });

  it("tracks consent per student, not globally", async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await grantCloudConsent("stu-4");
    expect(mockGetItem).not.toHaveBeenCalledWith("cloud_consent_stu-5");
  });
});