/**
 * Portfolio Link Controller
 * Handle HTTP requests untuk portfolio link management
 */

const portfolioLinkService = require('../services/portfolio-link.service');
const ResponseFormatter = require('../../../utils/response-formatter');

class PortfolioLinkController {
  /**
   * Create new portfolio link
   * POST /api/architects/auth/portfolio-links
   * Protected - Requires architect authentication
   */
  async createPortfolioLink(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      const portfolioLink = await portfolioLinkService.createPortfolioLink(
        architectId,
        req.body
      );

      return ResponseFormatter.created(res, portfolioLink, 'Portfolio link created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get portfolio link by ID
   * GET /api/portfolio-links/:id
   * Public
   */
  async getPortfolioLinkById(req, res, next) {
    try {
      const { id } = req.params;

      const portfolioLink = await portfolioLinkService.getPortfolioLinkById(id);

      return ResponseFormatter.success(
        res,
        portfolioLink,
        'Portfolio link retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my portfolio links
   * GET /api/architects/auth/portfolio-links
   * Protected - Requires architect authentication
   */
  async getMyPortfolioLinks(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT

      const portfolioLinks = await portfolioLinkService.getPortfolioLinksByArchitect(architectId);

      return ResponseFormatter.success(
        res,
        portfolioLinks,
        'Portfolio links retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update portfolio link
   * PUT /api/architects/auth/portfolio-links/:id
   * Protected - Requires architect authentication
   */
  async updatePortfolioLink(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;

      const portfolioLink = await portfolioLinkService.updatePortfolioLink(
        id,
        architectId,
        req.body
      );

      return ResponseFormatter.success(res, portfolioLink, 'Portfolio link updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder portfolio links
   * POST /api/architects/auth/portfolio-links/reorder
   * Protected - Requires architect authentication
   * Body: { orderedIds: ["id1", "id2", "id3"] }
   */
  async reorderPortfolioLinks(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { orderedIds } = req.body;

      if (!orderedIds || !Array.isArray(orderedIds)) {
        return ResponseFormatter.badRequest(
          res,
          'orderedIds must be an array of portfolio link IDs'
        );
      }

      const portfolioLinks = await portfolioLinkService.reorderPortfolioLinks(
        architectId,
        orderedIds
      );

      return ResponseFormatter.success(
        res,
        portfolioLinks,
        'Portfolio links reordered successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete portfolio link
   * DELETE /api/architects/auth/portfolio-links/:id
   * Protected - Requires architect authentication
   */
  async deletePortfolioLink(req, res, next) {
    try {
      const architectId = req.user.id; // From JWT
      const { id } = req.params;

      const result = await portfolioLinkService.deletePortfolioLink(id, architectId);

      return ResponseFormatter.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortfolioLinkController();