/**
 * Design Service
 * Handle business logic untuk design management
 */

const designRepository = require('../repositories/design.repository');
const { architectRepository } = require('../repositories');
const FileUploadHelper = require('../../../utils/file-upload-helper');
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  BadRequestError,
} = require('../../../errors/app-errors');

class DesignService {
  /**
   * Create new design
   * @param {String} architectId - Architect ID
   * @param {Object} designData - Design data
   * @param {Object} files - Uploaded files { foto_bangunan: [], foto_denah: [] }
   * @returns {Promise<Object>} - Created design
   */
  async createDesign(architectId, designData, files = {}) {
    try {
      // Validate input
      this.validateDesignData(designData);

      // Verify architect exists
      await architectRepository.findByIdOrFail(architectId);

      // Process uploaded files
      const foto_bangunan = files.foto_bangunan || [];
      const foto_denah = files.foto_denah || [];

      // Prepare design data
      const data = {
        title: designData.title,
        description: designData.description || null,
        kategori: designData.kategori || null,
        luas_bangunan: designData.luas_bangunan || null,
        luas_tanah: designData.luas_tanah || null,
        foto_bangunan: JSON.stringify(foto_bangunan.map(file => file.path)),
        foto_denah: JSON.stringify(foto_denah.map(file => file.path)),
      };

      // Create design
      const design = await designRepository.createForArchitect(architectId, data);

      console.log('✅ Design created:', design.id);

      // Return with formatted URLs
      return this.formatDesignResponse(design);
    } catch (error) {
      console.error('❌ Failed to create design:', error.message);
      throw error;
    }
  }

  async adminUpdateDesign(designId, updateData, files = {}) {
    // Ambil design dulu
    const design = await designRepository.findByIdOrFail(designId);

    // Validasi (kalau title diubah)
    if (updateData.title !== undefined) {
      this.validateDesignData({ title: updateData.title });
    }

    const data = {};
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.kategori !== undefined) data.kategori = updateData.kategori;
    if (updateData.luas_bangunan !== undefined) data.luas_bangunan = updateData.luas_bangunan;
    if (updateData.luas_tanah !== undefined) data.luas_tanah = updateData.luas_tanah;

    // Handle replace foto_bangunan (kalau dikirim file baru)
    if (files.foto_bangunan && files.foto_bangunan.length > 0) {
      const oldFotoBangunan = this.parseJsonArray(design.foto_bangunan);
      oldFotoBangunan.forEach(p => FileUploadHelper.deleteFile(p));
      data.foto_bangunan = JSON.stringify(files.foto_bangunan.map(f => f.path));
    }

    // Handle replace foto_denah (kalau dikirim file baru)
    if (files.foto_denah && files.foto_denah.length > 0) {
      const oldFotoDenah = this.parseJsonArray(design.foto_denah);
      oldFotoDenah.forEach(p => FileUploadHelper.deleteFile(p));
      data.foto_denah = JSON.stringify(files.foto_denah.map(f => f.path));
    }

