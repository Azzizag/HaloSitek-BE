/**
 * Unit tests - ArsipediaService
 * Fokus: validasi adminId, validasi imagePath, not found handling, call repository dengan benar.
 */

jest.mock("../domains/arsipedia/repositories/arsipedia.repository", () => ({
  isAdminExist: jest.fn(),
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const ArsipediaService = require("../domains/arsipedia/services/arsipedia.service");
const ArsipediaRepository = require("../domains/arsipedia/repositories/arsipedia.repository");

describe("ArsipediaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create()", () => {
    it("should throw 400 if adminId invalid (admin not found)", async () => {
      ArsipediaRepository.isAdminExist.mockResolvedValue(null);

      const payload = {
        adminId: "admin-1",
        title: "Judul",
        imagePath: "/uploads/a.png",
      };

      await expect(ArsipediaService.create(payload)).rejects.toMatchObject({
        message: "Invalid adminId: Admin not found",
        statusCode: 400,
      });

      expect(ArsipediaRepository.isAdminExist).toHaveBeenCalledWith("admin-1");
      expect(ArsipediaRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 if imagePath missing", async () => {
      ArsipediaRepository.isAdminExist.mockResolvedValue({ id: "admin-1" });

      const payload = {
        adminId: "admin-1",
        title: "Judul",
        imagePath: null,
      };

      await expect(ArsipediaService.create(payload)).rejects.toMatchObject({
        message: "Image is required",
        statusCode: 400,
      });

      expect(ArsipediaRepository.isAdminExist).toHaveBeenCalledWith("admin-1");
      expect(ArsipediaRepository.create).not.toHaveBeenCalled();
    });

    it("should create arsipedia when admin valid and imagePath present", async () => {
      ArsipediaRepository.isAdminExist.mockResolvedValue({ id: "admin-1" });

      const created = { id: "a1", adminId: "admin-1", imagePath: "/uploads/a.png" };
      ArsipediaRepository.create.mockResolvedValue(created);

      const payload = {
        adminId: "admin-1",
        title: "Judul",
        imagePath: "/uploads/a.png",
      };

      const result = await ArsipediaService.create(payload);

      expect(result).toEqual(created);
      expect(ArsipediaRepository.isAdminExist).toHaveBeenCalledWith("admin-1");
      expect(ArsipediaRepository.create).toHaveBeenCalledWith(payload);
    });
  });

  describe("getAll()", () => {
    it("should return list from repository", async () => {
      const list = [{ id: "a1" }, { id: "a2" }];
      ArsipediaRepository.getAll.mockResolvedValue(list);

      const result = await ArsipediaService.getAll();

      expect(result).toEqual(list);
      expect(ArsipediaRepository.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("getById()", () => {
    it("should throw 404 if entry not found", async () => {
      ArsipediaRepository.getById.mockResolvedValue(null);

      await expect(ArsipediaService.getById("a1")).rejects.toMatchObject({
        message: "Arsipedia entry not found",
        statusCode: 404,
      });

      expect(ArsipediaRepository.getById).toHaveBeenCalledWith("a1");
    });

    it("should return entry when found", async () => {
      const data = { id: "a1", title: "X" };
      ArsipediaRepository.getById.mockResolvedValue(data);

      const result = await ArsipediaService.getById("a1");

      expect(result).toEqual(data);
      expect(ArsipediaRepository.getById).toHaveBeenCalledWith("a1");
    });
  });

  describe("update()", () => {
    it("should call getById first and then update", async () => {
      const existing = { id: "a1", title: "old" };
      ArsipediaRepository.getById.mockResolvedValue(existing);

      const updated = { id: "a1", title: "new" };
      ArsipediaRepository.update.mockResolvedValue(updated);

      const result = await ArsipediaService.update("a1", { title: "new" });

      expect(result).toEqual(updated);
      expect(ArsipediaRepository.getById).toHaveBeenCalledWith("a1");
      expect(ArsipediaRepository.update).toHaveBeenCalledWith("a1", { title: "new" });
    });

    it("should throw 404 if update target not found (via getById)", async () => {
      ArsipediaRepository.getById.mockResolvedValue(null);

      await expect(ArsipediaService.update("a1", { title: "new" })).rejects.toMatchObject({
        message: "Arsipedia entry not found",
        statusCode: 404,
      });

      expect(ArsipediaRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("delete()", () => {
    it("should call getById first and then delete", async () => {
      const existing = { id: "a1" };
      ArsipediaRepository.getById.mockResolvedValue(existing);

      const deleted = { id: "a1" };
      ArsipediaRepository.delete.mockResolvedValue(deleted);

      const result = await ArsipediaService.delete("a1");

      expect(result).toEqual(deleted);
      expect(ArsipediaRepository.getById).toHaveBeenCalledWith("a1");
      expect(ArsipediaRepository.delete).toHaveBeenCalledWith("a1");
    });

    it("should throw 404 if delete target not found (via getById)", async () => {
      ArsipediaRepository.getById.mockResolvedValue(null);

      await expect(ArsipediaService.delete("a1")).rejects.toMatchObject({
        message: "Arsipedia entry not found",
        statusCode: 404,
      });

      expect(ArsipediaRepository.delete).not.toHaveBeenCalled();
    });
  });
});
