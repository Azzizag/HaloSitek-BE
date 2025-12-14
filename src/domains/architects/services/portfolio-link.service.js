/**
 * Portfolio Link Service
 * Handle business logic untuk portfolio link management
 */

const { portfolioLinkRepository, architectRepository } = require('../repositories');
const ValidationHelper = require('../../../utils/validation-helper');
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} = require('../../../errors/app-errors');

class PortfolioLinkService {
  /**
   * Create new portfolio link
   * @param {String} architectId - Architect ID
   * @param {Object} linkData - Portfolio link data { url }
   * @returns {Promise<Object>} - Created portfolio link
   */
  async createPortfolioLink(architectId, linkData) {
    try {
      // Validate input
      this.validatePortfolioLinkData(linkData);

      // Verify architect exists
      await architectRepository.findByIdOrFail(architectId);

      // Check if URL already exists for this architect
      const urlExists = await portfolioLinkRepository.isUrlExists(architectId, linkData.url);
      if (urlExists) {
        throw new ConflictError('This portfolio link already exists');
      }

      // Get next order number
      const nextOrder = await portfolioLinkRepository.getNextOrder(architectId);

      // Create portfolio link
      const portfolioLink = await portfolioLinkRepository.createForArchitect(
        architectId,
        linkData.url,
        nextOrder
      );

      console.log('✅ Portfolio link created:', portfolioLink.id);

      return this.formatPortfolioLinkResponse(portfolioLink);
    } catch (error) {
      console.error('❌ Failed to create portfolio link:', error.message);
      throw error;
    }
  }

  /**
   * Validate portfolio link data
   * @param {Object} data - Portfolio link data
   * @throws {ValidationError} - If validation fails
   */
  validatePortfolioLinkData(data) {
    const errors = [];

    if (!data.url || data.url.trim() === '') {
      errors.push({ field: 'url', message: 'URL is required' });
    } else {
      // Validate URL format
      if (!ValidationHelper.isValidUrl(data.url)) {
        errors.push({ field: 'url', message: 'Invalid URL format' });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Get portfolio link by ID
   * @param {String} linkId - Portfolio link ID
   * @returns {Promise<Object>} - Portfolio link data
   */
  async getPortfolioLinkById(linkId) {
    try {
      const portfolioLink = await portfolioLinkRepository.findByIdOrFail(linkId);
      return this.formatPortfolioLinkResponse(portfolioLink);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get portfolio links by architect
   * @param {String} architectId - Architect ID
   * @returns {Promise<Array>} - Array of portfolio links
   */
  async getPortfolioLinksByArchitect(architectId) {
    try {
      const portfolioLinks = await portfolioLinkRepository.findByArchitectId(architectId);
      return portfolioLinks.map(link => this.formatPortfolioLinkResponse(link));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update portfolio link
   * @param {String} linkId - Portfolio link ID
   * @param {String} architectId - Architect ID (for authorization)
   * @param {Object} updateData - Update data { url, order }
   * @returns {Promise<Object>} - Updated portfolio link
   */
  async updatePortfolioLink(linkId, architectId, updateData) {
    try {
      // Get portfolio link
      const portfolioLink = await portfolioLinkRepository.findByIdOrFail(linkId);

      // Check ownership
      if (portfolioLink.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to update this portfolio link');
      }

      // Prepare update object
      const data = {};

      // Validate and update URL if provided
      if (updateData.url) {
        this.validatePortfolioLinkData({ url: updateData.url });

        // Check if new URL already exists (excluding current link)
        const urlExists = await portfolioLinkRepository.isUrlExists(
          architectId,
          updateData.url,
          linkId
        );
        if (urlExists) {
          throw new ConflictError('This portfolio link already exists');
        }

        data.url = updateData.url;
      }

      // Update order if provided
      if (updateData.order !== undefined) {
        data.order = parseInt(updateData.order);
      }

      // Update portfolio link
      const updated = await portfolioLinkRepository.updatePortfolioLink(linkId, data);

      console.log('✅ Portfolio link updated:', linkId);

      return this.formatPortfolioLinkResponse(updated);
    } catch (error) {
      console.error('❌ Failed to update portfolio link:', error.message);
      throw error;
    }
  }

  /**
   * Reorder portfolio links
   * @param {String} architectId - Architect ID
   * @param {Array} orderedIds - Array of portfolio link IDs in new order
   * @returns {Promise<Array>} - Reordered portfolio links
   */
  async reorderPortfolioLinks(architectId, orderedIds) {
    try {
      // Verify architect exists
      await architectRepository.findByIdOrFail(architectId);

      // Validate that all IDs belong to this architect
      for (const id of orderedIds) {
        const link = await portfolioLinkRepository.findByIdOrFail(id);
        if (link.architectId !== architectId) {
          throw new AuthorizationError('One or more portfolio links do not belong to you');
        }
      }

      // Reorder
      const reordered = await portfolioLinkRepository.reorder(orderedIds);

      console.log('✅ Portfolio links reordered');

      return reordered.map(link => this.formatPortfolioLinkResponse(link));
    } catch (error) {
      console.error('❌ Failed to reorder portfolio links:', error.message);
      throw error;
    }
  }

  /**
   * Delete portfolio link
   * @param {String} linkId - Portfolio link ID
   * @param {String} architectId - Architect ID (for authorization)
   * @returns {Promise<Object>} - Result
   */
  async deletePortfolioLink(linkId, architectId) {
    try {
      // Get portfolio link
      const portfolioLink = await portfolioLinkRepository.findByIdOrFail(linkId);

      // Check ownership
      if (portfolioLink.architectId !== architectId) {
        throw new AuthorizationError('You do not have permission to delete this portfolio link');
      }

      // Delete portfolio link
      await portfolioLinkRepository.deletePortfolioLink(linkId);

      console.log('✅ Portfolio link deleted:', linkId);

      return {
        success: true,
        message: 'Portfolio link deleted successfully',
      };
    } catch (error) {
      console.error('❌ Failed to delete portfolio link:', error.message);
      throw error;
    }
  }

  /**
   * Format portfolio link response
   * @param {Object} portfolioLink - Portfolio link object
   * @returns {Object} - Formatted portfolio link
   */
  formatPortfolioLinkResponse(portfolioLink) {
    return {
      id: portfolioLink.id,
      url: portfolioLink.url,
      order: portfolioLink.order,
      createdAt: portfolioLink.createdAt,
    };
  }
}

module.exports = new PortfolioLinkService();