    const updated = await designRepository.updateDesign(designId, data);
    return this.formatDesignResponse(updated);
  }

  async adminDeleteDesign(designId) {
    const design = await designRepository.findByIdOrFail(designId);

    const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
    const fotoDenah = this.parseJsonArray(design.foto_denah);

    fotoBangunan.forEach(p => FileUploadHelper.deleteFile(p));
    fotoDenah.forEach(p => FileUploadHelper.deleteFile(p));

    await designRepository.deleteDesign(designId);

    return { success: true, message: 'Design deleted successfully' };
  }

  /**
   * Get distinct kategori list (public)
   * @returns {Promise<string[]>}
   */
  async getKategoriList() {
    return await designRepository.getDistinctKategori();
  }




  /**
   * Validate design data
   * @param {Object} data - Design data
   * @throws {ValidationError} - If validation fails
   */
  validateDesignData(data) {
    const errors = [];

    if (!data.title || data.title.trim() === '') {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (data.title && data.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Get design by ID
   * @param {String} designId - Design ID
   * @param {Boolean} includeArchitect - Include architect info
   * @returns {Promise<Object>} - Design data
   */
  async getDesignById(designId, includeArchitect = false) {
    try {
      const design = includeArchitect
        ? await designRepository.findByIdWithArchitect(designId)
        : await designRepository.findByIdOrFail(designId);

      if (!design) {
        throw new NotFoundError('Design not found');
      }

      return this.formatDesignResponse(design);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get designs by architect
   * @param {String} architectId - Architect ID
   * @param {Object} options - Query options (page, limit, orderBy)
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getDesignsByArchitect(architectId, options = {}) {
    try {
      const { page = 1, limit = 10, orderBy = { createdAt: 'desc' } } = options;

      const result = await designRepository.findByArchitectId(architectId, {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
      });

      return {
        data: result.data.map(design => this.formatDesignResponse(design)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update design
   * @param {String} designId - Design ID
   * @param {String} architectId - Architect ID (for authorization)
   * @param {Object} updateData - Update data
   * @param {Object} files - Uploaded files (optional)
   * @returns {Promise<Object>} - Updated design
   */
  async updateDesign(designId, architectId, updateData, files = {}) {
    try {
      // Check if design exists and belongs to architect
      const design = await designRepository.findByIdOrFail(designId);

      if (design.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to update this design');
      }

      // Validate update data
      if (updateData.title) {
        this.validateDesignData(updateData);
      }

      // Prepare update object
      const data = {};

      if (updateData.title) data.title = updateData.title;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.kategori !== undefined) data.kategori = updateData.kategori;
      if (updateData.luas_bangunan !== undefined) data.luas_bangunan = updateData.luas_bangunan;
      if (updateData.luas_tanah !== undefined) data.luas_tanah = updateData.luas_tanah;

      // Handle new foto_bangunan
      if (files.foto_bangunan && files.foto_bangunan.length > 0) {
        // Delete old files
        const oldFotoBangunan = this.parseJsonArray(design.foto_bangunan);
        oldFotoBangunan.forEach(path => FileUploadHelper.deleteFile(path));

        // Set new files
        data.foto_bangunan = JSON.stringify(files.foto_bangunan.map(file => file.path));
      }

      // Handle new foto_denah
      if (files.foto_denah && files.foto_denah.length > 0) {
        // Delete old files
        const oldFotoDenah = this.parseJsonArray(design.foto_denah);
        oldFotoDenah.forEach(path => FileUploadHelper.deleteFile(path));

        // Set new files
        data.foto_denah = JSON.stringify(files.foto_denah.map(file => file.path));
      }

      // Update design
      const updatedDesign = await designRepository.updateDesign(designId, data);

      console.log('✅ Design updated:', designId);

      return this.formatDesignResponse(updatedDesign);
    } catch (error) {
      console.error('❌ Failed to update design:', error.message);
      throw error;
    }
  }

  /**
   * Delete design
   * @param {String} designId - Design ID
   * @param {String} architectId - Architect ID (for authorization)
   * @returns {Promise<Object>} - Result
   */
  async deleteDesign(designId, architectId) {
    try {
      // Check if design exists and belongs to architect
      const design = await designRepository.findByIdOrFail(designId);

      if (design.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to delete this design');
      }

      // Delete uploaded files
      const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
      const fotoDenah = this.parseJsonArray(design.foto_denah);

      fotoBangunan.forEach(path => FileUploadHelper.deleteFile(path));
      fotoDenah.forEach(path => FileUploadHelper.deleteFile(path));

      // Delete design
      await designRepository.deleteDesign(designId);

      console.log('✅ Design deleted:', designId);

      return {
        success: true,
        message: 'Design deleted successfully',
      };
    } catch (error) {
      console.error('❌ Failed to delete design:', error.message);
      throw error;
    }
  }

  /**
   * Get all designs (public)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllDesigns(options = {}) {
    try {
      const { page = 1, limit = 12, orderBy = { createdAt: 'desc' } } = options;

      const result = await designRepository.findAllPublic({
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
      });

      return {
        data: result.data.map(design => this.formatDesignResponse(design)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search designs (public)
   * @param {String} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  // design.service.js
  async searchDesigns({ q, kategori, city, page = 1, limit = 12 } = {}) {
    try {
      const hasAny =
        (q && q.trim()) ||
        (kategori && kategori.trim()) ||
        (city && city.trim());

      if (!hasAny) {
        return await this.getAllDesigns({ page, limit });
      }

      const result = await designRepository.searchPublic({
        q,
        kategori,
        city,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return {
        data: result.data.map((d) => this.formatDesignResponse(d)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }


  /**
   * Get designs by category
   * @param {String} kategori - Category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getDesignsByKategori(kategori, options = {}) {
    try {
      const { page = 1, limit = 12 } = options;

      const result = await designRepository.findByKategori(kategori, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return {
        data: result.data.map(design => this.formatDesignResponse(design)),
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get latest designs (public)
   * @param {Number} limit - Number of designs
   * @returns {Promise<Array>} - Array of designs
   */
  async getLatestDesigns(limit = 10) {
    try {
      const designs = await designRepository.findLatest(limit);
      return designs.map(design => this.formatDesignResponse(design));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get design statistics for architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics(architectId) {
    try {
      return await designRepository.getStatistics(architectId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format design response with file URLs
   * @param {Object} design - Design object
   * @returns {Object} - Formatted design
   */
  formatDesignResponse(design) {
    const fotoBangunan = this.parseJsonArray(design.foto_bangunan);
    const fotoDenah = this.parseJsonArray(design.foto_denah);

    return {
      id: design.id,
      title: design.title,
      description: design.description,
      kategori: design.kategori,
      luas_bangunan: design.luas_bangunan,
      luas_tanah: design.luas_tanah,
      foto_bangunan: fotoBangunan.map(path => FileUploadHelper.getFileUrl(path)),
      foto_denah: fotoDenah.map(path => FileUploadHelper.getFileUrl(path)),
      architect: design.architect ? {
        id: design.architect.id,
        name: design.architect.name,
        profilePictureUrl: design.architect.profilePictureUrl
          ? FileUploadHelper.getFileUrl(design.architect.profilePictureUrl)
          : null,
        tahunPengalaman: design.architect.tahunPengalaman,
        areaPengalaman: design.architect.areaPengalaman,
      } : undefined,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    };
  }

  /**
   * Parse JSON array safely
   * @param {String} jsonString - JSON string
   * @returns {Array} - Parsed array or empty array
   */
  parseJsonArray(jsonString) {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  }
}

module.exports = new DesignService();