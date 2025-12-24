/**
 * Unit tests - ArsipediaController
 * Fokus: mapping req -> payload (imagePath), panggil service, panggil formatter, error ke next()
 */

jest.mock("../domains/arsipedia/services/arsipedia.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../../src/utils/response-formatter", () => ({
  success: jest.fn(),
}));

const ArsipediaController = require("../domains/arsipedia/controllers/arsipedia.controller");
const ArsipediaService = require("../domains/arsipedia/services/arsipedia.service");
const ResponseFormatter = require("../utils/response-formatter");

describe("ArsipediaController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeRes = () => {
    const res = {};
    return res;
  };

  describe("create()", () => {
    it("should pass payload with imagePath from req.file.path and call success()", async () => {
      const req = {
        body: { adminId: "admin-1", title: "Judul" },
        file: { path: "/uploads/a.png" },
      };
      const res = makeRes();
      const next = jest.fn();

      const serviceResult = { id: "a1" };
      ArsipediaService.create.mockResolvedValue(serviceResult);

      await ArsipediaController.create(req, res, next);

      expect(ArsipediaService.create).toHaveBeenCalledWith({
        adminId: "admin-1",
        title: "Judul",
        imagePath: "/uploads/a.png",
      });
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, serviceResult, "Arsipedia created");
      expect(next).not.toHaveBeenCalled();
    });

    it("should set imagePath null when no file", async () => {
      const req = {
        body: { adminId: "admin-1", title: "Judul" },
        file: undefined,
      };
      const res = makeRes();
      const next = jest.fn();

      const serviceResult = { id: "a1" };
      ArsipediaService.create.mockResolvedValue(serviceResult);

      await ArsipediaController.create(req, res, next);

      expect(ArsipediaService.create).toHaveBeenCalledWith({
        adminId: "admin-1",
        title: "Judul",
        imagePath: null,
      });
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, serviceResult, "Arsipedia created");
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next(err) when service throws", async () => {
      const req = { body: { adminId: "admin-1" }, file: undefined };
      const res = makeRes();
      const next = jest.fn();

      const err = new Error("boom");
      ArsipediaService.create.mockRejectedValue(err);

      await ArsipediaController.create(req, res, next);

      expect(ResponseFormatter.success).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getAll()", () => {
    it("should call service and success()", async () => {
      const req = {};
      const res = makeRes();
      const next = jest.fn();

      const list = [{ id: "a1" }];
      ArsipediaService.getAll.mockResolvedValue(list);

      await ArsipediaController.getAll(req, res, next);

      expect(ArsipediaService.getAll).toHaveBeenCalledTimes(1);
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, list, "All Arsipedia fetched");
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next(err) on error", async () => {
      const req = {};
      const res = makeRes();
      const next = jest.fn();

      const err = new Error("err");
      ArsipediaService.getAll.mockRejectedValue(err);

      await ArsipediaController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getById()", () => {
    it("should call service with req.params.id and success()", async () => {
      const req = { params: { id: "a1" } };
      const res = makeRes();
      const next = jest.fn();

      const data = { id: "a1" };
      ArsipediaService.getById.mockResolvedValue(data);

      await ArsipediaController.getById(req, res, next);

      expect(ArsipediaService.getById).toHaveBeenCalledWith("a1");
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, data, "Arsipedia details fetched");
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("update()", () => {
    it("should call service update and success()", async () => {
      const req = { params: { id: "a1" }, body: { title: "new" } };
      const res = makeRes();
      const next = jest.fn();

      const updated = { id: "a1", title: "new" };
      ArsipediaService.update.mockResolvedValue(updated);

      await ArsipediaController.update(req, res, next);

      expect(ArsipediaService.update).toHaveBeenCalledWith("a1", { title: "new" });
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, updated, "Arsipedia updated");
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("delete()", () => {
    it("should call service delete and success()", async () => {
      const req = { params: { id: "a1" } };
      const res = makeRes();
      const next = jest.fn();

      const deleted = { id: "a1" };
      ArsipediaService.delete.mockResolvedValue(deleted);

      await ArsipediaController.delete(req, res, next);

      expect(ArsipediaService.delete).toHaveBeenCalledWith("a1");
      expect(ResponseFormatter.success).toHaveBeenCalledWith(res, deleted, "Arsipedia deleted");
      expect(next).not.toHaveBeenCalled();
    });
  });
});
