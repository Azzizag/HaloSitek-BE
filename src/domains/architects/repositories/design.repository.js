/**
 * Design Repository
 * Handle database operations untuk Design model (Katalog Desain Arsitek)
 */

const prisma = require('../../../config/prisma-client');
const BaseRepository = require('./base-repository');
const { NotFoundError, DatabaseError } = require('../../../errors/app-errors');

class DesignRepository extends BaseRepository {
  constructor() {
    super(prisma.design, 'Design');
  }

  /**
   * Create design for architect
   * @param {String} architectId - Architect ID
   * @param {Object} designData - Design data
   * @returns {Promise<Object>} - Created design
   */
  async createForArchitect(architectId, designData) {
    try {
      const design = await this.create({
        architectId,
        ...designData,
      });
      return design;
    } catch (error) {
      throw new DatabaseError(`Failed to create design: ${error.message}`);
    }
  }

  /**
   * Find designs by architect ID
   * @param {String} architectId - Architect ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findByArchitectId(architectId, options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        architectId,
        ...options.where,
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Find design by ID with architect info
   * @param {String} id - Design ID
   * @returns {Promise<Object|null>} - Design with architect
   */
  async findByIdWithArchitect(id) {
    return await this.findById(id, {
      architect: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePictureUrl: true,
          tahunPengalaman: true,
          areaPengalaman: true,
        },
      },
    });
  }

  /**
   * Update design
   * @param {String} id - Design ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated design
   */
  async updateDesign(id, data) {
    return await this.update(id, data);
  }

  /**
   * Delete design
   * @param {String} id - Design ID
   * @returns {Promise<Object>} - Deleted design
   */
  async deleteDesign(id) {
    return await this.delete(id);
  }

  /**
   * Delete all designs for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - { count: number }
   */
  async deleteByArchitectId(architectId) {
    return await this.deleteMany({ architectId });
  }

  /**
   * Count designs by architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Number>} - Count
   */
  async countByArchitectId(architectId) {
    return await this.count({ architectId });
  }

  /**
  * Get distinct categories from designs (public)
  * @returns {Promise<string[]>}
  */
  async getDistinctKategori() {
    try {
      const rows = await prisma.design.findMany({
        where: { kategori: { not: null } },
        select: { kategori: true },
        distinct: ["kategori"],
        orderBy: { kategori: "asc" },
      });

      return rows
        .map((r) => (r.kategori || "").trim())
        .filter(Boolean);
    } catch (error) {
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`);
    }
  }



  /**
   * Search designs (public)
   * @param {String} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async searchPublic({ q, kategori, page = 1, limit = 12 }) {
    const skip = (Number(page) - 1) * Number(limit);

    const AND = [];

    if (q && q.trim()) {
      const keyword = q.trim();
      AND.push({
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
        ],
      });
    }

    if (kategori && kategori.trim()) {
      AND.push({
        kategori: { equals: kategori.trim(), mode: "insensitive" },
      });
    }

    const where = AND.length ? { AND } : {};

    const [data, total] = await Promise.all([
      prisma.design.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          architect: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
              tahunPengalaman: true,
              areaPengalaman: true,
            },
          },
        },
      }),
      prisma.design.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }



  /**
   * Find designs by category
   * @param {String} kategori - Category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findByKategori(kategori, options = {}) {
    return await this.findWithPagination({
      ...options,
      where: {
        kategori: { equals: kategori, mode: 'insensitive' },
      },
      include: {
        architect: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Find latest designs (public)
   * @param {Number} limit - Number of designs
   * @returns {Promise<Array>} - Array of designs
   */
  async findLatest(limit = 10) {
    try {
      const designs = await prisma.design.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          architect: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
              tahunPengalaman: true,
            },
          },
        },
      });
      return designs;
    } catch (error) {
      throw new DatabaseError(`Failed to find latest designs: ${error.message}`);
    }
  }

  /**
   * Find popular designs (most viewed or featured)
   * For now, just return latest
   * TODO: Add view count or featured flag
   * @param {Number} limit - Number of designs
   * @returns {Promise<Array>} - Array of designs
   */
  async findPopular(limit = 10) {
    return await this.findLatest(limit);
  }

  /**
   * Get design statistics for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(architectId) {
    const total = await this.countByArchitectId(architectId);

    // Get category distribution
    const designs = await this.findAll({ architectId });
    const categories = designs.reduce((acc, design) => {
      const cat = design.kategori || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      categories,
    };
  }

  /**
   * Check if architect owns the design
   * @param {String} designId - Design ID
   * @param {String} architectId - Architect ID
   * @returns {Promise<Boolean>} - True if owns
   */
  async isOwnedByArchitect(designId, architectId) {
    return await this.exists({
      id: designId,
      architectId,
    });
  }

  /**
   * Find all designs with pagination (public)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async findAllPublic(options = {}) {
    return await this.findWithPagination({
      ...options,
      include: {
        architect: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            tahunPengalaman: true,
            areaPengalaman: true,
          },
        },
      },
      orderBy: options.orderBy || { createdAt: 'desc' },
    });
  }
}

module.exports = new DesignRepository();