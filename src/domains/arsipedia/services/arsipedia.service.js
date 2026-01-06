const path = require("path");
const fs = require("fs");

function getRepo() {
  return require("../repositories/arsipedia.repository");
}

function normalizeTagsToJsonString(tags) {
  if (!tags) return "[]";

  if (Array.isArray(tags)) {
    return JSON.stringify(tags.map(String));
  }

  if (typeof tags === "string") {
    const s = tags.trim();
    if (!s) return "[]";

    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return JSON.stringify(parsed.map(String));
    } catch { }

    const arr = s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    return JSON.stringify(arr);
  }

  return "[]";
}

async function create(data) {
  const ArsipediaRepository = getRepo();

  const adminId = data.adminId;
  const imagePath = data.imagePath;

  const admin = await ArsipediaRepository.isAdminExist(adminId);
  if (!admin) {
    const error = new Error("Invalid adminId: Admin not found");
    error.statusCode = 400;
    throw error;
  }

  if (!imagePath) {
    const error = new Error("Image is required");
    error.statusCode = 400;
    throw error;
  }

  data.tags = normalizeTagsToJsonString(data.tags);
  return ArsipediaRepository.create(data);
}

async function getAll() {
  const ArsipediaRepository = getRepo();
  return ArsipediaRepository.getAll();
}

async function getById(id) {
  const ArsipediaRepository = getRepo();

  const data = await ArsipediaRepository.getById(id);
  if (!data) {
    const error = new Error("Arsipedia entry not found");
    error.statusCode = 404;
    throw error;
  }
  return data;
}

async function update(id, data) {
  const ArsipediaRepository = getRepo();

  await getById(id);
  data.tags = normalizeTagsToJsonString(data.tags);
  return ArsipediaRepository.update(id, data);
}

async function remove(id) {
  const ArsipediaRepository = getRepo();

  const existing = await getById(id);

  if (existing?.imagePath) {
    const normalized = String(existing.imagePath).replace(/\\/g, "/");
    const absPath = path.resolve(process.cwd(), normalized);

    try {
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    } catch (err) {
      console.warn("[ArsipediaService.delete] Failed deleting file:", absPath, err.message);
    }
  }

  return ArsipediaRepository.delete(id);
}

module.exports = {
  normalizeTagsToJsonString,
  create,
  getAll,
  getById,
  update,
  delete: remove,
};
